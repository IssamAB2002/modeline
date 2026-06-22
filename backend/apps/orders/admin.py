from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "product", "quantity", "unit_price_da_snapshot",
        "sku_snapshot", "product_name_snapshot_ar",
    )
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number", "full_name", "phone", "city",
        "grand_total_da", "currency", "status", "created_at",
    )
    list_filter = ("status",)
    list_editable = ("status",)
    search_fields = ("order_number", "full_name", "phone", "city")
    readonly_fields = (
        "order_number", "subtotal_da", "grand_total_da",
        "cart", "created_at", "updated_at",
    )
    inlines = [OrderItemInline]
    fieldsets = (
        ("Order", {"fields": ("order_number", "status", "cart", "currency")}),
        ("Customer", {"fields": ("full_name", "phone", "city", "address_line", "notes")}),
        ("Totals", {"fields": ("subtotal_da", "shipping_da", "grand_total_da")}),
        ("Meta", {"classes": ("collapse",), "fields": ("created_at", "updated_at")}),
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "order", "sku_snapshot", "product_name_snapshot_ar",
        "quantity", "unit_price_da_snapshot",
    )
    search_fields = ("order__order_number", "sku_snapshot", "product_name_snapshot_ar")
    readonly_fields = (
        "order", "product", "quantity", "unit_price_da_snapshot",
        "sku_snapshot", "product_name_snapshot_ar",
    )
