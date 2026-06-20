from django.contrib import admin

from .models import Principle, Review


@admin.register(Principle)
class PrincipleAdmin(admin.ModelAdmin):
    list_display = ("title_ar", "title_en", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    search_fields = ("title_ar", "title_en")
    fieldsets = (
        (None, {"fields": (("title_ar", "title_en"), ("body_ar", "body_en"))}),
        ("Display", {"fields": ("sort_order", "is_active")}),
    )


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = (
        "client_name_ar", "rating", "location_ar",
        "verified", "approved", "sort_order", "created_at",
    )
    list_editable = ("approved", "verified", "sort_order")
    list_filter = ("approved", "verified", "rating")
    search_fields = ("client_name_ar", "client_name_en", "body_ar", "body_en")
    readonly_fields = ("created_at",)
    fieldsets = (
        ("Client", {"fields": (("client_name_ar", "client_name_en"), ("location_ar", "location_en"))}),
        ("Review", {"fields": ("rating", ("body_ar", "body_en"))}),
        ("Moderation", {"fields": ("approved", "verified", "sort_order")}),
        ("Meta", {"classes": ("collapse",), "fields": ("created_at",)}),
    )
