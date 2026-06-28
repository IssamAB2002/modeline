from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0007_order_zr_submitted"),
    ]

    operations = [
        migrations.CreateModel(
            name="ThanksMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("body", models.TextField(verbose_name="نص الرسالة")),
                ("is_active", models.BooleanField(default=True, verbose_name="نشطة")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="آخر تعديل")),
            ],
            options={
                "verbose_name": "رسالة الشكر",
                "verbose_name_plural": "رسائل الشكر",
            },
        ),
    ]
