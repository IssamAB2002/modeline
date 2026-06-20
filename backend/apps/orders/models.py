import uuid
from decimal import Decimal

from django.db import models

from apps.cart.models import Cart
from apps.shop.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    order_number = models.CharField(max_length=20, unique=True, editable=False)
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.PENDING
    )
    cart = models.ForeignKey(
        Cart,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )

    # Totals
    subtotal_da = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    shipping_da = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    grand_total_da = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    currency = models.CharField(max_length=10, default="DA")

    # Customer / delivery
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30)
    city = models.CharField(max_length=100)
    address_line = models.CharField(max_length=400)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "Order"
        verbose_name_plural = "Orders"

    def __str__(self):
        return f"{self.order_number} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = "ORD-" + uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    quantity = models.PositiveIntegerField()
    unit_price_da_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    sku_snapshot = models.CharField(max_length=64, blank=True)
    product_name_snapshot_ar = models.CharField(max_length=220, blank=True)
    product_name_snapshot_en = models.CharField(max_length=220, blank=True)

    class Meta:
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"

    def __str__(self):
        return f"{self.quantity}× {self.sku_snapshot} in {self.order.order_number}"

    @property
    def line_total(self) -> Decimal:
        return self.unit_price_da_snapshot * self.quantity
