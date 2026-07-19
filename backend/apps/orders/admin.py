from decimal import Decimal

from django import forms
from django.contrib import admin
from django.utils.html import format_html

from .models import Order, OrderItem, ThanksMessage
from .zr_service import delete_parcel, post_parcel, ZRServiceError


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
    show_change_link = True
    verbose_name = "عنصر الطلب"
    verbose_name_plural = "عناصر الطلب (اضغط على عنصر لتعديل المقاس/اللون/الكمية)"


@admin.action(description="إرسال إلى ZR Express")
def post_to_zr_express(modeladmin, request, queryset):
    success, skipped, errors = 0, 0, 0

    for order in queryset.select_related("wilaya_ref", "baladia_ref", "hub_ref__wilaya").prefetch_related("items"):
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


@admin.action(description="حذف من ZR Express")
def delete_from_zr_express(modeladmin, request, queryset):
    success, errors = 0, 0

    for order in queryset:
        try:
            delete_parcel(order)
            success += 1
        except ZRServiceError as exc:
            modeladmin.message_user(
                request,
                f"تعذّر حذف الطلب {order.order_number}: {exc}",
                level="error",
            )
            errors += 1

    if success:
        modeladmin.message_user(
            request,
            f"تم حذف {success} طلب/طلبات بنجاح من ZR Express.",
            level="success",
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
    autocomplete_fields = ("wilaya_ref", "baladia_ref", "hub_ref")
    readonly_fields = (
        "order_number", "subtotal_da", "grand_total_da",
        "cart", "created_at", "updated_at",
        "zr_submitted", "zr_customer_id", "zr_parcel_id", "zr_tracking_number", "zr_posted_at",
    )
    actions = [post_to_zr_express, delete_from_zr_express]
    inlines = [OrderItemInline]
    fieldsets = (
        ("الطلب", {"fields": ("order_number", "status", "cart")}),
        ("طريقة التوصيل", {"fields": ("shipping_type",)}),
        ("بيانات العميل", {"fields": ("full_name", "phone", "city", "baladia", "address_line", "notes")}),
        ("مراجع التوصيل (ZR)", {"fields": ("wilaya_ref", "baladia_ref", "hub_ref")}),
        ("الإجماليات", {"fields": ("subtotal_da", "shipping_da", "grand_total_da")}),
        ("ZR Express", {"fields": ("zr_submitted", "zr_customer_id", "zr_parcel_id", "zr_tracking_number", "zr_posted_at")}),
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


class OrderItemAdminForm(forms.ModelForm):
    class Meta:
        model = OrderItem
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        product = self.instance.product if self.instance.pk else None
        if not product:
            return

        sizes = list(product.sizes.values_list("name", flat=True))
        current_size = self.instance.selected_size_snapshot
        if current_size and current_size not in sizes:
            sizes.append(current_size)
        self.fields["selected_size_snapshot"] = forms.ChoiceField(
            choices=[("", "—")] + [(s, s) for s in sizes],
            required=False, label="المقاس",
        )

        colors = list(product.colors.values_list("name_ar", flat=True))
        current_color = self.instance.selected_color_snapshot
        if current_color and current_color not in colors:
            colors.append(current_color)
        self.fields["selected_color_snapshot"] = forms.ChoiceField(
            choices=[("", "—")] + [(c, c) for c in colors],
            required=False, label="اللون",
        )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    form = OrderItemAdminForm
    list_display = (
        "order", "product_name_snapshot_ar", "sku_snapshot",
        "selected_size_snapshot", "selected_color_snapshot",
        "quantity", "unit_price_da_snapshot",
    )
    search_fields = ("order__order_number", "sku_snapshot", "product_name_snapshot_ar")
    # Snapshot fields describing which product/line this is stay locked;
    # size, color and quantity remain editable so staff can amend an item
    # after the customer calls in to change them.
    readonly_fields = (
        "order", "product", "product_name_snapshot_ar", "sku_snapshot",
        "unit_price_da_snapshot",
    )
    fields = (
        "order", "product", "product_name_snapshot_ar", "sku_snapshot",
        "selected_size_snapshot", "selected_color_snapshot",
        "quantity", "unit_price_da_snapshot",
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        order = obj.order
        order.subtotal_da = sum((item.line_total for item in order.items.all()), Decimal("0.00"))
        order.grand_total_da = order.subtotal_da + order.shipping_da
        order.save(update_fields=["subtotal_da", "grand_total_da"])
