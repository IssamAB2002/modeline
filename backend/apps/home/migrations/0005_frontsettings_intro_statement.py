from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("home", "0004_contactinfo_frontsettings_about_stat_1_label_ar_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="frontsettings",
            name="about_intro_eyebrow_ar",
            field=models.CharField(blank=True, max_length=150, help_text="About intro eyebrow text (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_intro_eyebrow_en",
            field=models.CharField(blank=True, max_length=150, help_text="About intro eyebrow text (English, optional)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_intro_title_ar",
            field=models.CharField(blank=True, max_length=255, help_text="About intro section title (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_intro_title_en",
            field=models.CharField(blank=True, max_length=255, help_text="About intro section title (English, optional)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_intro_text_ar",
            field=models.TextField(blank=True, help_text="About intro paragraph (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_intro_text_en",
            field=models.TextField(blank=True, help_text="About intro paragraph (English, optional)."),
        ),
    ]
