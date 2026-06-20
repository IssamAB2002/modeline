from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0007_product_review"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="details",
            field=models.TextField(
                blank=True,
                help_text="Product details — one bullet point per line (used in the Details tab).",
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="available_sizes",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='Available sizes — JSON list of strings, e.g. ["S","M","L","XL","XXL"]. '
                          "Can be anything the admin defines (XL, GM, 19 years old, etc.).",
            ),
        ),
    ]
