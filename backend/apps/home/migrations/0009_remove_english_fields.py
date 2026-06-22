from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("home", "0008_frontsettings_story_image"),
    ]

    operations = [
        # TrustStrip
        migrations.RemoveField(model_name="truststrip", name="label_en"),
        migrations.RemoveField(model_name="truststrip", name="description_en"),
        # ContactInfo
        migrations.RemoveField(model_name="contactinfo", name="store_hours_en"),
        # FrontSettings — Home
        migrations.RemoveField(model_name="frontsettings", name="home_topbar_en"),
        migrations.RemoveField(model_name="frontsettings", name="home_nav_logo_tagline_en"),
        migrations.RemoveField(model_name="frontsettings", name="home_hero_eyebrow_en"),
        migrations.RemoveField(model_name="frontsettings", name="home_hero_title_line1_en"),
        migrations.RemoveField(model_name="frontsettings", name="home_hero_title_emphasis_en"),
        migrations.RemoveField(model_name="frontsettings", name="home_hero_title_line3_en"),
        migrations.RemoveField(model_name="frontsettings", name="home_hero_subtitle_en"),
        # FrontSettings — About hero
        migrations.RemoveField(model_name="frontsettings", name="about_hero_title_main_en"),
        migrations.RemoveField(model_name="frontsettings", name="about_hero_title_emphasis_en"),
        migrations.RemoveField(model_name="frontsettings", name="about_hero_subtitle_en"),
        # FrontSettings — About story
        migrations.RemoveField(model_name="frontsettings", name="about_story_title_main_en"),
        migrations.RemoveField(model_name="frontsettings", name="about_story_title_emphasis_en"),
        migrations.RemoveField(model_name="frontsettings", name="about_story_paragraph_1_en"),
        migrations.RemoveField(model_name="frontsettings", name="about_story_paragraph_2_en"),
        migrations.RemoveField(model_name="frontsettings", name="about_story_paragraph_3_en"),
        migrations.RemoveField(model_name="frontsettings", name="about_story_image_label_en"),
        # FrontSettings — About stats
        migrations.RemoveField(model_name="frontsettings", name="about_stat_1_label_en"),
        migrations.RemoveField(model_name="frontsettings", name="about_stat_2_label_en"),
        migrations.RemoveField(model_name="frontsettings", name="about_stat_3_label_en"),
        migrations.RemoveField(model_name="frontsettings", name="about_stat_4_label_en"),
        # FrontSettings — About intro
        migrations.RemoveField(model_name="frontsettings", name="about_intro_eyebrow_en"),
        migrations.RemoveField(model_name="frontsettings", name="about_intro_title_en"),
        migrations.RemoveField(model_name="frontsettings", name="about_intro_text_en"),
        # FrontSettings — Product shipping
        migrations.RemoveField(model_name="frontsettings", name="product_shipping_intro_en"),
        migrations.RemoveField(model_name="frontsettings", name="product_shipping_algeria_en"),
        migrations.RemoveField(model_name="frontsettings", name="product_shipping_france_en"),
        migrations.RemoveField(model_name="frontsettings", name="product_shipping_tracking_en"),
        # FrontSettings — Contact hero
        migrations.RemoveField(model_name="frontsettings", name="contact_hero_title_main_en"),
        migrations.RemoveField(model_name="frontsettings", name="contact_hero_title_emphasis_en"),
        migrations.RemoveField(model_name="frontsettings", name="contact_hero_subtitle_en"),
        # FrontSettings — Contact intro
        migrations.RemoveField(model_name="frontsettings", name="contact_intro_title_main_en"),
        migrations.RemoveField(model_name="frontsettings", name="contact_intro_title_emphasis_en"),
        migrations.RemoveField(model_name="frontsettings", name="contact_intro_text_en"),
    ]
