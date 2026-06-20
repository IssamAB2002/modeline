from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse

from .models import ContactInfo, FrontSettings, TrustStrip


@admin.register(TrustStrip)
class TrustStripAdmin(admin.ModelAdmin):
    list_display = ("label_ar", "label_en", "icon", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("label_ar", "label_en", "description_ar", "description_en")
    fieldsets = (
        (None, {"fields": ("icon", ("label_ar", "label_en"), ("description_ar", "description_en"))}),
        ("Display", {"fields": ("sort_order", "is_active")}),
    )


@admin.register(FrontSettings)
class FrontSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ("Home — Top Bar & Nav", {"fields": (
            ("home_topbar_ar", "home_topbar_en"),
            ("home_nav_logo_tagline_ar", "home_nav_logo_tagline_en"))}),
        ("Home — Hero", {"fields": (
            ("home_hero_eyebrow_ar", "home_hero_eyebrow_en"),
            ("home_hero_title_line1_ar", "home_hero_title_line1_en"),
            ("home_hero_title_emphasis_ar", "home_hero_title_emphasis_en"),
            ("home_hero_title_line3_ar", "home_hero_title_line3_en"),
            ("home_hero_subtitle_ar", "home_hero_subtitle_en"))}),
        ("About — Hero", {"fields": (
            ("about_hero_title_main_ar", "about_hero_title_main_en"),
            ("about_hero_title_emphasis_ar", "about_hero_title_emphasis_en"),
            ("about_hero_subtitle_ar", "about_hero_subtitle_en"))}),
        ("About — Intro Statement", {"fields": (
            ("about_intro_eyebrow_ar", "about_intro_eyebrow_en"),
            ("about_intro_title_ar", "about_intro_title_en"),
            ("about_intro_text_ar", "about_intro_text_en"))}),
        ("About — Story Section", {"fields": (
            ("about_story_title_main_ar", "about_story_title_main_en"),
            ("about_story_title_emphasis_ar", "about_story_title_emphasis_en"),
            ("about_story_paragraph_1_ar", "about_story_paragraph_1_en"),
            ("about_story_paragraph_2_ar", "about_story_paragraph_2_en"),
            ("about_story_paragraph_3_ar", "about_story_paragraph_3_en"),
            "about_story_image",
            "about_story_image_url",
            ("about_story_image_label_ar", "about_story_image_label_en"),
        )}),
        ("About — Stats Row", {"fields": (
            ("about_stat_1_value", "about_stat_1_label_ar", "about_stat_1_label_en"),
            ("about_stat_2_value", "about_stat_2_label_ar", "about_stat_2_label_en"),
            ("about_stat_3_value", "about_stat_3_label_ar", "about_stat_3_label_en"),
            ("about_stat_4_value", "about_stat_4_label_ar", "about_stat_4_label_en"),
        )}),
        ("Product Page — Shipping Tab", {"fields": (
            ("product_shipping_intro_ar", "product_shipping_intro_en"),
            ("product_shipping_algeria_ar", "product_shipping_algeria_en"),
            ("product_shipping_france_ar", "product_shipping_france_en"),
            ("product_shipping_tracking_ar", "product_shipping_tracking_en"),
        )}),
        ("Contact — Hero", {"fields": (
            ("contact_hero_title_main_ar", "contact_hero_title_main_en"),
            ("contact_hero_title_emphasis_ar", "contact_hero_title_emphasis_en"),
            ("contact_hero_subtitle_ar", "contact_hero_subtitle_en"))}),
        ("Contact — Intro Statement", {"fields": (
            ("contact_intro_title_main_ar", "contact_intro_title_main_en"),
            ("contact_intro_title_emphasis_ar", "contact_intro_title_emphasis_en"),
            ("contact_intro_text_ar", "contact_intro_text_en"))}),
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
        ("Store Details", {"fields": (
            "store_email",
            "store_phone",
            "store_whatsapp",
            ("store_hours_ar", "store_hours_en"),
        )}),
        ("Social Links", {"fields": (
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
