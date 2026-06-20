from django.contrib import admin

from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = (
        "product", "quantity", "selected_size", "selected_color",
        "unit_price_da_snapshot", "sku_snapshot",
        "product_name_snapshot_ar", "product_name_snapshot_en",
    )
    can_delete = False


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "session_key", "item_count", "created_at", "updated_at")
    list_filter = ("status",)
    readonly_fields = ("created_at", "updated_at")
    inlines = [CartItemInline]

    @admin.display(description="Items")
    def item_count(self, obj):
        return obj.items.count()


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = (
        "cart", "sku_snapshot", "product_name_snapshot_ar",
        "quantity", "unit_price_da_snapshot", "selected_size", "selected_color",
    )
    list_filter = ("cart__status",)
    search_fields = ("sku_snapshot", "product_name_snapshot_ar", "product__name")
    readonly_fields = (
        "unit_price_da_snapshot", "sku_snapshot",
        "product_name_snapshot_ar", "product_name_snapshot_en",
    )
