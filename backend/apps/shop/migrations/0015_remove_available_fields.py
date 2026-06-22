from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0014_transfer_sizes_colors_data"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="product",
            name="available_sizes",
        ),
        migrations.RemoveField(
            model_name="product",
            name="available_colors",
        ),
    ]
