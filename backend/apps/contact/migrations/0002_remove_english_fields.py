from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("contact", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(model_name="showroom", name="city_en"),
        migrations.RemoveField(model_name="showroom", name="address_en"),
        migrations.RemoveField(model_name="showroom", name="hours_en"),
        migrations.RemoveField(model_name="showroom", name="note_en"),
        migrations.RemoveField(model_name="faq", name="question_en"),
        migrations.RemoveField(model_name="faq", name="answer_en"),
    ]
