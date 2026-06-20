from rest_framework import serializers

from .models import Principle, Review


class PrincipleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Principle
        fields = "__all__"


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = "__all__"
        read_only_fields = ("created_at", "verified", "approved", "sort_order")
