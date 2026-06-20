from django.db import migrations

WILAYAS = [
    (1,  "أدرار",           "Adrar"),
    (2,  "الشلف",           "Chlef"),
    (3,  "الأغواط",         "Laghouat"),
    (4,  "أم البواقي",       "Oum El Bouaghi"),
    (5,  "باتنة",           "Batna"),
    (6,  "بجاية",           "Béjaïa"),
    (7,  "بسكرة",           "Biskra"),
    (8,  "بشار",            "Béchar"),
    (9,  "البليدة",          "Blida"),
    (10, "البويرة",          "Bouira"),
    (11, "تمنراست",          "Tamanrasset"),
    (12, "تبسة",            "Tébessa"),
    (13, "تلمسان",           "Tlemcen"),
    (14, "تيارت",           "Tiaret"),
    (15, "تيزي وزو",         "Tizi Ouzou"),
    (16, "الجزائر",          "Alger"),
    (17, "الجلفة",           "Djelfa"),
    (18, "جيجل",            "Jijel"),
    (19, "سطيف",            "Sétif"),
    (20, "سعيدة",           "Saïda"),
    (21, "سكيكدة",           "Skikda"),
    (22, "سيدي بلعباس",      "Sidi Bel Abbès"),
    (23, "عنابة",           "Annaba"),
    (24, "قالمة",           "Guelma"),
    (25, "قسنطينة",          "Constantine"),
    (26, "المدية",           "Médéa"),
    (27, "مستغانم",          "Mostaganem"),
    (28, "المسيلة",          "M'Sila"),
    (29, "معسكر",           "Mascara"),
    (30, "ورقلة",           "Ouargla"),
    (31, "وهران",           "Oran"),
    (32, "البيض",           "El Bayadh"),
    (33, "إليزي",           "Illizi"),
    (34, "برج بوعريريج",     "Bordj Bou Arréridj"),
    (35, "بومرداس",          "Boumerdès"),
    (36, "الطارف",           "El Tarf"),
    (37, "تندوف",           "Tindouf"),
    (38, "تيسمسيلت",         "Tissemsilt"),
    (39, "الوادي",           "El Oued"),
    (40, "خنشلة",           "Khenchela"),
    (41, "سوق أهراس",        "Souk Ahras"),
    (42, "تيبازة",           "Tipaza"),
    (43, "ميلة",            "Mila"),
    (44, "عين الدفلى",       "Aïn Defla"),
    (45, "النعامة",          "Naâma"),
    (46, "عين تموشنت",       "Aïn Témouchent"),
    (47, "غرداية",           "Ghardaïa"),
    (48, "غليزان",           "Relizane"),
    (49, "المغير",           "El M'Ghair"),
    (50, "المنيعة",          "El Meniaa"),
    (51, "أولاد جلال",       "Ouled Djellal"),
    (52, "برج باجي مختار",   "Bordj Baji Mokhtar"),
    (53, "بني عباس",         "Béni Abbès"),
    (54, "تيميمون",          "Timimoun"),
    (55, "تقرت",            "Touggourt"),
    (56, "جانت",            "Djanet"),
    (57, "عين صالح",         "In Salah"),
    (58, "عين قزام",         "In Guezzam"),
]


def populate_wilayas(apps, schema_editor):
    Wilaya = apps.get_model("shop", "Wilaya")
    Wilaya.objects.bulk_create([
        Wilaya(code=code, name_ar=name_ar, name_fr=name_fr, shipping_price_da=700, is_active=True)
        for code, name_ar, name_fr in WILAYAS
    ])


def depopulate_wilayas(apps, schema_editor):
    apps.get_model("shop", "Wilaya").objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0003_wilaya"),
    ]

    operations = [
        migrations.RunPython(populate_wilayas, depopulate_wilayas),
    ]
