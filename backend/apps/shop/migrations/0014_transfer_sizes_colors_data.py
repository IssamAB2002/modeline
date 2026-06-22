"""
Data migration: move existing available_sizes / available_colors JSON data
into the new ProductSize and ProductColor tables.
"""
from django.db import migrations


def transfer_sizes_and_colors(apps, schema_editor):
    Product = apps.get_model("shop", "Product")
    ProductSize = apps.get_model("shop", "ProductSize")
    ProductColor = apps.get_model("shop", "ProductColor")

    for product in Product.objects.all():
        # Sizes — stored as a JSON list of strings, e.g. ["S", "M", "L"]
        sizes = product.available_sizes or []
        if isinstance(sizes, list):
            for order, name in enumerate(sizes):
                if isinstance(name, str) and name.strip():
                    ProductSize.objects.create(
                        product=product,
                        name=name.strip(),
                        order=order,
                    )

        # Colors — stored as a JSON list of {"name": "...", "hex": "..."} dicts
        colors = product.available_colors or []
        if isinstance(colors, list):
            for order, color in enumerate(colors):
                if isinstance(color, dict):
                    name_ar = (color.get("name") or color.get("name_ar") or "").strip()
                    hex_val = (color.get("hex") or "#000000").strip()
                    if name_ar:
                        ProductColor.objects.create(
                            product=product,
                            name_ar=name_ar,
                            hex=hex_val,
                            order=order,
                        )


def reverse_transfer(apps, schema_editor):
    ProductSize = apps.get_model("shop", "ProductSize")
    ProductColor = apps.get_model("shop", "ProductColor")
    ProductSize.objects.all().delete()
    ProductColor.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0013_add_productsize_productcolor"),
    ]

    operations = [
        migrations.RunPython(transfer_sizes_and_colors, reverse_transfer),
    ]
