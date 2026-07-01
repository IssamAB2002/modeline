import io
import os

from django.core.files.base import ContentFile
from PIL import Image, ImageOps

# Longest edge for stored product images — plenty for a full-bleed zoom on any
# screen while cutting typical 12MP phone photos (4000px+) down to a sane size.
MAX_IMAGE_DIMENSION = 1600
JPEG_QUALITY = 82


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
