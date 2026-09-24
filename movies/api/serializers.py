from rest_framework import serializers

from movies.models import Movie


class MovieDiscoverySerializer(
    serializers.ModelSerializer
):
    genres = serializers.StringRelatedField(
        many=True
    )

    languages = serializers.StringRelatedField(
        many=True
    )

    matching_count = serializers.IntegerField(
        read_only=True
    )

    class Meta:
        model = Movie

        fields = [
            "id",
            "title",
            "description",
            "genres",
            "languages",
            "release_date",
            "duration_minutes",
            "rating",
            "popularity",
            "poster",
            "trailer_url",
            "matching_count",
        ]


class MovieDetailSerializer(
    serializers.ModelSerializer
):
    genres = serializers.StringRelatedField(
        many=True
    )

    languages = serializers.StringRelatedField(
        many=True
    )

    class Meta:
        model = Movie

        fields = [
            "id",
            "title",
            "description",
            "genres",
            "languages",
            "release_date",
            "duration_minutes",
            "rating",
            "popularity",
            "poster",
            "trailer_url",
        ]


class RecommendedMovieSerializer(
    serializers.ModelSerializer
):
    genres = serializers.StringRelatedField(
        many=True
    )

    languages = serializers.StringRelatedField(
        many=True
    )

    class Meta:
        model = Movie

        fields = [
            "id",
            "title",
            "description",
            "genres",
            "languages",
            "release_date",
            "duration_minutes",
            "rating",
            "popularity",
            "poster",
            "trailer_url",
        ]