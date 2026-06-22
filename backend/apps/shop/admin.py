from django import forms
from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Product, ProductColor, ProductImage, ProductReview, ProductSize, Wilaya


# ── Color picker widget ─────────────────────────────────────────────────────

class ColorPickerWidget(forms.TextInput):
    """Renders an HTML5 <input type="color"> with a hex text field alongside."""

    input_type = "color"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.attrs.update({
            "style": "width:60px;height:38px;padding:2px;border:1px solid #ccc;cursor:pointer;vertical-align:middle;",
        })


class ProductColorForm(forms.ModelForm):
    hex = forms.CharField(
        widget=ColorPickerWidget(),
        label="اللون",
        help_text="انقر على المربع لاختيار اللون",
    )

    class Meta:
        model = ProductColor
        fields = ("name_ar", "hex", "order")


# ── Inlines ─────────────────────────────────────────────────────────────────

class ProductSizeInline(admin.TabularInline):
    model = ProductSize
    extra = 3
    fields = ("name", "order")
    verbose_name = "مقاس"
    verbose_name_plural = "المقاسات — أضف مقاساً في كل سطر"


class ProductColorInline(admin.TabularInline):
    model = ProductColor
    form = ProductColorForm
    extra = 2
    fields = ("name_ar", "hex", "color_preview", "order")
    readonly_fields = ("color_preview",)
    verbose_name = "لون"
    verbose_name_plural = "الألوان — اختر اللون وأدخل اسمه بالعربية"

    @admin.display(description="معاينة")
    def color_preview(self, obj):
        if obj and obj.pk and obj.hex:
            return format_html(
                '<div style="background:{};width:38px;height:38px;border-radius:4px;'
                'border:1px solid #ccc;display:inline-block;vertical-align:middle;"></div>',
                obj.hex,
            )
        return "—"


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "alt_text", "order", "is_active", "preview")
    readonly_fields = ("preview",)
    ordering = ("order",)

    @admin.display(description="معاينة")
    def preview(self, obj):
        if obj and obj.image:
            return format_html(
                '<img src="{}" style="height:48px;border-radius:4px;" />',
                obj.image.url,
            )
        return "—"


# ── Category Admin ───────────────────────────────────────────────────────────

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "thumbnail_preview",
        "name_ar",
        "parent",
        "order",
        "is_active",
        "is_featured",
        "product_count",
        "updated_at",
    )
    list_filter = ("is_active", "is_featured", "parent")
    list_editable = ("order", "is_active", "is_featured")
    search_fields = ("name_ar", "slug")
    prepopulated_fields = {"slug": ("name_ar",)}
    autocomplete_fields = ("parent",)
    readonly_fields = ("created_at", "updated_at", "image_preview")

    fieldsets = (
        (
            "الهوية",
            {"fields": ("name_ar", "slug", "parent")},
        ),
        (
            "الصورة",
            {"fields": ("image", "image_preview")},
        ),
        (
            "العرض",
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
            "بيانات",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    @admin.display(description="المنتجات")
    def product_count(self, obj):
        return obj.products.count()

    @admin.display(description="صورة")
    def thumbnail_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:42px;width:42px;object-fit:cover;border-radius:4px;" />',
                obj.image.url,
            )
        return "—"

    @admin.display(description="معاينة")
    def image_preview(self, obj):
        if obj and obj.image:
            return format_html(
                '<img src="{}" style="max-height:240px;border-radius:6px;" />',
                obj.image.url,
            )
        return "لا توجد صورة."


# ── Product Admin ────────────────────────────────────────────────────────────

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "thumbnail",
        "name_ar",
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
    search_fields = ("name_ar", "sku", "slug", "short_description_ar")
    prepopulated_fields = {"slug": ("name_ar",)}
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
            "الهوية",
            {
                "fields": (
                    "name_ar",
                    "slug",
                    "sku",
                    "category",
                )
            },
        ),
        (
            "الوصف",
            {"fields": ("short_description_ar", "description_ar", "care_instructions", "details")},
        ),
        (
            "التسعير",
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
            "المخزون",
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
            "تفاصيل التراث",
            {"fields": ("origin", "material")},
        ),
        (
            "الشحن",
            {
                "classes": ("collapse",),
                "fields": ("weight_grams", "length_cm", "width_cm", "height_cm"),
            },
        ),
        (
            "الوسائط",
            {"fields": ("image", "image_url", "image_preview")},
        ),
        (
            "التسويق",
            {"fields": (
                "is_active",
                "is_featured",
                "is_new",
                "is_limited",
                "badge",
            )},
        ),
        (
            "التقييمات",
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
            "بيانات",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    inlines = [ProductSizeInline, ProductColorInline, ProductImageInline]

    @admin.display(description="السعر القديم")
    def old_price_display(self, obj):
        return f"{obj.old_price:,.2f} DA" if obj.old_price else "—"

    @admin.display(description="صورة")
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

    @admin.display(description="معاينة")
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
        return "لا توجد صورة."

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("category")
        )


# ── ProductImage Admin ───────────────────────────────────────────────────────

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("preview", "product", "order", "is_active", "updated_at")
    list_filter = ("is_active",)
    list_editable = ("order", "is_active")
    search_fields = ("product__name_ar", "alt_text")
    autocomplete_fields = ("product",)
    readonly_fields = ("preview", "created_at", "updated_at")

    @admin.display(description="صورة")
    def preview(self, obj):
        if obj and obj.image:
            return format_html(
                '<img src="{}" style="height:48px;border-radius:4px;" />',
                obj.image.url,
            )
        return "—"


# ── Wilaya Admin ─────────────────────────────────────────────────────────────

@admin.register(Wilaya)
class WilayaAdmin(admin.ModelAdmin):
    list_display = ("code", "name_ar", "name_fr", "shipping_price_da", "is_active")
    list_editable = ("shipping_price_da", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name_ar", "name_fr")
    ordering = ("code",)


# ── ProductReview Admin ──────────────────────────────────────────────────────

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ("reviewer_name", "product", "rating", "is_approved", "created_at")
    list_filter = ("is_approved", "rating")
    list_editable = ("is_approved",)
    search_fields = ("reviewer_name", "body", "product__name_ar")
    autocomplete_fields = ("product",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)
