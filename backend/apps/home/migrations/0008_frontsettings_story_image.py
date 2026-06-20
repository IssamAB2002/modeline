from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("home", "0007_frontsettings_shipping_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="frontsettings",
            name="about_story_image",
            field=models.ImageField(blank=True, help_text="Upload story section image (takes priority over the URL field below).", upload_to="story/"),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_story_image_url",
            field=models.URLField(blank=True, help_text="Or paste a direct image URL (used if no uploaded image is set)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_story_image_label_ar",
            field=models.CharField(blank=True, help_text="Image caption shown below the photo (Arabic).", max_length=200),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_story_image_label_en",
            field=models.CharField(blank=True, help_text="Image caption shown below the photo (English, optional).", max_length=200),
        ),
    ]
