from rest_framework import serializers

from theaters.models import (
    City,
    Theater,
    Screen,
    Show,
)


class CitySerializer(serializers.ModelSerializer):
    theater_count = serializers.IntegerField(
        read_only=True
    )

    class Meta:
        model = City

        fields = [
            "id",
            "name",
            "theater_count",
        ]


class TheaterSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(
        source="city.name",
        read_only=True,
    )

    screen_count = serializers.IntegerField(
        read_only=True
    )

    class Meta:
        model = Theater

        fields = [
            "id",
            "name",
            "city",
            "city_name",
            "address",
            "screen_count",
        ]


class ScreenSerializer(serializers.ModelSerializer):
    theater_name = serializers.CharField(
        source="theater.name",
        read_only=True,
    )

    class Meta:
        model = Screen

        fields = [
            "id",
            "name",
            "theater",
            "theater_name",
        ]


class ShowSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(
        source="movie.title",
        read_only=True,
    )

    theater_name = serializers.CharField(
        source="screen.theater.name",
        read_only=True,
    )

    theater_id = serializers.IntegerField(
        source="screen.theater.id",
        read_only=True,
    )

    city_name = serializers.CharField(
        source="screen.theater.city.name",
        read_only=True,
    )

    city_id = serializers.IntegerField(
        source="screen.theater.city.id",
        read_only=True,
    )

    screen_name = serializers.CharField(
        source="screen.name",
        read_only=True,
    )

    available_seats = serializers.IntegerField(
        read_only=True
    )

    total_seats = serializers.IntegerField(
        read_only=True
    )

    class Meta:
        model = Show

        fields = [
            "id",
            "movie",
            "movie_title",
            "city_id",
            "city_name",
            "theater_id",
            "theater_name",
            "screen",
            "screen_name",
            "start_time",
            "ticket_price",
            "available_seats",
            "total_seats",
        ]