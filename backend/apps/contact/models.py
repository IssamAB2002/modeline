from django.db import models


class Showroom(models.Model):
    city_ar = models.CharField(max_length=100)
    city_en = models.CharField(max_length=100, blank=True)
    address_ar = models.CharField(max_length=255)
    address_en = models.CharField(max_length=255, blank=True)
    hours_ar = models.CharField(max_length=200)
    hours_en = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)
    note_ar = models.CharField(max_length=255, blank=True)
    note_en = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("sort_order",)
        verbose_name = "Showroom"
        verbose_name_plural = "Showrooms"

    def __str__(self):
        return self.city_ar


class Faq(models.Model):
    question_ar = models.CharField(max_length=500)
    question_en = models.CharField(max_length=500, blank=True)
    answer_ar = models.TextField()
    answer_en = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("sort_order",)
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"

    def __str__(self):
        return self.question_ar[:80]


class ContactMessage(models.Model):
    class InquiryType(models.TextChoices):
        GENERAL = "general", "General"
        ORDER = "order", "Order"
        CUSTOM = "custom", "Custom"
        WHOLESALE = "wholesale", "Wholesale"
        RETURNS = "returns", "Returns"
        ARTISAN = "artisan", "Artisan"

    inquiry_type = models.CharField(
        max_length=20,
        choices=InquiryType.choices,
        default=InquiryType.GENERAL,
    )
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    subject = models.CharField(max_length=300)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    status = models.CharField(max_length=30, blank=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "Contact Message"
        verbose_name_plural = "Contact Messages"

    def __str__(self):
        return f"{self.name} — {self.subject[:60]}"
