from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0008_product_details_available_sizes"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="available_colors",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='Product colours — JSON list of {"name": "…", "hex": "#rrggbb"} objects. '
                'Example: [{"name": "Ivory", "hex": "#F5F0E8"}, {"name": "Espresso", "hex": "#2C1A08"}]. '
                "Leave empty to hide the colour selector.",
            ),
        ),
    ]
