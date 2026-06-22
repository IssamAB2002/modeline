from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("about", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(model_name="principle", name="title_en"),
        migrations.RemoveField(model_name="principle", name="body_en"),
        migrations.RemoveField(model_name="review", name="body_en"),
        migrations.RemoveField(model_name="review", name="client_name_en"),
        migrations.RemoveField(model_name="review", name="location_en"),
    ]
