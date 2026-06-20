from decimal import Decimal

from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = "__all__"
        read_only_fields = (
            "order",
            "unit_price_da_snapshot",
            "sku_snapshot",
            "product_name_snapshot_ar",
            "product_name_snapshot_en",
            "line_total",
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = "__all__"
        read_only_fields = (
            "order_number",
            "status",
            "subtotal_da",
            "shipping_da",
            "grand_total_da",
            "currency",
            "created_at",
            "updated_at",
            "items",
        )


class OrderCreateSerializer(serializers.Serializer):
    """Validates the payload for creating an order from an active cart."""
    cart_id = serializers.IntegerField()
    shipping_da = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=Decimal("0.00")
    )
    full_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=30)
    city = serializers.CharField(max_length=100)
    address_line = serializers.CharField(max_length=400)
    notes = serializers.CharField(allow_blank=True, required=False, default="")
