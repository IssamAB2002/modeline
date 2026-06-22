from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0003_alter_order_options_alter_orderitem_options_and_more"),
    ]

    operations = [
        # Drop currency
        migrations.RemoveField(
            model_name="order",
            name="currency",
        ),
        # Add shipping_type
        migrations.AddField(
            model_name="order",
            name="shipping_type",
            field=models.CharField(
                choices=[("home", "توصيل للبيت"), ("desk", "مكتب التوصيل")],
                default="home",
                max_length=10,
                verbose_name="طريقة التوصيل",
            ),
        ),
        # Make city/address_line optional (blank + default)
        migrations.AlterField(
            model_name="order",
            name="city",
            field=models.CharField(blank=True, default="", max_length=100, verbose_name="الولاية"),
        ),
        migrations.AlterField(
            model_name="order",
            name="address_line",
            field=models.CharField(blank=True, default="", max_length=400, verbose_name="العنوان"),
        ),
        # Add size/color snapshots to OrderItem
        migrations.AddField(
            model_name="orderitem",
            name="selected_size_snapshot",
            field=models.CharField(blank=True, default="", max_length=50, verbose_name="المقاس"),
        ),
        migrations.AddField(
            model_name="orderitem",
            name="selected_color_snapshot",
            field=models.CharField(blank=True, default="", max_length=50, verbose_name="اللون"),
        ),
    ]
