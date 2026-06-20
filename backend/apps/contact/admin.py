from django.contrib import admin

from .models import ContactMessage, Faq, Showroom


@admin.register(Showroom)
class ShowroomAdmin(admin.ModelAdmin):
    list_display = ("city_ar", "city_en", "phone", "email", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    search_fields = ("city_ar", "city_en", "address_ar", "phone", "email")
    fieldsets = (
        ("Location", {"fields": (("city_ar", "city_en"), ("address_ar", "address_en"))}),
        ("Contact", {"fields": ("phone", "email")}),
        ("Hours & Note", {"fields": (("hours_ar", "hours_en"), ("note_ar", "note_en"))}),
        ("Display", {"fields": ("sort_order", "is_active")}),
    )


@admin.register(Faq)
class FaqAdmin(admin.ModelAdmin):
    list_display = ("question_ar", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    search_fields = ("question_ar", "question_en", "answer_ar", "answer_en")
    fieldsets = (
        (None, {"fields": (("question_ar", "question_en"), ("answer_ar", "answer_en"))}),
        ("Display", {"fields": ("sort_order", "is_active")}),
    )


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "inquiry_type", "subject", "is_read", "status", "created_at")
    list_editable = ("is_read", "status")
    list_filter = ("inquiry_type", "is_read", "status")
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = ("created_at",)
    fieldsets = (
        ("Sender", {"fields": ("name", "email", "phone")}),
        ("Message", {"fields": ("inquiry_type", "subject", "message")}),
        ("Admin", {"fields": ("is_read", "status")}),
        ("Meta", {"classes": ("collapse",), "fields": ("created_at",)}),
    )
