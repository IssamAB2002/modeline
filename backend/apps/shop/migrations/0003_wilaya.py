from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0002_product_image_url"),
    ]

    operations = [
        migrations.CreateModel(
            name="Wilaya",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.PositiveIntegerField(help_text="Wilaya code 1–58.", unique=True)),
                ("name_ar", models.CharField(max_length=100)),
                ("name_fr", models.CharField(max_length=100)),
                ("shipping_price_da", models.DecimalField(decimal_places=2, default=700, max_digits=8)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={
                "verbose_name": "Wilaya",
                "verbose_name_plural": "Wilayas",
                "ordering": ("code",),
            },
        ),
    ]
