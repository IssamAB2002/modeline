from django.contrib import admin
from django.utils.html import format_html

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "product", "product_name_snapshot_ar", "sku_snapshot",
        "selected_size_snapshot", "selected_color_snapshot",
        "quantity", "unit_price_da_snapshot",
    )
    fields = readonly_fields
    can_delete = False
    verbose_name = "عنصر الطلب"
    verbose_name_plural = "عناصر الطلب"


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number", "full_name", "phone", "shipping_type_display",
        "city", "grand_total_da", "status", "created_at",
    )
    list_filter = ("status", "shipping_type")
    list_editable = ("status",)
    search_fields = ("order_number", "full_name", "phone", "city")
    readonly_fields = (
        "order_number", "subtotal_da", "grand_total_da",
        "cart", "created_at", "updated_at",
    )
    inlines = [OrderItemInline]
    fieldsets = (
        ("الطلب", {"fields": ("order_number", "status", "cart")}),
        ("طريقة التوصيل", {"fields": ("shipping_type",)}),
        ("بيانات العميل", {"fields": ("full_name", "phone", "city", "address_line", "notes")}),
        ("الإجماليات", {"fields": ("subtotal_da", "shipping_da", "grand_total_da")}),
        ("معلومات إضافية", {"classes": ("collapse",), "fields": ("created_at", "updated_at")}),
    )

    @admin.display(description="التوصيل", ordering="shipping_type")
    def shipping_type_display(self, obj):
        if obj.shipping_type == Order.ShippingType.HOME:
            return format_html('<span style="color:#1a7a1a;font-weight:600">🏠 توصيل للبيت</span>')
        return format_html('<span style="color:#b56e00;font-weight:600">📦 مكتب التوصيل</span>')


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "order", "product_name_snapshot_ar", "sku_snapshot",
        "selected_size_snapshot", "selected_color_snapshot",
        "quantity", "unit_price_da_snapshot",
    )
    search_fields = ("order__order_number", "sku_snapshot", "product_name_snapshot_ar")
    readonly_fields = (
        "order", "product", "product_name_snapshot_ar", "sku_snapshot",
        "selected_size_snapshot", "selected_color_snapshot",
        "quantity", "unit_price_da_snapshot",
    )
