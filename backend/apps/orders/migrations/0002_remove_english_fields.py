from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(model_name="orderitem", name="product_name_snapshot_en"),
    ]
