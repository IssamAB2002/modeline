from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="image_url",
            field=models.URLField(
                blank=True,
                help_text="External image URL (used when no uploaded image is present).",
            ),
        ),
    ]
