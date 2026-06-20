from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0004_wilaya_data"),
    ]

    operations = [
        # Category: add name_ar
        migrations.AddField(
            model_name="category",
            name="name_ar",
            field=models.CharField(
                blank=True,
                max_length=120,
                help_text="Category name in Arabic (primary language).",
            ),
        ),
        # Product: add name_ar
        migrations.AddField(
            model_name="product",
            name="name_ar",
            field=models.CharField(
                blank=True,
                max_length=220,
                help_text="Product name in Arabic (primary language).",
            ),
        ),
        # Product: add short_description_ar
        migrations.AddField(
            model_name="product",
            name="short_description_ar",
            field=models.CharField(
                blank=True,
                max_length=255,
                help_text="Short description in Arabic (primary).",
            ),
        ),
        # Product: add description_ar
        migrations.AddField(
            model_name="product",
            name="description_ar",
            field=models.TextField(
                blank=True,
                help_text="Full product narrative in Arabic (primary).",
            ),
        ),
        # Update name field help text for Category
        migrations.AlterField(
            model_name="category",
            name="name",
            field=models.CharField(
                max_length=120,
                unique=True,
                help_text="Category name in English (secondary).",
            ),
        ),
        # Update name field help text for Product
        migrations.AlterField(
            model_name="product",
            name="name",
            field=models.CharField(
                max_length=220,
                help_text="Product name in English (secondary).",
            ),
        ),
    ]
