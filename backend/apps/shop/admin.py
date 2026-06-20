from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Product, ProductImage, ProductReview, Wilaya


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "thumbnail_preview",
        "name_ar",
        "name",
        "parent",
        "order",
        "is_active",
        "is_featured",
        "product_count",
        "updated_at",
    )
    list_filter = ("is_active", "is_featured", "parent")
    list_editable = ("order", "is_active", "is_featured")
    search_fields = ("name_ar", "name", "slug", "description")
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("parent",)
    readonly_fields = ("created_at", "updated_at", "image_preview")

    fieldsets = (
        (
            "Arabic (Primary)",
            {"fields": ("name_ar",)},
        ),
        (
            "English (Secondary)",
            {"fields": ("name", "slug", "parent", "description")},
        ),
        (
            "Image",
            {"fields": ("image", "image_preview")},
        ),
        (
            "Display",
            {"fields": ("order", "is_active", "is_featured")},
        ),
        (
            "SEO",
            {
                "classes": ("collapse",),
                "fields": ("meta_title", "meta_description"),
            },
        ),
        (
            "Meta",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    @admin.display(description="Products")
    def product_count(self, obj):
        return obj.products.count()

    @admin.display(description="Image")
    def thumbnail_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:42px;width:42px;object-fit:cover;border-radius:4px;" />',
                obj.image.url,
            )
        if obj.image_url if hasattr(obj, "image_url") else None:
            return format_html(
                '<img src="{}" style="height:42px;width:42px;object-fit:cover;border-radius:4px;" />',
                obj.image_url,
            )
        return "—"

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if obj and obj.image:
            return format_html(
                '<img src="{}" style="max-height:240px;border-radius:6px;" />',
                obj.image.url,
            )
        return "No image uploaded."


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "alt_text", "order", "is_active", "preview")
    readonly_fields = ("preview",)
    ordering = ("order",)

    @admin.display(description="Preview")
    def preview(self, obj):
        if obj and obj.image:
            return format_html(
                '<img src="{}" style="height:48px;border-radius:4px;" />',
                obj.image.url,
            )
        return "—"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "thumbnail",
        "name_ar",
        "name",
        "sku",
        "category",
        "price",
        "old_price_display",
        "stock_quantity",
        "availability",
        "badge",
        "is_active",
        "is_featured",
        "rating",
        "review_count",
    )
    list_filter = (
        "is_active",
        "is_featured",
        "is_new",
        "is_limited",
        "badge",
        "availability",
        "category",
        "material",
        "origin",
    )
    list_editable = (
        "price",
        "stock_quantity",
        "availability",
        "is_active",
        "is_featured",
    )
    search_fields = ("name_ar", "name", "sku", "slug", "short_description_ar", "short_description", "description")
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("category",)
    list_select_related = ("category",)
    list_per_page = 30
    date_hierarchy = "created_at"
    readonly_fields = (
        "created_at",
        "updated_at",
        "discount_percent",
        "is_on_sale",
        "image_preview",
    )
    save_on_top = True

    fieldsets = (
        (
            "Arabic (Primary Language)",
            {
                "fields": (
                    "name_ar",
                    "short_description_ar",
                    "description_ar",
                )
            },
        ),
        (
            "English (Secondary Language)",
            {"fields": ("name", "slug", "sku", "category")},
        ),
        (
            "Descriptions (English)",
            {"fields": ("short_description", "description", "care_instructions", "details")},
        ),
        (
            "Pricing",
            {
                "fields": (
                    "price",
                    "old_price",
                    "cost_price",
                    "is_on_sale",
                    "discount_percent",
                )
            },
        ),
        (
            "Inventory",
            {
                "fields": (
                    "track_inventory",
                    "stock_quantity",
                    "low_stock_threshold",
                    "availability",
                )
            },
        ),
        (
            "Heritage details",
            {"fields": ("origin", "material", "color", "available_sizes", "available_colors")},
        ),
        (
            "Shipping",
            {
                "classes": ("collapse",),
                "fields": ("weight_grams", "length_cm", "width_cm", "height_cm"),
            },
        ),
        (
            "Media",
            {"fields": ("image", "image_url", "image_preview")},
        ),
        (
            "Marketing",
            {"fields": (
                "is_active",
                "is_featured",
                "is_new",
                "is_limited",
                "badge",
            )},
        ),
        (
            "Reviews",
            {"fields": ("rating", "review_count", "sales_count")},
        ),
        (
            "SEO",
            {
                "classes": ("collapse",),
                "fields": ("meta_title", "meta_description"),
            },
        ),
        (
            "Meta",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    inlines = [ProductImageInline]

    @admin.display(description="Old price")
    def old_price_display(self, obj):
        return f"{obj.old_price:,.2f} DA" if obj.old_price else "—"

    @admin.display(description="Image")
    def thumbnail(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:42px;width:42px;object-fit:cover;'
                'border-radius:4px;" />',
                obj.image.url,
            )
        if obj.image_url:
            return format_html(
                '<img src="{}" style="height:42px;width:42px;object-fit:cover;'
                'border-radius:4px;" />',
                obj.image_url,
            )
        return "—"

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if obj and obj.image:
            return format_html(
                '<img src="{}" style="max-height:240px;border-radius:6px;" />',
                obj.image.url,
            )
        if obj and obj.image_url:
            return format_html(
                '<img src="{}" style="max-height:240px;border-radius:6px;" />',
                obj.image_url,
            )
        return "No image uploaded."

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("category")
        )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("preview", "product", "order", "is_active", "updated_at")
    list_filter = ("is_active",)
    list_editable = ("order", "is_active")
    search_fields = ("product__name", "alt_text")
    autocomplete_fields = ("product",)
    readonly_fields = ("preview", "created_at", "updated_at")

    @admin.display(description="Image")
    def preview(self, obj):
        if obj and obj.image:
            return format_html(
                '<img src="{}" style="height:48px;border-radius:4px;" />',
                obj.image.url,
            )
        return "—"


@admin.register(Wilaya)
class WilayaAdmin(admin.ModelAdmin):
    list_display = ("code", "name_ar", "name_fr", "shipping_price_da", "is_active")
    list_editable = ("shipping_price_da", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name_ar", "name_fr")
    ordering = ("code",)


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ("reviewer_name", "product", "rating", "is_approved", "created_at")
    list_filter = ("is_approved", "rating")
    list_editable = ("is_approved",)
    search_fields = ("reviewer_name", "body", "product__name_ar", "product__name")
    autocomplete_fields = ("product",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)
