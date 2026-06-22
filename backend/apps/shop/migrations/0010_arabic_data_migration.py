from django.db import migrations


def copy_name_to_name_ar(apps, schema_editor):
    """Copy English name → name_ar for any rows where name_ar is blank."""
    Category = apps.get_model("shop", "Category")
    for cat in Category.objects.filter(name_ar=""):
        cat.name_ar = cat.name
        cat.save(update_fields=["name_ar"])

    Product = apps.get_model("shop", "Product")
    for prod in Product.objects.filter(name_ar=""):
        prod.name_ar = prod.name
        prod.save(update_fields=["name_ar"])


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0009_product_available_colors"),
    ]

    operations = [
        migrations.RunPython(copy_name_to_name_ar, migrations.RunPython.noop),
    ]
