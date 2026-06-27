import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0005_order_baladia"),
        ("shop", "0021_alter_product_badge"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="wilaya_ref",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                related_name="orders", to="shop.wilaya", verbose_name="الولاية (مرجع)",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="baladia_ref",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                related_name="orders", to="shop.baladia", verbose_name="البلدية (مرجع)",
            ),
        ),
        migrations.AddField(
            model_name="order",
            name="zr_parcel_id",
            field=models.UUIDField(blank=True, null=True, verbose_name="معرّف ZR للطرد"),
        ),
        migrations.AddField(
            model_name="order",
            name="zr_tracking_number",
            field=models.CharField(blank=True, default="", max_length=50, verbose_name="رقم التتبع ZR"),
        ),
        migrations.AddField(
            model_name="order",
            name="zr_posted_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="تاريخ الإرسال لـ ZR"),
        ),
    ]
