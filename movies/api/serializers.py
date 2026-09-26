from rest_framework import serializers

from movies.models import (
    CastMember,
    Movie,
    MovieCast,
    MoviePoster,
)


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie._meta.get_field("genres").remote_field.model
        fields = [
            "id",
            "name",
        ]


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie._meta.get_field("languages").remote_field.model
        fields = [
            "id",
            "name",
        ]


class CastMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = CastMember
        fields = [
            "id",
            "name",
            "role",
            "photo",
        ]


class MovieCastSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(
        source="cast_member.id",
        read_only=True,
    )

    name = serializers.CharField(
        source="cast_member.name",
        read_only=True,
    )

    role = serializers.CharField(
        source="cast_member.role",
        read_only=True,
    )

    photo = serializers.ImageField(
        source="cast_member.photo",
        read_only=True,
    )

    character_name = serializers.CharField(
        read_only=True,
    )

    class Meta:
        model = MovieCast
        fields = [
            "id",
            "name",
            "role",
            "photo",
            "character_name",
        ]


class MoviePosterSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoviePoster
        fields = [
            "id",
            "image",
            "display_order",
            "is_primary",
        ]


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
    genres = GenreSerializer(
        many=True,
        read_only=True,
    )

    languages = LanguageSerializer(
        many=True,
        read_only=True,
    )

    cast_members = MovieCastSerializer(
        many=True,
        read_only=True,
    )

    posters = MoviePosterSerializer(
        many=True,
        read_only=True,
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
            "age_certification",
            "cast_members",
            "posters",
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