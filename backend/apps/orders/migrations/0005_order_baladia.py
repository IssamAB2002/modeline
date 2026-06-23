from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0004_order_shipping_type_orderitem_size_color_drop_currency"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="baladia",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="البلدية"),
        ),
    ]
