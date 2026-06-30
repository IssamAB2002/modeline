from django.contrib import admin
from django.utils.html import format_html

from .models import Order, OrderItem, ThanksMessage
from .zr_service import post_parcel, ZRServiceError


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


@admin.action(description="إرسال إلى ZR Express")
def post_to_zr_express(modeladmin, request, queryset):
    success, skipped, errors = 0, 0, 0

    for order in queryset.select_related("wilaya_ref", "baladia_ref").prefetch_related("items"):
        try:
            post_parcel(order)
            success += 1
        except ZRServiceError as exc:
            modeladmin.message_user(
                request,
                f"تعذّر إرسال الطلب {order.order_number}: {exc}",
                level="error",
            )
            errors += 1

    if success:
        modeladmin.message_user(
            request,
            f"تم إرسال {success} طلب/طلبات بنجاح إلى ZR Express.",
            level="success",
        )
    if skipped:
        modeladmin.message_user(
            request,
            f"تم تخطي {skipped} طلب/طلبات (مرسَلة مسبقاً أو ناقصة البيانات).",
            level="warning",
        )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number", "full_name", "phone", "shipping_type_display",
        "city", "grand_total_da", "status", "zr_submitted", "zr_status_display", "created_at",
    )
    list_filter = ("status", "shipping_type", "zr_submitted")
    list_editable = ("status",)
    search_fields = ("order_number", "full_name", "phone", "city", "baladia")
    autocomplete_fields = ("wilaya_ref", "baladia_ref")
    readonly_fields = (
        "order_number", "subtotal_da", "grand_total_da",
        "cart", "created_at", "updated_at",
        "zr_submitted", "zr_parcel_id", "zr_tracking_number", "zr_posted_at",
    )
    actions = [post_to_zr_express]
    inlines = [OrderItemInline]
    fieldsets = (
        ("الطلب", {"fields": ("order_number", "status", "cart")}),
        ("طريقة التوصيل", {"fields": ("shipping_type",)}),
        ("بيانات العميل", {"fields": ("full_name", "phone", "city", "baladia", "address_line", "notes")}),
        ("مراجع التوصيل (ZR)", {"fields": ("wilaya_ref", "baladia_ref")}),
        ("الإجماليات", {"fields": ("subtotal_da", "shipping_da", "grand_total_da")}),
        ("ZR Express", {"fields": ("zr_submitted", "zr_parcel_id", "zr_tracking_number", "zr_posted_at")}),
        ("معلومات إضافية", {"classes": ("collapse",), "fields": ("created_at", "updated_at")}),
    )

    @admin.display(description="التوصيل", ordering="shipping_type")
    def shipping_type_display(self, obj):
        if obj.shipping_type == Order.ShippingType.HOME:
            return format_html('<span style="color:#1a7a1a;font-weight:600">🏠 توصيل للبيت</span>')
        return format_html('<span style="color:#b56e00;font-weight:600">📦 مكتب التوصيل</span>')

    @admin.display(description="ZR Express")
    def zr_status_display(self, obj):
        if obj.zr_parcel_id:
            tracking = obj.zr_tracking_number or str(obj.zr_parcel_id)[:8]
            return format_html('<span style="color:#1a7a1a;font-weight:600">✓ {}</span>', tracking)
        return format_html('<span style="color:#999">—</span>')


@admin.register(ThanksMessage)
class ThanksMessageAdmin(admin.ModelAdmin):
    list_display = ("short_body", "is_active", "updated_at")
    list_editable = ("is_active",)
    fields = ("body", "is_active")

    @admin.display(description="الرسالة")
    def short_body(self, obj):
        return obj.body[:80] + "..." if len(obj.body) > 80 else obj.body


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
