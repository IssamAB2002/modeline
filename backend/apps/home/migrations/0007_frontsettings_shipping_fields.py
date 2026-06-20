from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("home", "0006_alter_frontsettings_about_intro_eyebrow_ar_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="frontsettings",
            name="product_shipping_intro_ar",
            field=models.TextField(blank=True, help_text="Shipping tab intro paragraph (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="product_shipping_intro_en",
            field=models.TextField(blank=True, help_text="Shipping tab intro paragraph (English, optional)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="product_shipping_algeria_ar",
            field=models.CharField(blank=True, max_length=255, help_text="Algeria delivery line shown as bullet (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="product_shipping_algeria_en",
            field=models.CharField(blank=True, max_length=255, help_text="Algeria delivery line shown as bullet (English, optional)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="product_shipping_france_ar",
            field=models.CharField(blank=True, max_length=255, help_text="France & Europe delivery line shown as bullet (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="product_shipping_france_en",
            field=models.CharField(blank=True, max_length=255, help_text="France & Europe delivery line shown as bullet (English, optional)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="product_shipping_tracking_ar",
            field=models.CharField(blank=True, max_length=255, help_text="Tracking & insurance line shown as bullet (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="product_shipping_tracking_en",
            field=models.CharField(blank=True, max_length=255, help_text="Tracking & insurance line shown as bullet (English, optional)."),
        ),
    ]
