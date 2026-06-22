from django.contrib import admin

from .models import Principle, Review


@admin.register(Principle)
class PrincipleAdmin(admin.ModelAdmin):
    list_display = ("title_ar", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    search_fields = ("title_ar",)
    fieldsets = (
        (None, {"fields": ("title_ar", "body_ar")}),
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
    search_fields = ("client_name_ar", "body_ar")
    readonly_fields = ("created_at",)
    fieldsets = (
        ("العميل", {"fields": ("client_name_ar", "location_ar")}),
        ("التقييم", {"fields": ("rating", "body_ar")}),
        ("الإشراف", {"fields": ("approved", "verified", "sort_order")}),
        ("بيانات", {"classes": ("collapse",), "fields": ("created_at",)}),
    )
