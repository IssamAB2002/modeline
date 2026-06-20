from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("cart", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="cartitem",
            name="selected_size",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
