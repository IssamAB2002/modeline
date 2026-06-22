from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0012_alter_product_description_ar_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductSize",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=50, verbose_name="المقاس", help_text='مثال: S، M، L، XL — أو مقاس مخصص مثل "19 سنة"')),
                ("order", models.PositiveIntegerField(default=0, verbose_name="الترتيب")),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="sizes",
                        to="shop.product",
                        verbose_name="المنتج",
                    ),
                ),
            ],
            options={
                "verbose_name": "مقاس",
                "verbose_name_plural": "المقاسات",
                "ordering": ("order", "id"),
            },
        ),
        migrations.CreateModel(
            name="ProductColor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name_ar", models.CharField(max_length=80, verbose_name="اسم اللون", help_text="مثال: عاجي، بني داكن، رملي")),
                ("hex", models.CharField(default="#000000", max_length=7, verbose_name="اللون", help_text="كود اللون بصيغة #rrggbb — اختر اللون من المنتقي.")),
                ("order", models.PositiveIntegerField(default=0, verbose_name="الترتيب")),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="colors",
                        to="shop.product",
                        verbose_name="المنتج",
                    ),
                ),
            ],
            options={
                "verbose_name": "لون",
                "verbose_name_plural": "الألوان",
                "ordering": ("order", "id"),
            },
        ),
    ]
