from rest_framework import serializers

from .models import Category, Product, ProductColor, ProductImage, ProductReview, ProductSize, Wilaya


class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name_ar", "slug", "image_url", "is_featured")

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        if obj.image:
            return obj.image.url
        return None


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("url", "alt_text", "order")

    def get_url(self, obj):
        request = self.context.get("request")
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = ("name", "order")


class ProductColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductColor
        fields = ("name_ar", "hex", "order")


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for shop listing cards."""

    is_on_sale = serializers.BooleanField(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name_ar",
            "slug",
            "sku",
            "origin",
            "short_description_ar",
            "price",
            "old_price",
            "image_url",
            "badge",
            "rating",
            "review_count",
            "availability",
            "is_on_sale",
            "is_new",
            "is_limited",
            "is_featured",
        )

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url or None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer for the product detail page."""

    is_on_sale = serializers.BooleanField(read_only=True)
    discount_percent = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    sizes = ProductSizeSerializer(many=True, read_only=True)
    colors = ProductColorSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name_ar",
            "slug",
            "sku",
            "category",
            "origin",
            "material",
            "care_instructions",
            "details",
            "sizes",
            "colors",
            "short_description_ar",
            "description_ar",
            "price",
            "old_price",
            "image_url",
            "images",
            "badge",
            "rating",
            "review_count",
            "availability",
            "stock_quantity",
            "is_on_sale",
            "discount_percent",
            "in_stock",
            "is_new",
            "is_limited",
            "is_featured",
        )

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url or None


class WilayaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wilaya
        fields = ("id", "code", "name_ar", "name_fr", "shipping_price_da")


class ProductReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReview
        fields = ("id", "reviewer_name", "rating", "body", "created_at")
        read_only_fields = ("id", "created_at")
