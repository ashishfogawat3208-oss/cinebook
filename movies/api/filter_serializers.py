from rest_framework import serializers

from movies.models import Genre, Language


class GenreFilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = [
            "id",
            "name",
        ]


class LanguageFilterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = [
            "id",
            "name",
        ]