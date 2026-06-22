from decimal import Decimal

from django.db import models

from apps.shop.models import Product


class Cart(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        ABANDONED = "abandoned", "Abandoned"
        CONVERTED = "converted", "Converted"

    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.ACTIVE
    )
    session_key = models.CharField(
        max_length=40, blank=True, null=True, db_index=True,
        help_text="Optional anonymous session identifier stored by the frontend.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "Cart"
        verbose_name_plural = "Carts"

    def __str__(self):
        return f"Cart #{self.pk} ({self.status})"

    @property
    def total_da(self) -> Decimal:
        return sum(
            (item.line_total for item in self.items.all()), Decimal("0.00")
        )


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="cart_items"
    )
    quantity = models.PositiveIntegerField(default=1)
    selected_size = models.CharField(max_length=50, blank=True, null=True)
    selected_color = models.CharField(max_length=50, blank=True, null=True)
    unit_price_da_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    product_name_snapshot_ar = models.CharField(max_length=220, blank=True)
    sku_snapshot = models.CharField(max_length=64, blank=True)

    class Meta:
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"

    def __str__(self):
        return f"{self.quantity}× {self.sku_snapshot} in Cart #{self.cart_id}"

    @property
    def line_total(self) -> Decimal:
        return self.unit_price_da_snapshot * self.quantity
