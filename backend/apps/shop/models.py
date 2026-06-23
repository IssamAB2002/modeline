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

    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخر تعديل')

    class Meta:
        abstract = True


class Category(TimeStampedModel):
    """Hierarchical product category (e.g. Men's Burnous, Kaftans, Footwear)."""

    name_ar = models.CharField(
        max_length=120,
        unique=True,
        verbose_name='الاسم',
    )
    slug = models.SlugField(max_length=140, unique=True, blank=True, verbose_name='الرابط')
    image = models.ImageField(upload_to="shop/categories/", blank=True, null=True, verbose_name='الصورة')
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="children",
        null=True,
        blank=True,
        verbose_name='الفئة الأم',
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='الترتيب',
        help_text="Display order (smaller values shown first).",
    )
    is_active = models.BooleanField(default=True, verbose_name='نشط')
    is_featured = models.BooleanField(
        default=False, verbose_name='مميز', help_text="Promote to landing page category rails."
    )

    # SEO
    meta_title = models.CharField(max_length=160, blank=True, verbose_name='عنوان SEO')
    meta_description = models.CharField(max_length=255, blank=True, verbose_name='وصف SEO')

    class Meta:
        ordering = ("order", "name_ar")
        verbose_name = "فئة"
        verbose_name_plural = "الفئات"
        indexes = [
            models.Index(fields=("is_active", "order")),
        ]

    def __str__(self):
        full_path = [self.name_ar]
        node = self.parent
        while node is not None:
            full_path.append(node.name_ar)
            node = node.parent
        return " → ".join(reversed(full_path))

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name_ar, allow_unicode=True)
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
        verbose_name='الاسم',
    )
    slug = models.SlugField(max_length=240, unique=True, blank=True, verbose_name='الرابط')
    sku = models.CharField(
        max_length=64,
        unique=True,
        verbose_name='رمز المنتج',
        help_text="Stock Keeping Unit — internal unique identifier.",
    )

    # Classification
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name='الفئة',
    )

    # Descriptions
    short_description_ar = models.CharField(
        max_length=255, blank=True, verbose_name='وصف مختصر'
    )
    description_ar = models.TextField(blank=True, verbose_name='الوصف الكامل')

    # Pricing
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        verbose_name='السعر',
        help_text="Current selling price (in DA).",
    )
    old_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        verbose_name='السعر القديم',
        help_text="Strike-through price — when set, the product displays as on sale.",
    )
    cost_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        verbose_name='سعر التكلفة',
        help_text="Internal cost for margin reporting.",
    )

    # Inventory
    stock_quantity = models.PositiveIntegerField(default=0, verbose_name='الكمية في المخزون')
    low_stock_threshold = models.PositiveIntegerField(
        default=3,
        verbose_name='حد المخزون المنخفض',
        help_text="When stock falls below this, availability flips to 'low stock'.",
    )
    track_inventory = models.BooleanField(default=True, verbose_name='تتبع المخزون')
    availability = models.CharField(
        max_length=20,
        choices=Availability.choices,
        default=Availability.IN_STOCK,
        verbose_name='الحالة',
    )

    # Heritage / craft metadata
    origin = models.CharField(
        max_length=120,
        blank=True,
        verbose_name='المنشأ',
        help_text="Place + material, e.g. 'Tlemcen · Pure Wool'.",
    )
    material = models.CharField(max_length=120, blank=True, verbose_name='الخامة')
    care_instructions = models.TextField(blank=True, verbose_name='تعليمات العناية')
    details = models.TextField(
        blank=True,
        verbose_name='التفاصيل',
        help_text="Product details — one bullet point per line (used in the Details tab).",
    )

    # Physical / shipping
    weight_grams = models.PositiveIntegerField(
        null=True, blank=True, verbose_name='الوزن (غرام)'
    )
    length_cm = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True, verbose_name='الطول (سم)'
    )
    width_cm = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True, verbose_name='العرض (سم)'
    )
    height_cm = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True, verbose_name='الارتفاع (سم)'
    )

    # Media
    image = models.ImageField(
        upload_to="shop/products/",
        blank=True,
        null=True,
        verbose_name='الصورة الرئيسية',
    )
    image_url = models.URLField(
        blank=True,
        verbose_name='رابط الصورة',
        help_text="External image URL (used when no uploaded image is present).",
    )

    # Marketing flags & badges
    is_active = models.BooleanField(default=True, verbose_name='نشط')
    is_featured = models.BooleanField(default=False, verbose_name='مميز')
    is_new = models.BooleanField(
        default=False, verbose_name='جديد', help_text="Surface under 'New Arrivals'."
    )
    is_limited = models.BooleanField(
        default=False, verbose_name='محدود', help_text="Mark as limited-edition piece."
    )
    badge = models.CharField(
        max_length=20,
        choices=BadgeType.choices,
        default=BadgeType.NONE,
        blank=True,
        verbose_name='الشارة',
    )

    # Aggregated review metrics (denormalised cache — recomputed by reviews app)
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
        verbose_name='التقييم',
        help_text="Cached average rating 0.00 – 5.00.",
    )
    review_count = models.PositiveIntegerField(default=0, verbose_name='عدد التقييمات')
    sales_count = models.PositiveIntegerField(
        default=0, verbose_name='عدد المبيعات', help_text="Cached total units sold (for bestsellers)."
    )

    # SEO
    meta_title = models.CharField(max_length=160, blank=True, verbose_name='عنوان SEO')
    meta_description = models.CharField(max_length=255, blank=True, verbose_name='وصف SEO')

    class Meta:
        ordering = ("-created_at", "name_ar")
        verbose_name = "منتج"
        verbose_name_plural = "المنتجات"
        indexes = [
            models.Index(fields=("is_active", "category")),
            models.Index(fields=("is_featured", "is_active")),
            models.Index(fields=("availability",)),
        ]

    def __str__(self):
        return f"{self.name_ar} ({self.sku})"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name_ar, allow_unicode=True)
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


class ProductSize(models.Model):
    """A single available size for a product (e.g. S, M, L, XL, or custom)."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="sizes",
        verbose_name='المنتج',
    )
    name = models.CharField(max_length=50, verbose_name='المقاس', help_text='مثال: S، M، L، XL — أو مقاس مخصص مثل "19 سنة"')
    order = models.PositiveIntegerField(default=0, verbose_name='الترتيب')

    class Meta:
        ordering = ("order", "id")
        verbose_name = "مقاس"
        verbose_name_plural = "المقاسات"

    def __str__(self):
        return self.name


class ProductColor(models.Model):
    """A single available color for a product, with a hex code and Arabic name."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="colors",
        verbose_name='المنتج',
    )
    name_ar = models.CharField(max_length=80, verbose_name='اسم اللون', help_text='مثال: عاجي، بني داكن، رملي')
    hex = models.CharField(
        max_length=7,
        default="#000000",
        verbose_name='اللون',
        help_text='كود اللون بصيغة #rrggbb — اختر اللون من المنتقي.',
    )
    order = models.PositiveIntegerField(default=0, verbose_name='الترتيب')

    class Meta:
        ordering = ("order", "id")
        verbose_name = "لون"
        verbose_name_plural = "الألوان"

    def __str__(self):
        return f"{self.name_ar} ({self.hex})"


class Wilaya(models.Model):
    """Algerian wilaya (province) with shipping price."""

    code = models.PositiveIntegerField(unique=True, verbose_name='الرمز', help_text="Wilaya code 1–58.")
    name_ar = models.CharField(max_length=100, verbose_name='الاسم بالعربية')
    name_fr = models.CharField(max_length=100, verbose_name='الاسم بالفرنسية')
    shipping_price_da = models.DecimalField(max_digits=8, decimal_places=2, default=700, verbose_name='سعر الشحن (دج)')
    is_active = models.BooleanField(default=True, verbose_name='نشط')

    class Meta:
        ordering = ("code",)
        verbose_name = "ولاية"
        verbose_name_plural = "الولايات"

    def __str__(self):
        return f"{self.code} – {self.name_fr}"


class Baladia(models.Model):
    """Algerian municipality (بلدية) — child of a Wilaya."""

    wilaya = models.ForeignKey(
        Wilaya,
        on_delete=models.CASCADE,
        related_name="baladias",
        verbose_name='الولاية',
    )
    name_ar = models.CharField(max_length=100, verbose_name='الاسم بالعربية')
    name_fr = models.CharField(max_length=100, verbose_name='الاسم بالفرنسية')
    is_active = models.BooleanField(default=True, verbose_name='نشط')

    class Meta:
        ordering = ("name_ar",)
        verbose_name = "بلدية"
        verbose_name_plural = "البلديات"

    def __str__(self):
        return f"{self.name_fr} ({self.wilaya.name_fr})"


class ProductImage(TimeStampedModel):
    """Additional gallery images for a product."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
        verbose_name='المنتج',
    )
    image = models.ImageField(upload_to="shop/products/gallery/", verbose_name='الصورة')
    alt_text = models.CharField(max_length=160, blank=True, verbose_name='نص بديل')
    order = models.PositiveIntegerField(default=0, verbose_name='الترتيب')
    is_active = models.BooleanField(default=True, verbose_name='نشط')

    class Meta:
        ordering = ("order", "id")
        verbose_name = "صورة المنتج"
        verbose_name_plural = "صور المنتج"

    def __str__(self):
        return f"{self.product.name_ar} image #{self.pk}"


class ProductReview(TimeStampedModel):
    """Customer review and rating for a product."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="product_reviews",
        verbose_name='المنتج',
    )
    reviewer_name = models.CharField(max_length=120, verbose_name='اسم المقيّم')
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='التقييم',
        help_text="Rating from 1 (worst) to 5 (best).",
    )
    body = models.TextField(blank=True, verbose_name='التعليق')
    is_approved = models.BooleanField(
        default=False,
        verbose_name='معتمد',
        help_text="Only approved reviews appear publicly and count toward the rating.",
    )

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "تقييم المنتج"
        verbose_name_plural = "تقييمات المنتجات"

    def __str__(self):
        return f"{self.reviewer_name} — {self.product.name_ar} ({self.rating}★)"


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
