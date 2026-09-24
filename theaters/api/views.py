from django.db.models import (
    Count,
    Q,
)
from django.shortcuts import get_object_or_404

from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from movies.models import Movie
from theaters.models import (
    City,
    Theater,
    Screen,
    Show,
)
from theaters.api.serializers import (
    CitySerializer,
    TheaterSerializer,
    ScreenSerializer,
    ShowSerializer,
)


class CityListView(generics.ListAPIView):
    """
    Return all cities that have theaters.
    """

    permission_classes = [
        AllowAny
    ]

    serializer_class = CitySerializer

    def get_queryset(self):
        return (
            City.objects
            .annotate(
                theater_count=Count(
                    "theaters",
                    distinct=True,
                )
            )
            .filter(
                theater_count__gt=0
            )
            .order_by("name")
        )


class TheaterListView(generics.ListAPIView):
    """
    Return theaters.

    Optional filters:
    - city
    - movie
    """

    permission_classes = [
        AllowAny
    ]

    serializer_class = TheaterSerializer

    def get_queryset(self):
        queryset = (
            Theater.objects
            .select_related("city")
            .annotate(
                screen_count=Count(
                    "screens",
                    distinct=True,
                )
            )
        )

        city_id = self.request.query_params.get(
            "city"
        )

        movie_id = self.request.query_params.get(
            "movie"
        )

        if city_id:
            queryset = queryset.filter(
                city_id=city_id
            )

        if movie_id:
            queryset = queryset.filter(
                screens__shows__movie_id=movie_id
            )

        return (
            queryset
            .distinct()
            .order_by(
                "city__name",
                "name",
            )
        )


class ScreenListView(generics.ListAPIView):
    """
    Return screens belonging to a theater.
    """

    permission_classes = [
        AllowAny
    ]

    serializer_class = ScreenSerializer

    def get_queryset(self):
        queryset = (
            Screen.objects
            .select_related("theater")
            .order_by("name")
        )

        theater_id = self.request.query_params.get(
            "theater"
        )

        if theater_id:
            queryset = queryset.filter(
                theater_id=theater_id
            )

        return queryset


class MovieShowListView(generics.ListAPIView):
    """
    Return shows for a specific movie.

    Supports:
    - city
    - theater
    - date
    - time_from
    - time_to
    - min_price
    - max_price
    """

    permission_classes = [
        AllowAny
    ]

    serializer_class = ShowSerializer

    def get_queryset(self):
        movie_id = self.kwargs["movie_id"]

        get_object_or_404(
            Movie,
            id=movie_id,
        )

        queryset = (
            Show.objects
            .filter(
                movie_id=movie_id
            )
            .select_related(
                "movie",
                "screen",
                "screen__theater",
                "screen__theater__city",
            )
            .annotate(
                total_seats=Count(
                    "show_seats",
                    distinct=True,
                ),
                available_seats=Count(
                    "show_seats",
                    filter=Q(
                        show_seats__status="AVAILABLE"
                    ),
                    distinct=True,
                ),
            )
        )

        params = self.request.query_params

        city_id = params.get(
            "city"
        )

        theater_id = params.get(
            "theater"
        )

        show_date = params.get(
            "date"
        )

        time_from = params.get(
            "time_from"
        )

        time_to = params.get(
            "time_to"
        )

        min_price = params.get(
            "min_price"
        )

        max_price = params.get(
            "max_price"
        )

        if city_id:
            queryset = queryset.filter(
                screen__theater__city_id=city_id
            )

        if theater_id:
            queryset = queryset.filter(
                screen__theater_id=theater_id
            )

        if show_date:
            queryset = queryset.filter(
                start_time__date=show_date
            )

        if time_from:
            queryset = queryset.filter(
                start_time__time__gte=time_from
            )

        if time_to:
            queryset = queryset.filter(
                start_time__time__lte=time_to
            )

        if min_price:
            queryset = queryset.filter(
                ticket_price__gte=min_price
            )

        if max_price:
            queryset = queryset.filter(
                ticket_price__lte=max_price
            )

        return queryset.order_by(
            "start_time",
            "ticket_price",
            "screen__theater__name",
        )


class ShowDetailView(
    generics.RetrieveAPIView
):
    """
    Detailed information for one show.
    """

    permission_classes = [
        AllowAny
    ]

    serializer_class = ShowSerializer

    queryset = (
        Show.objects
        .select_related(
            "movie",
            "screen",
            "screen__theater",
            "screen__theater__city",
        )
        .annotate(
            total_seats=Count(
                "show_seats",
                distinct=True,
            ),
            available_seats=Count(
                "show_seats",
                filter=Q(
                    show_seats__status="AVAILABLE"
                ),
                distinct=True,
            ),
        )
    )