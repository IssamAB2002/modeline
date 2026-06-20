from django.db import migrations, models


OLD_FIELDS = [
    "home_topbar",
    "home_nav_logo_tagline",
    "home_hero_eyebrow",
    "home_hero_title_line1",
    "home_hero_title_emphasis",
    "home_hero_title_line3",
    "home_hero_subtitle",
    "about_hero_title_main",
    "about_hero_title_emphasis",
    "about_hero_subtitle",
    "about_story_title_main",
    "about_story_title_emphasis",
    "about_story_paragraph_1",
    "about_story_paragraph_2",
    "contact_hero_title_main",
    "contact_hero_title_emphasis",
    "contact_hero_subtitle",
    "contact_intro_title_main",
    "contact_intro_title_emphasis",
    "contact_intro_text",
]


def copy_existing_content(apps, schema_editor):
    """Seed the new _ar/_en pairs from the old single-language fields.

    The existing content becomes the English value (its original language) and
    is also copied into the Arabic field as a placeholder so the Arabic site
    doesn't render blank copy until an admin provides a real translation.
    """
    FrontSettings = apps.get_model("home", "FrontSettings")
    for obj in FrontSettings.objects.all():
        for field in OLD_FIELDS:
            value = getattr(obj, field)
            setattr(obj, f"{field}_en", value)
            setattr(obj, f"{field}_ar", value)
        obj.save()


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("home", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="frontsettings",
            name="home_topbar_ar",
            field=models.CharField(default="", help_text="Top announcement bar shown on every page (Arabic).", max_length=255),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_topbar_en",
            field=models.CharField(blank=True, help_text="Top announcement bar shown on every page (English, optional).", max_length=255),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_nav_logo_tagline_ar",
            field=models.CharField(blank=True, help_text="Small line under the logo in the nav (Arabic, e.g. 'Heritage Atelier · Since 1994').", max_length=100),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_nav_logo_tagline_en",
            field=models.CharField(blank=True, help_text="Small line under the logo in the nav (English, optional).", max_length=100),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_hero_eyebrow_ar",
            field=models.CharField(default="", help_text="Hero eyebrow text (Arabic).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_hero_eyebrow_en",
            field=models.CharField(blank=True, help_text="Hero eyebrow text (English, optional).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_hero_title_line1_ar",
            field=models.CharField(default="", help_text="First line of the hero <h1> (plain text, Arabic).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_hero_title_line1_en",
            field=models.CharField(blank=True, help_text="First line of the hero <h1> (plain text, English, optional).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_hero_title_emphasis_ar",
            field=models.CharField(default="", help_text="Middle word/phrase of the hero <h1>, rendered in <em> (Arabic).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_hero_title_emphasis_en",
            field=models.CharField(blank=True, help_text="Middle word/phrase of the hero <h1>, rendered in <em> (English, optional).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_hero_title_line3_ar",
            field=models.CharField(default="", help_text="Third line of the hero <h1> (plain text, Arabic).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_hero_title_line3_en",
            field=models.CharField(blank=True, help_text="Third line of the hero <h1> (plain text, English, optional).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_hero_subtitle_ar",
            field=models.TextField(default="", help_text="Hero subtitle (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="home_hero_subtitle_en",
            field=models.TextField(blank=True, help_text="Hero subtitle (English, optional)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_hero_title_main_ar",
            field=models.CharField(default="", help_text="Plain part of the page <h1>, e.g. 'Our' (Arabic).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_hero_title_main_en",
            field=models.CharField(blank=True, help_text="Plain part of the page <h1>, e.g. 'Our' (English, optional).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_hero_title_emphasis_ar",
            field=models.CharField(default="", help_text="Emphasized part of the page <h1>, rendered in <em>, e.g. 'Story' (Arabic).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_hero_title_emphasis_en",
            field=models.CharField(blank=True, help_text="Emphasized part of the page <h1>, rendered in <em>, e.g. 'Story' (English, optional).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_hero_subtitle_ar",
            field=models.TextField(default="", help_text="About hero subtitle (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_hero_subtitle_en",
            field=models.TextField(blank=True, help_text="About hero subtitle (English, optional)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_story_title_main_ar",
            field=models.CharField(default="", help_text="About story title, plain part (Arabic).", max_length=200),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_story_title_main_en",
            field=models.CharField(blank=True, help_text="About story title, plain part (English, optional).", max_length=200),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_story_title_emphasis_ar",
            field=models.CharField(default="", help_text="About story title, emphasized part (Arabic).", max_length=200),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_story_title_emphasis_en",
            field=models.CharField(blank=True, help_text="About story title, emphasized part (English, optional).", max_length=200),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_story_paragraph_1_ar",
            field=models.TextField(default="", help_text="About story, first paragraph (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_story_paragraph_1_en",
            field=models.TextField(blank=True, help_text="About story, first paragraph (English, optional)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_story_paragraph_2_ar",
            field=models.TextField(default="", help_text="About story, second paragraph (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="about_story_paragraph_2_en",
            field=models.TextField(blank=True, help_text="About story, second paragraph (English, optional)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="contact_hero_title_main_ar",
            field=models.CharField(default="", help_text="Contact hero title, plain part (Arabic).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="contact_hero_title_main_en",
            field=models.CharField(blank=True, help_text="Contact hero title, plain part (English, optional).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="contact_hero_title_emphasis_ar",
            field=models.CharField(default="", help_text="Contact hero title, emphasized part (Arabic).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="contact_hero_title_emphasis_en",
            field=models.CharField(blank=True, help_text="Contact hero title, emphasized part (English, optional).", max_length=150),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="contact_hero_subtitle_ar",
            field=models.TextField(default="", help_text="Contact hero subtitle (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="contact_hero_subtitle_en",
            field=models.TextField(blank=True, help_text="Contact hero subtitle (English, optional)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="contact_intro_title_main_ar",
            field=models.CharField(default="", help_text="Contact intro title, plain part (Arabic).", max_length=200),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="contact_intro_title_main_en",
            field=models.CharField(blank=True, help_text="Contact intro title, plain part (English, optional).", max_length=200),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="contact_intro_title_emphasis_ar",
            field=models.CharField(default="", help_text="Contact intro title, emphasized part (Arabic).", max_length=200),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="contact_intro_title_emphasis_en",
            field=models.CharField(blank=True, help_text="Contact intro title, emphasized part (English, optional).", max_length=200),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="contact_intro_text_ar",
            field=models.TextField(default="", help_text="Contact intro statement (Arabic)."),
        ),
        migrations.AddField(
            model_name="frontsettings",
            name="contact_intro_text_en",
            field=models.TextField(blank=True, help_text="Contact intro statement (English, optional)."),
        ),
        migrations.RunPython(copy_existing_content, noop_reverse),
        migrations.RemoveField(model_name="frontsettings", name="home_topbar"),
        migrations.RemoveField(model_name="frontsettings", name="home_nav_logo_tagline"),
        migrations.RemoveField(model_name="frontsettings", name="home_hero_eyebrow"),
        migrations.RemoveField(model_name="frontsettings", name="home_hero_title_line1"),
        migrations.RemoveField(model_name="frontsettings", name="home_hero_title_emphasis"),
        migrations.RemoveField(model_name="frontsettings", name="home_hero_title_line3"),
        migrations.RemoveField(model_name="frontsettings", name="home_hero_subtitle"),
        migrations.RemoveField(model_name="frontsettings", name="about_hero_title_main"),
        migrations.RemoveField(model_name="frontsettings", name="about_hero_title_emphasis"),
        migrations.RemoveField(model_name="frontsettings", name="about_hero_subtitle"),
        migrations.RemoveField(model_name="frontsettings", name="about_story_title_main"),
        migrations.RemoveField(model_name="frontsettings", name="about_story_title_emphasis"),
        migrations.RemoveField(model_name="frontsettings", name="about_story_paragraph_1"),
        migrations.RemoveField(model_name="frontsettings", name="about_story_paragraph_2"),
        migrations.RemoveField(model_name="frontsettings", name="contact_hero_title_main"),
        migrations.RemoveField(model_name="frontsettings", name="contact_hero_title_emphasis"),
        migrations.RemoveField(model_name="frontsettings", name="contact_hero_subtitle"),
        migrations.RemoveField(model_name="frontsettings", name="contact_intro_title_main"),
        migrations.RemoveField(model_name="frontsettings", name="contact_intro_title_emphasis"),
        migrations.RemoveField(model_name="frontsettings", name="contact_intro_text"),
    ]
