from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("cart", "0002_cartitem_selected_size_max_length"),
    ]

    operations = [
        migrations.RemoveField(model_name="cartitem", name="product_name_snapshot_en"),
    ]
