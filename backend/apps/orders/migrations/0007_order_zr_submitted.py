from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0006_order_zr_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="zr_submitted",
            field=models.BooleanField(default=False, verbose_name="مرسَل لـ ZR"),
        ),
    ]
