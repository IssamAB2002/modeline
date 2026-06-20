from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Principle(models.Model):
    title_ar = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200, blank=True)
    body_ar = models.TextField()
    body_en = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("sort_order",)
        verbose_name = "Principle"
        verbose_name_plural = "Principles"

    def __str__(self):
        return self.title_ar


class Review(models.Model):
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Star rating from 1 to 5.",
    )
    body_ar = models.TextField()
    body_en = models.TextField(blank=True)
    client_name_ar = models.CharField(max_length=120)
    client_name_en = models.CharField(max_length=120, blank=True)
    location_ar = models.CharField(max_length=120, blank=True)
    location_en = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    approved = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(
        default=0,
        help_text="Curated display order (lower = first). Ties fall back to newest.",
    )

    class Meta:
        ordering = ("sort_order", "-created_at")
        verbose_name = "Review"
        verbose_name_plural = "Reviews"

    def __str__(self):
        return f"{self.client_name_ar} ({self.rating}★)"
