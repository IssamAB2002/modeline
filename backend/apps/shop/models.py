from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Avg
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.urls import reverse
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    """Abstract base with created/updated timestamps."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(TimeStampedModel):
    """Hierarchical product category (e.g. Men's Burnous, Kaftans, Footwear)."""

    name_ar = models.CharField(
        max_length=120,
        blank=True,
        help_text="Category name in Arabic (primary language).",
    )
    name = models.CharField(
        max_length=120,
        unique=True,
        help_text="Category name in English (secondary).",
    )
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="shop/categories/", blank=True, null=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="children",
        null=True,
        blank=True,
        help_text="Optional parent category — supports a two-level hierarchy.",
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order (smaller values shown first).",
    )
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(
        default=False, help_text="Promote to landing page category rails."
    )

    # SEO
    meta_title = models.CharField(max_length=160, blank=True)
    meta_description = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ("order", "name")
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        indexes = [
            models.Index(fields=("is_active", "order")),
        ]

    def __str__(self):
        display = self.name_ar or self.name
        full_path = [display]
        node = self.parent
        while node is not None:
            full_path.append(node.name_ar or node.name)
            node = node.parent
        return " → ".join(reversed(full_path))

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("shop:category_detail", kwargs={"slug": self.slug})


class Product(TimeStampedModel):
    """A heritage/cultural garment or accessory listed in the shop."""

    class Availability(models.TextChoices):
        IN_STOCK = "in_stock", "In stock"
        LOW_STOCK = "low_stock", "Low stock"
        OUT_OF_STOCK = "out_of_stock", "Out of stock"
        DISCONTINUED = "discontinued", "Discontinued"
        PRE_ORDER = "pre_order", "Pre-order"

    class BadgeType(models.TextChoices):
        NONE = "", "None"
        NEW = "new", "New"
        SALE = "sale", "Sale"
        LIMITED = "limited", "Limited"
        BESTSELLER = "bestseller", "Bestseller"

    # Identity
    name_ar = models.CharField(
        max_length=220,
        blank=True,
        help_text="Product name in Arabic (primary language).",
    )
    name = models.CharField(
        max_length=220,
        help_text="Product name in English (secondary).",
    )
    slug = models.SlugField(max_length=240, unique=True, blank=True)
    sku = models.CharField(
        max_length=64,
        unique=True,
        help_text="Stock Keeping Unit — internal unique identifier.",
    )

    # Classification
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )

    # Descriptions
    short_description_ar = models.CharField(
        max_length=255, blank=True, help_text="Short description in Arabic (primary)."
    )
    short_description = models.CharField(
        max_length=255, blank=True, help_text="Short description in English (secondary)."
    )
    description_ar = models.TextField(blank=True, help_text="Full product narrative in Arabic (primary).")
    description = models.TextField(blank=True, help_text="Full product narrative in English (secondary).")

    # Pricing
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Current selling price (in DA).",
    )
    old_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Strike-through price — when set, the product displays as on sale.",
    )
    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Internal cost for margin reporting.",
    )

    # Inventory
    stock_quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(
        default=3,
        help_text="When stock falls below this, availability flips to 'low stock'.",
    )
    track_inventory = models.BooleanField(default=True)
    availability = models.CharField(
        max_length=20,
        choices=Availability.choices,
        default=Availability.IN_STOCK,
    )

    # Heritage / craft metadata
    origin = models.CharField(
        max_length=120,
        blank=True,
        help_text="Place + material, e.g. 'Tlemcen · Pure Wool'.",
    )
    material = models.CharField(max_length=120, blank=True)
    color = models.CharField(max_length=80, blank=True)
    care_instructions = models.TextField(blank=True)
    details = models.TextField(
        blank=True,
        help_text="Product details — one bullet point per line (used in the Details tab).",
    )
    available_sizes = models.JSONField(
        default=list,
        blank=True,
        help_text='Available sizes — JSON list of strings, e.g. ["S","M","L","XL","XXL"]. '
                  'Can be anything the admin defines (XL, GM, 19 years old, etc.).',
    )
    available_colors = models.JSONField(
        default=list,
        blank=True,
        help_text='Product colours — JSON list of {"name": "…", "hex": "#rrggbb"} objects. '
                  'Example: [{"name": "Ivory", "hex": "#F5F0E8"}, {"name": "Espresso", "hex": "#2C1A08"}]. '
                  'Leave empty to hide the colour selector.',
    )

    # Physical / shipping
    weight_grams = models.PositiveIntegerField(
        null=True, blank=True, help_text="Product weight in grams."
    )
    length_cm = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    width_cm = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    height_cm = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )

    # Media
    image = models.ImageField(
        upload_to="shop/products/",
        blank=True,
        null=True,
        help_text="Primary product image shown on listing cards.",
    )
    image_url = models.URLField(
        blank=True,
        help_text="External image URL (used when no uploaded image is present).",
    )

    # Marketing flags & badges
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_new = models.BooleanField(
        default=False, help_text="Surface under 'New Arrivals'."
    )
    is_limited = models.BooleanField(
        default=False, help_text="Mark as limited-edition piece."
    )
    badge = models.CharField(
        max_length=20,
        choices=BadgeType.choices,
        default=BadgeType.NONE,
        blank=True,
    )

    # Aggregated review metrics (denormalised cache — recomputed by reviews app)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Cached average rating 0.00 – 5.00.",
    )
    review_count = models.PositiveIntegerField(default=0)
    sales_count = models.PositiveIntegerField(
        default=0, help_text="Cached total units sold (for bestsellers)."
    )

    # SEO
    meta_title = models.CharField(max_length=160, blank=True)
    meta_description = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ("-created_at", "name")
        indexes = [
            models.Index(fields=("is_active", "category")),
            models.Index(fields=("is_featured", "is_active")),
            models.Index(fields=("availability",)),
        ]

    def __str__(self):
        display = self.name_ar or self.name
        return f"{display} ({self.sku})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        self._sync_badge_and_availability()
        super().save(*args, **kwargs)

    # ---- Domain helpers ---------------------------------------------------
    def _sync_badge_and_availability(self):
        """Keep badge, is_new and availability flags consistent with data."""
        # Sale badge
        if self.old_price and self.old_price > self.price:
            self.badge = self.BadgeType.SALE
        elif self.is_limited and self.badge in ("", self.BadgeType.SALE):
            self.badge = self.BadgeType.LIMITED
        elif self.is_new and self.badge in ("", self.BadgeType.NONE):
            self.badge = self.BadgeType.NEW

        # Availability derived from inventory tracking
        if self.track_inventory:
            if self.stock_quantity <= 0:
                self.availability = self.Availability.OUT_OF_STOCK
            elif self.stock_quantity <= self.low_stock_threshold:
                self.availability = self.Availability.LOW_STOCK
            else:
                self.availability = self.Availability.IN_STOCK

    @property
    def is_on_sale(self) -> bool:
        return bool(self.old_price and self.old_price > self.price)

    @property
    def discount_percent(self) -> int:
        if not self.is_on_sale or not self.old_price:
            return 0
        return int(
            ((self.old_price - self.price) / self.old_price) * Decimal("100")
        )

    @property
    def in_stock(self) -> bool:
        return (
            not self.track_inventory
            or self.stock_quantity > 0
        ) and self.availability not in (
            self.Availability.OUT_OF_STOCK,
            self.Availability.DISCONTINUED,
        )

    def get_absolute_url(self):
        return reverse("shop:product_detail", kwargs={"slug": self.slug})


class Wilaya(models.Model):
    """Algerian wilaya (province) with shipping price."""

    code = models.PositiveIntegerField(unique=True, help_text="Wilaya code 1–58.")
    name_ar = models.CharField(max_length=100)
    name_fr = models.CharField(max_length=100)
    shipping_price_da = models.DecimalField(max_digits=8, decimal_places=2, default=700)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("code",)
        verbose_name = "Wilaya"
        verbose_name_plural = "Wilayas"

    def __str__(self):
        return f"{self.code} – {self.name_fr}"


class ProductImage(TimeStampedModel):
    """Additional gallery images for a product."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="shop/products/gallery/")
    alt_text = models.CharField(max_length=160, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("order", "id")
        verbose_name = "Product image"
        verbose_name_plural = "Product images"

    def __str__(self):
        return f"{self.product.name} image #{self.pk}"


class ProductReview(TimeStampedModel):
    """Customer review and rating for a product."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="product_reviews",
    )
    reviewer_name = models.CharField(max_length=120)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 (worst) to 5 (best).",
    )
    body = models.TextField(blank=True, help_text="Optional review text.")
    is_approved = models.BooleanField(
        default=False,
        help_text="Only approved reviews appear publicly and count toward the rating.",
    )

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "Product review"
        verbose_name_plural = "Product reviews"

    def __str__(self):
        product_name = self.product.name_ar or self.product.name
        return f"{self.reviewer_name} — {product_name} ({self.rating}★)"


# ── Signal: keep Product.rating / review_count in sync ──────────────────────

def _refresh_product_rating(product):
    approved = ProductReview.objects.filter(product=product, is_approved=True)
    count = approved.count()
    avg = approved.aggregate(avg=Avg("rating"))["avg"] or Decimal("0.00")
    Product.objects.filter(pk=product.pk).update(
        rating=round(avg, 2),
        review_count=count,
    )


@receiver(post_save, sender=ProductReview)
def on_review_save(sender, instance, **kwargs):
    _refresh_product_rating(instance.product)


@receiver(post_delete, sender=ProductReview)
def on_review_delete(sender, instance, **kwargs):
    _refresh_product_rating(instance.product)
