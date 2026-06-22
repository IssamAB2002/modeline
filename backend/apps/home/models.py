from django.db import models


class TrustStrip(models.Model):
    icon = models.CharField(
        max_length=100, blank=True,
        verbose_name='الأيقونة',
        help_text="Icon class name, emoji, or SVG key used by the frontend.",
    )
    label_ar = models.CharField(max_length=120, verbose_name='التسمية')
    description_ar = models.CharField(max_length=255, blank=True, verbose_name='الوصف')
    sort_order = models.PositiveIntegerField(default=0, verbose_name='الترتيب')
    is_active = models.BooleanField(default=True, verbose_name='نشط')

    class Meta:
        ordering = ("sort_order",)
        verbose_name = "شريط الثقة"
        verbose_name_plural = "أشرطة الثقة"

    def __str__(self):
        return self.label_ar


class FrontSettings(models.Model):
    """Singleton holding admin-editable Arabic copy for the Home, About and Contact pages."""

    # ---- Home Page ----
    home_topbar_ar = models.CharField(
        max_length=255,
        default="",
        verbose_name='شريط الإعلان العلوي',
        help_text="Top announcement bar shown on every page (Arabic).",
    )
    home_nav_logo_tagline_ar = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='شعار التنقل الفرعي',
        help_text="Small line under the logo in the nav (Arabic).",
    )
    home_hero_eyebrow_ar = models.CharField(max_length=150, default="", verbose_name='نص فوق العنوان (الرئيسية)', help_text="Hero eyebrow text (Arabic).")
    home_hero_title_line1_ar = models.CharField(
        max_length=150,
        default="",
        verbose_name='عنوان البطل – السطر الأول',
        help_text="First line of the hero <h1> (Arabic).",
    )
    home_hero_title_emphasis_ar = models.CharField(
        max_length=150,
        default="",
        verbose_name='عنوان البطل – الجزء المميز',
        help_text="Middle word/phrase of the hero <h1>, rendered in <em> (Arabic).",
    )
    home_hero_title_line3_ar = models.CharField(
        max_length=150,
        default="",
        verbose_name='عنوان البطل – السطر الثالث',
        help_text="Third line of the hero <h1> (Arabic).",
    )
    home_hero_subtitle_ar = models.TextField(default="", verbose_name='وصف البطل (الرئيسية)', help_text="Hero subtitle (Arabic).")

    # ---- About Page ----
    about_hero_title_main_ar = models.CharField(
        max_length=150,
        default="",
        verbose_name='عنوان صفحة من نحن – الجزء العادي',
        help_text="Plain part of the page <h1> (Arabic).",
    )
    about_hero_title_emphasis_ar = models.CharField(
        max_length=150,
        default="",
        verbose_name='عنوان صفحة من نحن – الجزء المميز',
        help_text="Emphasized part of the page <h1>, rendered in <em> (Arabic).",
    )
    about_hero_subtitle_ar = models.TextField(default="", verbose_name='وصف بطل من نحن', help_text="About hero subtitle (Arabic).")
    about_story_title_main_ar = models.CharField(max_length=200, default="", verbose_name='عنوان القصة – الجزء العادي', help_text="About story title, plain part (Arabic).")
    about_story_title_emphasis_ar = models.CharField(max_length=200, default="", verbose_name='عنوان القصة – الجزء المميز', help_text="About story title, emphasized part (Arabic).")
    about_story_paragraph_1_ar = models.TextField(default="", verbose_name='فقرة القصة 1', help_text="About story, first paragraph (Arabic).")
    about_story_paragraph_2_ar = models.TextField(default="", verbose_name='فقرة القصة 2', help_text="About story, second paragraph (Arabic).")

    # ---- About Page — Stats Row ----
    about_stat_1_value = models.CharField(max_length=20, default="30+", verbose_name='قيمة الإحصاء 1', help_text="Stat 1 value, e.g. '30+'.")
    about_stat_1_label_ar = models.CharField(max_length=100, default="", verbose_name='تسمية الإحصاء 1', help_text="Stat 1 label (Arabic).")
    about_stat_2_value = models.CharField(max_length=20, default="6", verbose_name='قيمة الإحصاء 2', help_text="Stat 2 value.")
    about_stat_2_label_ar = models.CharField(max_length=100, default="", verbose_name='تسمية الإحصاء 2', help_text="Stat 2 label (Arabic).")
    about_stat_3_value = models.CharField(max_length=20, default="48", verbose_name='قيمة الإحصاء 3', help_text="Stat 3 value.")
    about_stat_3_label_ar = models.CharField(max_length=100, default="", verbose_name='تسمية الإحصاء 3', help_text="Stat 3 label (Arabic).")
    about_stat_4_value = models.CharField(max_length=20, default="4k+", verbose_name='قيمة الإحصاء 4', help_text="Stat 4 value.")
    about_stat_4_label_ar = models.CharField(max_length=100, default="", verbose_name='تسمية الإحصاء 4', help_text="Stat 4 label (Arabic).")

    # ---- About Page — Story paragraph 3 ----
    about_story_paragraph_3_ar = models.TextField(default="", verbose_name='فقرة القصة 3', help_text="About story, third paragraph (Arabic).")

    # ---- About Page — Story Image ----
    about_story_image = models.ImageField(
        upload_to='story/',
        blank=True,
        verbose_name='صورة القصة',
        help_text="Upload story section image (takes priority over the URL field below).",
    )
    about_story_image_url = models.URLField(
        blank=True,
        verbose_name='رابط صورة القصة',
        help_text="Or paste a direct image URL (used if no uploaded image is set).",
    )
    about_story_image_label_ar = models.CharField(
        max_length=200, blank=True,
        verbose_name='تعليق الصورة',
        help_text="Image caption shown below the photo (Arabic).",
    )

    # ---- About Page — Intro Statement ----
    about_intro_eyebrow_ar = models.CharField(max_length=150, blank=True, verbose_name='نص فوق عنوان مقدمة من نحن', help_text="About intro eyebrow text (Arabic).")
    about_intro_title_ar = models.CharField(max_length=255, blank=True, verbose_name='عنوان مقدمة من نحن', help_text="About intro section title (Arabic). Use {{em}}…{{/em}} for emphasis.")
    about_intro_text_ar = models.TextField(blank=True, verbose_name='نص مقدمة من نحن', help_text="About intro paragraph (Arabic).")

    # ---- Product Page — Shipping Tab ----
    product_shipping_intro_ar = models.TextField(
        blank=True,
        verbose_name='مقدمة تبويب الشحن',
        help_text="Shipping tab intro paragraph (Arabic).",
    )
    product_shipping_algeria_ar = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='خط التوصيل – الجزائر',
        help_text="Algeria delivery line shown as bullet (Arabic).",
    )
    product_shipping_france_ar = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='خط التوصيل – فرنسا وأوروبا',
        help_text="France & Europe delivery line shown as bullet (Arabic).",
    )
    product_shipping_tracking_ar = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='خط التتبع والتأمين',
        help_text="Tracking & insurance line shown as bullet (Arabic).",
    )

    # ---- Contact Page ----
    contact_hero_title_main_ar = models.CharField(max_length=150, default="", verbose_name='عنوان بطل التواصل – الجزء العادي', help_text="Contact hero title, plain part (Arabic).")
    contact_hero_title_emphasis_ar = models.CharField(max_length=150, default="", verbose_name='عنوان بطل التواصل – الجزء المميز', help_text="Contact hero title, emphasized part (Arabic).")
    contact_hero_subtitle_ar = models.TextField(default="", verbose_name='وصف بطل التواصل', help_text="Contact hero subtitle (Arabic).")
    contact_intro_title_main_ar = models.CharField(max_length=200, default="", verbose_name='عنوان مقدمة التواصل – الجزء العادي', help_text="Contact intro title, plain part (Arabic).")
    contact_intro_title_emphasis_ar = models.CharField(max_length=200, default="", verbose_name='عنوان مقدمة التواصل – الجزء المميز', help_text="Contact intro title, emphasized part (Arabic).")
    contact_intro_text_ar = models.TextField(default="", verbose_name='نص مقدمة التواصل', help_text="Contact intro statement (Arabic).")

    class Meta:
        verbose_name = "إعدادات الواجهة"
        verbose_name_plural = "إعدادات الواجهة"

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

    store_email = models.EmailField(default="", blank=True, verbose_name='البريد الإلكتروني', help_text="Primary store email.")
    store_phone = models.CharField(max_length=30, default="", blank=True, verbose_name='الهاتف', help_text="Primary store phone.")
    store_whatsapp = models.CharField(max_length=30, default="", blank=True, verbose_name='رقم واتساب', help_text="WhatsApp number (digits only for wa.me link).")
    store_hours_ar = models.CharField(max_length=200, default="", blank=True, verbose_name='ساعات العمل', help_text="Working hours (Arabic).")

    facebook_url = models.URLField(blank=True, verbose_name='رابط فيسبوك', help_text="Facebook page URL.")
    instagram_url = models.URLField(blank=True, verbose_name='رابط إنستغرام', help_text="Instagram profile URL.")
    linkedin_url = models.URLField(blank=True, verbose_name='رابط لينكدإن', help_text="LinkedIn page URL.")
    whatsapp_url = models.URLField(blank=True, verbose_name='رابط واتساب', help_text="WhatsApp direct chat URL (e.g. https://wa.me/213555...).")

    class Meta:
        verbose_name = "معلومات التواصل"
        verbose_name_plural = "معلومات التواصل"

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
