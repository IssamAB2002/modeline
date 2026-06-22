from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0010_arabic_data_migration"),
    ]

    operations = [
        # Category — promote name_ar to required unique, remove English fields
        migrations.AlterField(
            model_name="category",
            name="name_ar",
            field=models.CharField(max_length=120, unique=True, help_text="Category name in Arabic."),
        ),
        migrations.RemoveField(model_name="category", name="name"),
        migrations.RemoveField(model_name="category", name="description"),
        migrations.AlterModelOptions(
            name="category",
            options={
                "ordering": ("order", "name_ar"),
                "verbose_name": "Category",
                "verbose_name_plural": "Categories",
            },
        ),
        # Product — promote name_ar to required, remove English fields
        migrations.AlterField(
            model_name="product",
            name="name_ar",
            field=models.CharField(max_length=220, help_text="Product name in Arabic."),
        ),
        migrations.RemoveField(model_name="product", name="name"),
        migrations.RemoveField(model_name="product", name="short_description"),
        migrations.RemoveField(model_name="product", name="description"),
        migrations.AlterModelOptions(
            name="product",
            options={"ordering": ("-created_at", "name_ar")},
        ),
    ]
