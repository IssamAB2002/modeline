from django.db import models


class TrustStrip(models.Model):
    icon = models.CharField(
        max_length=100, blank=True,
        help_text="Icon class name, emoji, or SVG key used by the frontend.",
    )
    label_ar = models.CharField(max_length=120)
    label_en = models.CharField(max_length=120, blank=True)
    description_ar = models.CharField(max_length=255, blank=True)
    description_en = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("sort_order",)
        verbose_name = "Trust Strip"
        verbose_name_plural = "Trust Strips"

    def __str__(self):
        return self.label_ar


class FrontSettings(models.Model):
    """Singleton holding admin-editable copy for the Home, About and Contact pages.

    Each piece of copy has an Arabic (`_ar`, primary) and English (`_en`, optional)
    variant so the frontend can render the matching language for the active locale.
    """

    # ---- Home Page ----
    home_topbar_ar = models.CharField(
        max_length=255,
        default="",
        help_text="Top announcement bar shown on every page (Arabic).",
    )
    home_topbar_en = models.CharField(
        max_length=255,
        blank=True,
        help_text="Top announcement bar shown on every page (English, optional).",
    )
    home_nav_logo_tagline_ar = models.CharField(
        max_length=100,
        blank=True,
        help_text="Small line under the logo in the nav (Arabic, e.g. 'Heritage Atelier · Since 1994').",
    )
    home_nav_logo_tagline_en = models.CharField(
        max_length=100,
        blank=True,
        help_text="Small line under the logo in the nav (English, optional).",
    )
    home_hero_eyebrow_ar = models.CharField(max_length=150, default="", help_text="Hero eyebrow text (Arabic).")
    home_hero_eyebrow_en = models.CharField(max_length=150, blank=True, help_text="Hero eyebrow text (English, optional).")
    home_hero_title_line1_ar = models.CharField(
        max_length=150,
        default="",
        help_text="First line of the hero <h1> (plain text, Arabic).",
    )
    home_hero_title_line1_en = models.CharField(
        max_length=150,
        blank=True,
        help_text="First line of the hero <h1> (plain text, English, optional).",
    )
    home_hero_title_emphasis_ar = models.CharField(
        max_length=150,
        default="",
        help_text="Middle word/phrase of the hero <h1>, rendered in <em> (Arabic).",
    )
    home_hero_title_emphasis_en = models.CharField(
        max_length=150,
        blank=True,
        help_text="Middle word/phrase of the hero <h1>, rendered in <em> (English, optional).",
    )
    home_hero_title_line3_ar = models.CharField(
        max_length=150,
        default="",
        help_text="Third line of the hero <h1> (plain text, Arabic).",
    )
    home_hero_title_line3_en = models.CharField(
        max_length=150,
        blank=True,
        help_text="Third line of the hero <h1> (plain text, English, optional).",
    )
    home_hero_subtitle_ar = models.TextField(default="", help_text="Hero subtitle (Arabic).")
    home_hero_subtitle_en = models.TextField(blank=True, help_text="Hero subtitle (English, optional).")

    # ---- About Page ----
    about_hero_title_main_ar = models.CharField(
        max_length=150,
        default="",
        help_text="Plain part of the page <h1>, e.g. 'Our' (Arabic).",
    )
    about_hero_title_main_en = models.CharField(
        max_length=150,
        blank=True,
        help_text="Plain part of the page <h1>, e.g. 'Our' (English, optional).",
    )
    about_hero_title_emphasis_ar = models.CharField(
        max_length=150,
        default="",
        help_text="Emphasized part of the page <h1>, rendered in <em>, e.g. 'Story' (Arabic).",
    )
    about_hero_title_emphasis_en = models.CharField(
        max_length=150,
        blank=True,
        help_text="Emphasized part of the page <h1>, rendered in <em>, e.g. 'Story' (English, optional).",
    )
    about_hero_subtitle_ar = models.TextField(default="", help_text="About hero subtitle (Arabic).")
    about_hero_subtitle_en = models.TextField(blank=True, help_text="About hero subtitle (English, optional).")
    about_story_title_main_ar = models.CharField(max_length=200, default="", help_text="About story title, plain part (Arabic).")
    about_story_title_main_en = models.CharField(max_length=200, blank=True, help_text="About story title, plain part (English, optional).")
    about_story_title_emphasis_ar = models.CharField(max_length=200, default="", help_text="About story title, emphasized part (Arabic).")
    about_story_title_emphasis_en = models.CharField(max_length=200, blank=True, help_text="About story title, emphasized part (English, optional).")
    about_story_paragraph_1_ar = models.TextField(default="", help_text="About story, first paragraph (Arabic).")
    about_story_paragraph_1_en = models.TextField(blank=True, help_text="About story, first paragraph (English, optional).")
    about_story_paragraph_2_ar = models.TextField(default="", help_text="About story, second paragraph (Arabic).")
    about_story_paragraph_2_en = models.TextField(blank=True, help_text="About story, second paragraph (English, optional).")

    # ---- About Page — Stats Row ----
    about_stat_1_value = models.CharField(max_length=20, default="30+", help_text="Stat 1 value, e.g. '30+'.")
    about_stat_1_label_ar = models.CharField(max_length=100, default="", help_text="Stat 1 label (Arabic).")
    about_stat_1_label_en = models.CharField(max_length=100, blank=True, help_text="Stat 1 label (English).")
    about_stat_2_value = models.CharField(max_length=20, default="6", help_text="Stat 2 value.")
    about_stat_2_label_ar = models.CharField(max_length=100, default="", help_text="Stat 2 label (Arabic).")
    about_stat_2_label_en = models.CharField(max_length=100, blank=True, help_text="Stat 2 label (English).")
    about_stat_3_value = models.CharField(max_length=20, default="48", help_text="Stat 3 value.")
    about_stat_3_label_ar = models.CharField(max_length=100, default="", help_text="Stat 3 label (Arabic).")
    about_stat_3_label_en = models.CharField(max_length=100, blank=True, help_text="Stat 3 label (English).")
    about_stat_4_value = models.CharField(max_length=20, default="4k+", help_text="Stat 4 value.")
    about_stat_4_label_ar = models.CharField(max_length=100, default="", help_text="Stat 4 label (Arabic).")
    about_stat_4_label_en = models.CharField(max_length=100, blank=True, help_text="Stat 4 label (English).")

    # ---- About Page — Story paragraph 3 ----
    about_story_paragraph_3_ar = models.TextField(default="", help_text="About story, third paragraph (Arabic).")
    about_story_paragraph_3_en = models.TextField(blank=True, help_text="About story, third paragraph (English, optional).")

    # ---- About Page — Story Image ----
    about_story_image = models.ImageField(
        upload_to='story/',
        blank=True,
        help_text="Upload story section image (takes priority over the URL field below).",
    )
    about_story_image_url = models.URLField(
        blank=True,
        help_text="Or paste a direct image URL (used if no uploaded image is set).",
    )
    about_story_image_label_ar = models.CharField(
        max_length=200, blank=True,
        help_text="Image caption shown below the photo (Arabic).",
    )
    about_story_image_label_en = models.CharField(
        max_length=200, blank=True,
        help_text="Image caption shown below the photo (English, optional).",
    )

    # ---- About Page — Intro Statement ----
    about_intro_eyebrow_ar = models.CharField(max_length=150, blank=True, help_text="About intro eyebrow text (Arabic), e.g. 'التزامنا'.")
    about_intro_eyebrow_en = models.CharField(max_length=150, blank=True, help_text="About intro eyebrow text (English, optional).")
    about_intro_title_ar = models.CharField(max_length=255, blank=True, help_text="About intro section title (Arabic). Use {{em}}…{{/em}} for emphasis.")
    about_intro_title_en = models.CharField(max_length=255, blank=True, help_text="About intro section title (English, optional).")
    about_intro_text_ar = models.TextField(blank=True, help_text="About intro paragraph (Arabic).")
    about_intro_text_en = models.TextField(blank=True, help_text="About intro paragraph (English, optional).")

    # ---- Product Page — Shipping Tab ----
    product_shipping_intro_ar = models.TextField(
        blank=True,
        help_text="Shipping tab intro paragraph (Arabic).",
    )
    product_shipping_intro_en = models.TextField(
        blank=True,
        help_text="Shipping tab intro paragraph (English, optional).",
    )
    product_shipping_algeria_ar = models.CharField(
        max_length=255,
        blank=True,
        help_text="Algeria delivery line shown as bullet (Arabic).",
    )
    product_shipping_algeria_en = models.CharField(
        max_length=255,
        blank=True,
        help_text="Algeria delivery line shown as bullet (English, optional).",
    )
    product_shipping_france_ar = models.CharField(
        max_length=255,
        blank=True,
        help_text="France & Europe delivery line shown as bullet (Arabic).",
    )
    product_shipping_france_en = models.CharField(
        max_length=255,
        blank=True,
        help_text="France & Europe delivery line shown as bullet (English, optional).",
    )
    product_shipping_tracking_ar = models.CharField(
        max_length=255,
        blank=True,
        help_text="Tracking & insurance line shown as bullet (Arabic).",
    )
    product_shipping_tracking_en = models.CharField(
        max_length=255,
        blank=True,
        help_text="Tracking & insurance line shown as bullet (English, optional).",
    )

    # ---- Contact Page ----
    contact_hero_title_main_ar = models.CharField(max_length=150, default="", help_text="Contact hero title, plain part (Arabic).")
    contact_hero_title_main_en = models.CharField(max_length=150, blank=True, help_text="Contact hero title, plain part (English, optional).")
    contact_hero_title_emphasis_ar = models.CharField(max_length=150, default="", help_text="Contact hero title, emphasized part (Arabic).")
    contact_hero_title_emphasis_en = models.CharField(max_length=150, blank=True, help_text="Contact hero title, emphasized part (English, optional).")
    contact_hero_subtitle_ar = models.TextField(default="", help_text="Contact hero subtitle (Arabic).")
    contact_hero_subtitle_en = models.TextField(blank=True, help_text="Contact hero subtitle (English, optional).")
    contact_intro_title_main_ar = models.CharField(max_length=200, default="", help_text="Contact intro title, plain part (Arabic).")
    contact_intro_title_main_en = models.CharField(max_length=200, blank=True, help_text="Contact intro title, plain part (English, optional).")
    contact_intro_title_emphasis_ar = models.CharField(max_length=200, default="", help_text="Contact intro title, emphasized part (Arabic).")
    contact_intro_title_emphasis_en = models.CharField(max_length=200, blank=True, help_text="Contact intro title, emphasized part (English, optional).")
    contact_intro_text_ar = models.TextField(default="", help_text="Contact intro statement (Arabic).")
    contact_intro_text_en = models.TextField(blank=True, help_text="Contact intro statement (English, optional).")

    class Meta:
        verbose_name = "Front Settings"
        verbose_name_plural = "Front Settings"

    def __str__(self):
        return "Front-end Site Text"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class ContactInfo(models.Model):
    """Singleton holding store contact details and social media URLs."""

    store_email = models.EmailField(default="", blank=True, help_text="Primary store email.")
    store_phone = models.CharField(max_length=30, default="", blank=True, help_text="Primary store phone.")
    store_whatsapp = models.CharField(max_length=30, default="", blank=True, help_text="WhatsApp number (digits only for wa.me link).")
    store_hours_ar = models.CharField(max_length=200, default="", blank=True, help_text="Working hours (Arabic).")
    store_hours_en = models.CharField(max_length=200, blank=True, help_text="Working hours (English).")

    facebook_url = models.URLField(blank=True, help_text="Facebook page URL.")
    instagram_url = models.URLField(blank=True, help_text="Instagram profile URL.")
    linkedin_url = models.URLField(blank=True, help_text="LinkedIn page URL.")
    whatsapp_url = models.URLField(blank=True, help_text="WhatsApp direct chat URL (e.g. https://wa.me/213555...).")

    class Meta:
        verbose_name = "Contact Info"
        verbose_name_plural = "Contact Info"

    def __str__(self):
        return "Store Contact Information"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
