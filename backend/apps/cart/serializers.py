from rest_framework import serializers

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    product_image_url = serializers.SerializerMethodField()
    product_origin = serializers.CharField(source="product.origin", read_only=True)

    def get_product_image_url(self, obj):
        if not obj.product:
            return ""
        if obj.product.image:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.product.image.url) if request else obj.product.image.url
        return obj.product.image_url or ""

    class Meta:
        model = CartItem
        fields = "__all__"
        read_only_fields = (
            "unit_price_da_snapshot",
            "product_name_snapshot_ar",
            "sku_snapshot",
            "line_total",
            "product_image_url",
            "product_origin",
        )


class CartItemAddSerializer(serializers.Serializer):
    """Used only for adding / updating an item in the cart."""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    selected_size = serializers.CharField(max_length=50, allow_blank=True, required=False, default=None)
    selected_color = serializers.CharField(max_length=50, allow_blank=True, required=False, default=None)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_da = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ("id", "status", "session_key", "created_at", "updated_at", "items", "total_da")
        read_only_fields = ("status", "created_at", "updated_at", "items", "total_da")
