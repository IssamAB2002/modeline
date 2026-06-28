import uuid
from decimal import Decimal

from django.db import models

from apps.cart.models import Cart
from apps.shop.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "قيد الانتظار"
        PROCESSING = "processing", "قيد المعالجة"
        SHIPPED = "shipped", "تم الشحن"
        DELIVERED = "delivered", "تم التسليم"
        CANCELLED = "cancelled", "ملغى"

    class ShippingType(models.TextChoices):
        HOME = "home", "توصيل للبيت"
        DESK = "desk", "مكتب التوصيل"

    order_number = models.CharField(max_length=20, unique=True, editable=False, verbose_name='رقم الطلب')
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.PENDING, verbose_name='الحالة'
    )
    cart = models.ForeignKey(
        Cart,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        verbose_name='السلة',
    )

    # Totals
    subtotal_da = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"), verbose_name='المجموع الجزئي (دج)'
    )
    shipping_da = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"), verbose_name='الشحن (دج)'
    )
    grand_total_da = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"), verbose_name='المجموع الكلي (دج)'
    )

    # Shipping method
    shipping_type = models.CharField(
        max_length=10, choices=ShippingType.choices, default=ShippingType.HOME, verbose_name='طريقة التوصيل'
    )

    # Customer / delivery
    full_name = models.CharField(max_length=200, verbose_name='الاسم الكامل')
    phone = models.CharField(max_length=30, verbose_name='الهاتف')
    city = models.CharField(max_length=100, blank=True, default='', verbose_name='الولاية')
    baladia = models.CharField(max_length=100, blank=True, default='', verbose_name='البلدية')
    address_line = models.CharField(max_length=400, blank=True, default='', verbose_name='العنوان')
    notes = models.TextField(blank=True, verbose_name='ملاحظات')

    # ZR Express linkage — FK refs carry the UUIDs needed for parcel posting
    wilaya_ref = models.ForeignKey(
        'shop.Wilaya', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='orders', verbose_name='الولاية (مرجع)',
    )
    baladia_ref = models.ForeignKey(
        'shop.Baladia', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='orders', verbose_name='البلدية (مرجع)',
    )
    zr_submitted = models.BooleanField(default=False, verbose_name='مرسَل لـ ZR')
    zr_parcel_id = models.UUIDField(null=True, blank=True, verbose_name='معرّف ZR للطرد')
    zr_tracking_number = models.CharField(max_length=50, blank=True, default='', verbose_name='رقم التتبع ZR')
    zr_posted_at = models.DateTimeField(null=True, blank=True, verbose_name='تاريخ الإرسال لـ ZR')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الطلب')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخر تعديل')

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "طلب"
        verbose_name_plural = "الطلبات"

    def __str__(self):
        return f"{self.order_number} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = "ORD-" + uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items", verbose_name='الطلب')
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
        verbose_name='المنتج',
    )
    quantity = models.PositiveIntegerField(verbose_name='الكمية')
    unit_price_da_snapshot = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='سعر الوحدة (دج)')
    sku_snapshot = models.CharField(max_length=64, blank=True, verbose_name='رمز المنتج')
    product_name_snapshot_ar = models.CharField(max_length=220, blank=True, verbose_name='اسم المنتج')
    selected_size_snapshot = models.CharField(max_length=50, blank=True, default='', verbose_name='المقاس')
    selected_color_snapshot = models.CharField(max_length=50, blank=True, default='', verbose_name='اللون')

    class Meta:
        verbose_name = "عنصر الطلب"
        verbose_name_plural = "عناصر الطلب"

    def __str__(self):
        return f"{self.quantity}× {self.sku_snapshot} in {self.order.order_number}"

    @property
    def line_total(self) -> Decimal:
        return self.unit_price_da_snapshot * self.quantity


class ThanksMessage(models.Model):
    body = models.TextField(verbose_name='نص الرسالة')
    is_active = models.BooleanField(default=True, verbose_name='نشطة')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخر تعديل')

    class Meta:
        verbose_name = "رسالة الشكر"
        verbose_name_plural = "رسائل الشكر"

    def __str__(self):
        return self.body[:60]
