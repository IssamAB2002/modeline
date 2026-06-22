from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Principle(models.Model):
    title_ar = models.CharField(max_length=200, verbose_name='العنوان')
    body_ar = models.TextField(verbose_name='المحتوى')
    sort_order = models.PositiveIntegerField(default=0, verbose_name='الترتيب')
    is_active = models.BooleanField(default=True, verbose_name='نشط')

    class Meta:
        ordering = ("sort_order",)
        verbose_name = "مبدأ"
        verbose_name_plural = "المبادئ"

    def __str__(self):
        return self.title_ar


class Review(models.Model):
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='التقييم',
        help_text="Star rating from 1 to 5.",
    )
    body_ar = models.TextField(verbose_name='التعليق')
    client_name_ar = models.CharField(max_length=120, verbose_name='اسم العميل')
    location_ar = models.CharField(max_length=120, blank=True, verbose_name='الموقع')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    verified = models.BooleanField(default=False, verbose_name='موثق')
    approved = models.BooleanField(default=True, verbose_name='معتمد')
    sort_order = models.PositiveIntegerField(
        default=0,
        verbose_name='الترتيب',
        help_text="Curated display order (lower = first). Ties fall back to newest.",
    )

    class Meta:
        ordering = ("sort_order", "-created_at")
        verbose_name = "تقييم العملاء"
        verbose_name_plural = "تقييمات العملاء"

    def __str__(self):
        return f"{self.client_name_ar} ({self.rating}★)"
