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
            "selected_size_snapshot",
            "selected_color_snapshot",
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
    shipping_type = serializers.ChoiceField(
        choices=Order.ShippingType.choices, default=Order.ShippingType.HOME
    )
    full_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=30)
    city = serializers.CharField(max_length=100, allow_blank=True, required=False, default="")
    baladia = serializers.CharField(max_length=100, allow_blank=True, required=False, default="")
    address_line = serializers.CharField(max_length=400, allow_blank=True, required=False, default="")
    notes = serializers.CharField(allow_blank=True, required=False, default="")

    def validate(self, data):
        if data.get("shipping_type") == Order.ShippingType.HOME:
            if not data.get("city", "").strip():
                raise serializers.ValidationError({"city": "الولاية مطلوبة لتوصيل البيت."})
            if not data.get("baladia", "").strip():
                raise serializers.ValidationError({"baladia": "البلدية مطلوبة لتوصيل البيت."})
            if not data.get("address_line", "").strip():
                raise serializers.ValidationError({"address_line": "العنوان مطلوب لتوصيل البيت."})
        return data
