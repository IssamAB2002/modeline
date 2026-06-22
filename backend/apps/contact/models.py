from django.db import models


class Showroom(models.Model):
    city_ar = models.CharField(max_length=100, verbose_name='المدينة')
    address_ar = models.CharField(max_length=255, verbose_name='العنوان')
    hours_ar = models.CharField(max_length=200, verbose_name='ساعات العمل')
    phone = models.CharField(max_length=30, verbose_name='الهاتف')
    email = models.EmailField(blank=True, verbose_name='البريد الإلكتروني')
    note_ar = models.CharField(max_length=255, blank=True, verbose_name='ملاحظة')
    sort_order = models.PositiveIntegerField(default=0, verbose_name='الترتيب')
    is_active = models.BooleanField(default=True, verbose_name='نشط')

    class Meta:
        ordering = ("sort_order",)
        verbose_name = "معرض"
        verbose_name_plural = "المعارض"

    def __str__(self):
        return self.city_ar


class Faq(models.Model):
    question_ar = models.CharField(max_length=500, verbose_name='السؤال')
    answer_ar = models.TextField(verbose_name='الإجابة')
    sort_order = models.PositiveIntegerField(default=0, verbose_name='الترتيب')
    is_active = models.BooleanField(default=True, verbose_name='نشط')

    class Meta:
        ordering = ("sort_order",)
        verbose_name = "سؤال شائع"
        verbose_name_plural = "الأسئلة الشائعة"

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
        verbose_name='نوع الاستفسار',
    )
    name = models.CharField(max_length=200, verbose_name='الاسم')
    email = models.EmailField(verbose_name='البريد الإلكتروني')
    phone = models.CharField(max_length=30, blank=True, verbose_name='الهاتف')
    subject = models.CharField(max_length=300, verbose_name='الموضوع')
    message = models.TextField(verbose_name='الرسالة')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإرسال')
    is_read = models.BooleanField(default=False, verbose_name='مقروءة')
    status = models.CharField(max_length=30, blank=True, verbose_name='الحالة')

    class Meta:
        ordering = ("-created_at",)
        verbose_name = "رسالة تواصل"
        verbose_name_plural = "رسائل التواصل"

    def __str__(self):
        return f"{self.name} — {self.subject[:60]}"
