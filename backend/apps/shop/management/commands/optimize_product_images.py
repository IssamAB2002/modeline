"""
Management command: python manage.py optimize_product_images

Resizes and recompresses existing Product/ProductImage files in place so
already-uploaded photos (e.g. full-resolution phone photos) become fast to
download. New uploads are optimized automatically on save; this command is
for backfilling images that were uploaded before that hook existed.
"""

from django.core.management.base import BaseCommand

from apps.shop.models import Product, ProductImage
from apps.shop.utils import optimize_image_file


class Command(BaseCommand):
    help = "Resize and recompress existing product images to reduce file size."

    def handle(self, *args, **options):
        total_before = 0
        total_after = 0

        for model, field_name in ((Product, "image"), (ProductImage, "image")):
            queryset = model.objects.exclude(**{field_name: ""})
            for obj in queryset:
                field = getattr(obj, field_name)
                if not field:
                    continue

                try:
                    size_before = field.size
                except Exception:
                    continue

                field.open()
                optimized = optimize_image_file(field)
                field.close()
                if optimized is None:
                    continue

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

        self.stdout.write(self.style.SUCCESS(
            f"Done. Total {total_before / 1024 / 1024:.2f}MB -> {total_after / 1024 / 1024:.2f}MB"
        ))
