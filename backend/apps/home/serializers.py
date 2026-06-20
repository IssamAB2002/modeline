from rest_framework import serializers

from .models import ContactInfo, FrontSettings, TrustStrip


class TrustStripSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrustStrip
        fields = "__all__"


class FrontSettingsSerializer(serializers.ModelSerializer):
    about_story_image_full_url = serializers.SerializerMethodField()

    class Meta:
        model = FrontSettings
        fields = "__all__"

    def get_about_story_image_full_url(self, obj):
        if not obj.about_story_image:
            return ''
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.about_story_image.url)
        return obj.about_story_image.url


class ContactInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactInfo
        fields = "__all__"
