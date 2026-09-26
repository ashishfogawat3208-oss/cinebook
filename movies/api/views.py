from datetime import datetime

from django.db.models import (
    Count,
    Exists,
    OuterRef,
    Q,
    Subquery,
)
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response

from movies.models import Movie, MovieView
from movies.api.pagination import MoviePagination
from movies.api.serializers import (
    MovieDetailSerializer,
    MovieDiscoverySerializer,
    RecommendedMovieSerializer,
)
from movies.services.recommendations import (
    get_recommended_movies,
)
from theaters.models import Show


class MovieDiscoveryView(generics.ListAPIView):
    """
    Main movie discovery endpoint.

    Supports:

    Search:
        ?search=interstellar

    Filters:
        ?genre=1
        ?language=1
        ?city=1
        ?theater=1
        ?release_date=2026-09-20
        ?release_from=2026-01-01
        ?release_to=2026-12-31
        ?min_rating=7
        ?max_rating=10
        ?min_price=100
        ?max_price=500
        ?show_date=2026-09-20
        ?show_time=19:30

    Sorting:
        ?sort=popularity
        ?sort=newest
        ?sort=oldest
        ?sort=rating
        ?sort=price_low
        ?sort=price_high
        ?sort=title

    Pagination:
        ?page=1
        ?page_size=24
    """

    permission_classes = [
        AllowAny
    ]

    serializer_class = MovieDiscoverySerializer

    pagination_class = MoviePagination

    def get_queryset(self):
        params = self.request.query_params

        search = params.get("search")
        genre = params.get("genre")
        language = params.get("language")

        city = params.get("city")
        theater = params.get("theater")

        release_date = params.get(
            "release_date"
        )

        release_from = params.get(
            "release_from"
        )

        release_to = params.get(
            "release_to"
        )

        min_rating = params.get(
            "min_rating"
        )

        max_rating = params.get(
            "max_rating"
        )

        min_price = params.get(
            "min_price"
        )

        max_price = params.get(
            "max_price"
        )

        show_date = params.get(
            "show_date"
        )

        show_time = params.get(
            "show_time"
        )

        # -----------------------------------------------------
        # BASE QUERYSET
        # -----------------------------------------------------

        queryset = Movie.objects.all()

        # -----------------------------------------------------
        # SEARCH
        # -----------------------------------------------------

        if search:
            queryset = queryset.filter(
                title__icontains=search
            )

        # -----------------------------------------------------
        # GENRE
        # -----------------------------------------------------

        if genre:
            queryset = queryset.filter(
                genres__id=genre
            )

        # -----------------------------------------------------
        # LANGUAGE
        # -----------------------------------------------------

        if language:
            queryset = queryset.filter(
                languages__id=language
            )

        # -----------------------------------------------------
        # RELEASE DATE
        # -----------------------------------------------------

        if release_date:
            queryset = queryset.filter(
                release_date=release_date
            )

        if release_from:
            queryset = queryset.filter(
                release_date__gte=release_from
            )

        if release_to:
            queryset = queryset.filter(
                release_date__lte=release_to
            )

        # -----------------------------------------------------
        # RATING
        # -----------------------------------------------------

        if min_rating:
            queryset = queryset.filter(
                rating__gte=min_rating
            )

        if max_rating:
            queryset = queryset.filter(
                rating__lte=max_rating
            )

        # -----------------------------------------------------
        # SHOW FILTERS
        # -----------------------------------------------------

        show_filters = Q(
            movie=OuterRef("pk")
        )

        if city:
            show_filters &= Q(
                screen__theater__city_id=city
            )

        if theater:
            show_filters &= Q(
                screen__theater_id=theater
            )

        if show_date:
            show_filters &= Q(
                start_time__date=show_date
            )

        if show_time:
            try:
                parsed_time = datetime.strptime(
                    show_time,
                    "%H:%M",
                ).time()

                show_filters &= Q(
                    start_time__time=parsed_time
                )

            except ValueError:
                # Invalid time format simply
                # won't apply the time filter.
                pass

        if min_price:
            show_filters &= Q(
                ticket_price__gte=min_price
            )

        if max_price:
            show_filters &= Q(
                ticket_price__lte=max_price
            )

        matching_shows = Show.objects.filter(
            show_filters
        )

        # -----------------------------------------------------
        # MATCHING SHOW EXISTS
        # -----------------------------------------------------

        queryset = queryset.annotate(
            has_matching_show=Exists(
                matching_shows
            )
        )

        # If any show-specific filter was supplied,
        # only return movies that have a matching show.
        show_filter_values = [
            city,
            theater,
            show_date,
            show_time,
            min_price,
            max_price,
        ]

        if any(show_filter_values):
            queryset = queryset.filter(
                has_matching_show=True
            )

        # -----------------------------------------------------
        # LOWEST TICKET PRICE
        # -----------------------------------------------------

        lowest_price_query = (
            Show.objects
            .filter(
                movie=OuterRef("pk")
            )
            .order_by(
                "ticket_price"
            )
            .values(
                "ticket_price"
            )[:1]
        )

        # -----------------------------------------------------
        # HIGHEST TICKET PRICE
        # -----------------------------------------------------

        highest_price_query = (
            Show.objects
            .filter(
                movie=OuterRef("pk")
            )
            .order_by(
                "-ticket_price"
            )
            .values(
                "ticket_price"
            )[:1]
        )

        queryset = queryset.annotate(
            lowest_ticket_price=Subquery(
                lowest_price_query
            ),
            highest_ticket_price=Subquery(
                highest_price_query
            ),
        )

        # -----------------------------------------------------
        # MATCHING SHOW COUNT
        # -----------------------------------------------------

        queryset = queryset.annotate(
            matching_count=Count(
                "shows",
                distinct=True,
            )
        )

        # -----------------------------------------------------
        # RELATED DATA
        # -----------------------------------------------------

        queryset = queryset.prefetch_related(
            "genres",
            "languages",
        )

        # -----------------------------------------------------
        # SORTING
        # -----------------------------------------------------

        sort = params.get(
            "sort",
            "popularity",
        )

        sort_map = {
            "popularity": [
                "-popularity",
                "-rating",
                "title",
            ],

            "newest": [
                "-release_date",
                "-popularity",
            ],

            "oldest": [
                "release_date",
                "-popularity",
            ],

            "rating": [
                "-rating",
                "-popularity",
            ],

            "price_low": [
                "lowest_ticket_price",
                "-popularity",
            ],

            "price_high": [
                "-highest_ticket_price",
                "-popularity",
            ],

            "title": [
                "title",
            ],
        }

        queryset = queryset.order_by(
            *sort_map.get(
                sort,
                sort_map["popularity"],
            )
        )

        return queryset


class MovieDetailView(
    generics.RetrieveAPIView
):
    """
    Return complete information for one movie,
    including genres, languages, cast members,
    posters and age certification.
    """

    permission_classes = [
        AllowAny
    ]

    serializer_class = MovieDetailSerializer

    queryset = (
        Movie.objects
        .prefetch_related(
            "genres",
            "languages",
            "cast_members__cast_member",
            "posters",
        )
    )
    """
    Return complete information for one movie.
    """

    permission_classes = [
        AllowAny
    ]

    serializer_class = MovieDetailSerializer

    queryset = (
        Movie.objects
        .prefetch_related(
            "genres",
            "languages",
        )
    )


class MovieViewCreateView(
    generics.CreateAPIView
):
    """
    Record that an authenticated user
    viewed a movie.
    """

    permission_classes = [
        IsAuthenticated
    ]

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        movie_id = request.data.get(
            "movie_id"
        )

        if not movie_id:
            return Response(
                {
                    "detail": (
                        "movie_id is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        movie = get_object_or_404(
            Movie,
            id=movie_id,
        )

        MovieView.objects.create(
            user=request.user,
            movie=movie,
        )

        return Response(
            {
                "status": "recorded",
                "movie_id": movie.id,
            },
            status=status.HTTP_201_CREATED,
        )


class RecommendedMovieView(
    generics.ListAPIView
):
    """
    Return personalized movie recommendations
    for the authenticated user.
    """

    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = (
        RecommendedMovieSerializer
    )

    def get_queryset(self):
        return get_recommended_movies(
            self.request.user
        )