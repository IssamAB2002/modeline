from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0016_alter_category_options_alter_product_options_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Baladia",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name_ar", models.CharField(max_length=100, verbose_name="الاسم بالعربية")),
                ("name_fr", models.CharField(max_length=100, verbose_name="الاسم بالفرنسية")),
                ("is_active", models.BooleanField(default=True, verbose_name="نشط")),
                (
                    "wilaya",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="baladias",
                        to="shop.wilaya",
                        verbose_name="الولاية",
                    ),
                ),
            ],
            options={
                "verbose_name": "بلدية",
                "verbose_name_plural": "البلديات",
                "ordering": ("name_ar",),
            },
        ),
    ]
