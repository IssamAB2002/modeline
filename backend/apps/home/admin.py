from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse

from .models import ContactInfo, FrontSettings, TrustStrip


@admin.register(TrustStrip)
class TrustStripAdmin(admin.ModelAdmin):
    list_display = ("label_ar", "icon", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("label_ar", "description_ar")
    fieldsets = (
        (None, {"fields": ("icon", "label_ar", "description_ar")}),
        ("Display", {"fields": ("sort_order", "is_active")}),
    )


@admin.register(FrontSettings)
class FrontSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ("الصفحة الرئيسية — الشريط العلوي والتنقل", {"fields": (
            "home_topbar_ar",
            "home_nav_logo_tagline_ar")}),
        ("الصفحة الرئيسية — البانر الرئيسي", {"fields": (
            "home_hero_eyebrow_ar",
            "home_hero_title_line1_ar",
            "home_hero_title_emphasis_ar",
            "home_hero_title_line3_ar",
            "home_hero_subtitle_ar")}),
        ("صفحة من نحن — البانر", {"fields": (
            "about_hero_title_main_ar",
            "about_hero_title_emphasis_ar",
            "about_hero_subtitle_ar")}),
        ("صفحة من نحن — البيان التعريفي", {"fields": (
            "about_intro_eyebrow_ar",
            "about_intro_title_ar",
            "about_intro_text_ar")}),
        ("صفحة من نحن — قسم القصة", {"fields": (
            "about_story_title_main_ar",
            "about_story_title_emphasis_ar",
            "about_story_paragraph_1_ar",
            "about_story_paragraph_2_ar",
            "about_story_paragraph_3_ar",
            "about_story_image",
            "about_story_image_url",
            "about_story_image_label_ar",
        )}),
        ("صفحة من نحن — الإحصائيات", {"fields": (
            ("about_stat_1_value", "about_stat_1_label_ar"),
            ("about_stat_2_value", "about_stat_2_label_ar"),
            ("about_stat_3_value", "about_stat_3_label_ar"),
            ("about_stat_4_value", "about_stat_4_label_ar"),
        )}),
        ("صفحة المنتج — تبويب الشحن", {"fields": (
            "product_shipping_intro_ar",
            "product_shipping_algeria_ar",
            "product_shipping_france_ar",
            "product_shipping_tracking_ar",
        )}),
        ("صفحة التواصل — البانر", {"fields": (
            "contact_hero_title_main_ar",
            "contact_hero_title_emphasis_ar",
            "contact_hero_subtitle_ar")}),
        ("صفحة التواصل — البيان التعريفي", {"fields": (
            "contact_intro_title_main_ar",
            "contact_intro_title_emphasis_ar",
            "contact_intro_text_ar")}),
    )

    def has_add_permission(self, request):
        return not FrontSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = FrontSettings.load()
        return redirect(reverse("admin:home_frontsettings_change", args=(obj.pk,)))


@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):
    fieldsets = (
        ("بيانات المتجر", {"fields": (
            "store_email",
            "store_phone",
            "store_whatsapp",
            "store_hours_ar",
        )}),
        ("روابط التواصل الاجتماعي", {"fields": (
            "facebook_url",
            "instagram_url",
            "linkedin_url",
            "whatsapp_url",
        )}),
    )

    def has_add_permission(self, request):
        return not ContactInfo.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = ContactInfo.load()
        return redirect(reverse("admin:home_contactinfo_change", args=(obj.pk,)))
