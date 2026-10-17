"""
Management command: python manage.py optimize_product_images

Resizes and recompresses existing Product/ProductImage/Category files in
place so already-uploaded photos (e.g. full-resolution phone photos) become
fast to download, and generates the WebP + responsive-width siblings used
for `srcset`. New uploads get both automatically on save; this command is
for backfilling files that were uploaded before those hooks existed.
"""

from django.core.management.base import BaseCommand

from apps.shop.models import Category, Product, ProductImage
from apps.shop.utils import generate_responsive_variants, optimize_image_file

# (model, field_name)
IMAGE_FIELDS = (
    (Product, "image"),
    (Product, "video_thumbnail"),
    (ProductImage, "image"),
    (Category, "image"),
)


class Command(BaseCommand):
    help = "Resize/recompress existing images and (re)generate their WebP + responsive-width variants."

    def add_arguments(self, parser):
        parser.add_argument(
            "--variants-only",
            action="store_true",
            help="Skip the resize/recompress pass and only (re)generate WebP/responsive variants.",
        )

    def handle(self, *args, **options):
        total_before = 0
        total_after = 0
        variants_generated = 0

        for model, field_name in IMAGE_FIELDS:
            queryset = model.objects.exclude(**{field_name: ""})
            for obj in queryset:
                field = getattr(obj, field_name)
                if not field:
                    continue

                if not options["variants_only"]:
                    try:
                        size_before = field.size
                    except Exception:
                        continue

                    field.open()
                    optimized = optimize_image_file(field)
                    field.close()
                    if optimized is not None:
                        old_name = field.name
                        field.save(optimized.name, optimized, save=True)
                        size_after = field.size
                        if old_name != field.name:
                            field.storage.delete(old_name)

                        total_before += size_before
                        total_after += size_after
                        self.stdout.write(
                            f"{model.__name__}#{obj.pk}: {size_before / 1024:.0f}KB -> {size_after / 1024:.0f}KB"
                        )

                generate_responsive_variants(field)
                variants_generated += 1

        if total_before or total_after:
            self.stdout.write(self.style.SUCCESS(
                f"Resized {total_before / 1024 / 1024:.2f}MB -> {total_after / 1024 / 1024:.2f}MB"
            ))
        self.stdout.write(self.style.SUCCESS(
            f"Generated WebP/responsive variants for {variants_generated} image(s)."
        ))
