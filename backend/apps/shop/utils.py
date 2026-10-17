import io
import os
from urllib.parse import urlsplit

from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from PIL import Image, ImageOps

# Longest edge for stored product images — plenty for a full-bleed zoom on any
# screen while cutting typical 12MP phone photos (4000px+) down to a sane size.
MAX_IMAGE_DIMENSION = 1600
JPEG_QUALITY = 82
WEBP_QUALITY = 80

# Narrower widths generated alongside the main upload so templates/JS can ship
# a `srcset` instead of always downloading the full 1600px version.
RESPONSIVE_WIDTHS = (320, 640, 1024)

# Uploaded product videos aren't transcoded, so cap the raw file size to keep
# storage and page load reasonable.
MAX_VIDEO_SIZE_MB = 80

ALLOWED_EXTERNAL_IMAGE_EXTENSIONS = ("jpg", "jpeg", "png", "webp", "avif", "gif")


def validate_video_file_size(file):
    if file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024:
        raise ValidationError(f"حجم الفيديو يجب ألا يتجاوز {MAX_VIDEO_SIZE_MB} ميجابايت.")


def validate_external_image_url(url):
    """Guard rail for the external image_url/video_thumbnail_url fallback
    fields: they bypass the resize pipeline entirely, so at least make sure
    they point at a plausible image over HTTPS.
    """
    if not url:
        return
    parts = urlsplit(url)
    if parts.scheme != "https":
        raise ValidationError("الرابط يجب أن يبدأ بـ https://")
    ext = os.path.splitext(parts.path)[1].lstrip(".").lower()
    if ext and ext not in ALLOWED_EXTERNAL_IMAGE_EXTENSIONS:
        raise ValidationError("صيغة الصورة غير مدعومة في الرابط الخارجي.")


def optimize_image_file(file, max_dimension=MAX_IMAGE_DIMENSION, quality=JPEG_QUALITY):
    """Resize + recompress an uploaded image to keep product photos fast to
    download. Returns a ContentFile to replace the original, or None if the
    file can't be read as an image (left untouched in that case).
    """
    try:
        file.seek(0, os.SEEK_END)
        original_size = file.tell()
        file.seek(0)
        img = Image.open(file)
        img.load()
    except Exception:
        return None

    # Capture the format before any transform — operations like
    # exif_transpose() return a new Image with .format reset to None.
    is_png = (img.format or "").upper() == "PNG"
    fmt = "PNG" if is_png else "JPEG"

    # Respects camera orientation tags (common on phone photos) then drops
    # the EXIF block itself, which can otherwise account for many KB.
    img = ImageOps.exif_transpose(img)

    if fmt == "JPEG" and img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    width, height = img.size
    if max(width, height) > max_dimension:
        ratio = max_dimension / float(max(width, height))
        new_size = (max(1, round(width * ratio)), max(1, round(height * ratio)))
        img = img.resize(new_size, Image.LANCZOS)

    buffer = io.BytesIO()
    if fmt == "JPEG":
        img.save(buffer, format="JPEG", quality=quality, optimize=True, progressive=True)
    else:
        img.save(buffer, format="PNG", optimize=True)
    if buffer.getbuffer().nbytes >= original_size:
        return None

    buffer.seek(0)
    # Basename only: the field's upload_to already supplies the storage
    # directory, so a full path here (e.g. from an already-stored FieldFile)
    # would otherwise get that directory prepended a second time.
    base, _ext = os.path.splitext(os.path.basename(getattr(file, "name", "image")))
    new_name = f"{base}.{'png' if fmt == 'PNG' else 'jpg'}"
    return ContentFile(buffer.read(), name=new_name)


def _save_variant(storage, name, image, fmt, quality=None):
    buffer = io.BytesIO()
    save_kwargs = {"optimize": True}
    if quality is not None:
        save_kwargs["quality"] = quality
    image.save(buffer, format=fmt, **save_kwargs)
    buffer.seek(0)
    if storage.exists(name):
        storage.delete(name)
    storage.save(name, ContentFile(buffer.read()))


def generate_responsive_variants(field_file, widths=RESPONSIVE_WIDTHS):
    """Create WebP (+ smaller JPEG/PNG) siblings of an already-saved image
    field so templates/JS can build a `srcset`. Writes directly to storage
    next to the main file, named `<base>-<width>w.<ext>`, plus a full-size
    `<base>.webp`. Best-effort: failures are swallowed so a bad/missing file
    never breaks the save() that triggered this.
    """
    if not field_file or not field_file.name:
        return
    try:
        with field_file.storage.open(field_file.name, "rb") as fh:
            img = Image.open(fh)
            img.load()
    except Exception:
        return

    is_png = (img.format or "").upper() == "PNG"
    jpeg_fmt = "PNG" if is_png else "JPEG"
    jpeg_ext = "png" if is_png else "jpg"

    storage = field_file.storage
    base, _ext = os.path.splitext(field_file.name)
    original_width = img.size[0]

    try:
        _save_variant(storage, f"{base}.webp", img, "WEBP", WEBP_QUALITY)
    except Exception:
        pass

    for width in widths:
        if width >= original_width:
            continue
        ratio = width / float(original_width)
        height = max(1, round(img.size[1] * ratio))
        resized = img.resize((width, height), Image.LANCZOS)
        scaled = resized if resized.mode in ("RGB", "L", "RGBA") else resized.convert("RGB")
        try:
            _save_variant(storage, f"{base}-{width}w.webp", scaled, "WEBP", WEBP_QUALITY)
            jpeg_src = scaled if jpeg_fmt == "PNG" or scaled.mode in ("RGB", "L") else scaled.convert("RGB")
            _save_variant(storage, f"{base}-{width}w.{jpeg_ext}", jpeg_src, jpeg_fmt, JPEG_QUALITY if jpeg_fmt == "JPEG" else None)
        except Exception:
            continue


def get_webp_url(field_file):
    """Return the URL of the full-size WebP sibling of an image field, or
    None if it hasn't been generated (yet)."""
    if not field_file or not field_file.name:
        return None
    storage = field_file.storage
    base, _ext = os.path.splitext(field_file.name)
    webp_name = f"{base}.webp"
    if storage.exists(webp_name):
        return storage.url(webp_name)
    return None


def get_responsive_sources(field_file, widths=RESPONSIVE_WIDTHS):
    """Return {"webp_srcset", "fallback_srcset"} for an image field's
    generated variants, checking storage so a missing/ungenerated variant is
    silently skipped instead of producing a 404 in the `srcset`.
    """
    if not field_file or not field_file.name:
        return None
    storage = field_file.storage
    base, ext = os.path.splitext(field_file.name)
    fallback_ext = ext.lstrip(".") or "jpg"

    webp_entries = []
    fallback_entries = []
    for width in widths:
        webp_name = f"{base}-{width}w.webp"
        fallback_name = f"{base}-{width}w.{fallback_ext}"
        if storage.exists(webp_name):
            webp_entries.append(f"{storage.url(webp_name)} {width}w")
        if storage.exists(fallback_name):
            fallback_entries.append(f"{storage.url(fallback_name)} {width}w")

    full_webp = f"{base}.webp"
    if storage.exists(full_webp):
        webp_entries.append(f"{storage.url(full_webp)} {MAX_IMAGE_DIMENSION}w")

    if not webp_entries and not fallback_entries:
        return None
    return {
        "webp_srcset": ", ".join(webp_entries) if webp_entries else "",
        "fallback_srcset": ", ".join(fallback_entries) if fallback_entries else "",
    }
