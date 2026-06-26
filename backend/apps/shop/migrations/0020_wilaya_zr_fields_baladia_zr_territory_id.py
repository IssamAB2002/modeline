from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0019_product_category_optional'),
    ]

    operations = [
        migrations.AddField(
            model_name='wilaya',
            name='zr_territory_id',
            field=models.UUIDField(blank=True, null=True, unique=True, verbose_name='معرّف ZR للولاية'),
        ),
        migrations.AddField(
            model_name='wilaya',
            name='shipping_price_home_da',
            field=models.DecimalField(decimal_places=2, default=700, max_digits=8, verbose_name='سعر الشحن للبيت (دج)'),
        ),
        migrations.AddField(
            model_name='wilaya',
            name='shipping_price_desk_da',
            field=models.DecimalField(decimal_places=2, default=450, max_digits=8, verbose_name='سعر الشحن للمكتب (دج)'),
        ),
        migrations.AddField(
            model_name='baladia',
            name='zr_territory_id',
            field=models.UUIDField(blank=True, null=True, unique=True, verbose_name='معرّف ZR للبلدية'),
        ),
    ]
