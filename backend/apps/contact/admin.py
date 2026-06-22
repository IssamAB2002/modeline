from django.contrib import admin

from .models import ContactMessage, Faq, Showroom


@admin.register(Showroom)
class ShowroomAdmin(admin.ModelAdmin):
    list_display = ("city_ar", "phone", "email", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    search_fields = ("city_ar", "address_ar", "phone", "email")
    fieldsets = (
        ("الموقع", {"fields": ("city_ar", "address_ar")}),
        ("التواصل", {"fields": ("phone", "email")}),
        ("الأوقات والملاحظة", {"fields": ("hours_ar", "note_ar")}),
        ("العرض", {"fields": ("sort_order", "is_active")}),
    )


@admin.register(Faq)
class FaqAdmin(admin.ModelAdmin):
    list_display = ("question_ar", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")
    search_fields = ("question_ar", "answer_ar")
    fieldsets = (
        (None, {"fields": ("question_ar", "answer_ar")}),
        ("العرض", {"fields": ("sort_order", "is_active")}),
    )


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "inquiry_type", "subject", "is_read", "status", "created_at")
    list_editable = ("is_read", "status")
    list_filter = ("inquiry_type", "is_read", "status")
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = ("created_at",)
    fieldsets = (
        ("المرسل", {"fields": ("name", "email", "phone")}),
        ("الرسالة", {"fields": ("inquiry_type", "subject", "message")}),
        ("الإدارة", {"fields": ("is_read", "status")}),
        ("بيانات", {"classes": ("collapse",), "fields": ("created_at",)}),
    )
