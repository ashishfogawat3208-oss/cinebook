from django.db.models import (
    Count,
    Q,
)

from bookings.models import Booking
from movies.models import Movie, MovieView


def get_recommended_movies(
    user,
    limit=10,
):
    """
    Generate personalized movie recommendations
    using confirmed booking history and recently
    viewed movies.
    """

    confirmed_movie_ids = set(
        Booking.objects
        .filter(
            user=user,
            status=Booking.STATUS_CONFIRMED,
        )
        .values_list(
            "show__movie_id",
            flat=True,
        )
    )

    recent_view_movie_ids = list(
        MovieView.objects
        .filter(
            user=user
        )
        .order_by(
            "-viewed_at"
        )
        .values_list(
            "movie_id",
            flat=True,
        )[:20]
    )

    excluded_movie_ids = (
        confirmed_movie_ids
        | set(recent_view_movie_ids)
    )

    preferred_genre_ids = set(
        Booking.objects
        .filter(
            user=user,
            status=Booking.STATUS_CONFIRMED,
        )
        .values_list(
            "show__movie__genres__id",
            flat=True,
        )
    )

    preferred_genre_ids.update(
        MovieView.objects
        .filter(
            user=user
        )
        .values_list(
            "movie__genres__id",
            flat=True,
        )
    )

    preferred_language_ids = set(
        Booking.objects
        .filter(
            user=user,
            status=Booking.STATUS_CONFIRMED,
        )
        .values_list(
            "show__movie__languages__id",
            flat=True,
        )
    )

    preferred_language_ids.update(
        MovieView.objects
        .filter(
            user=user
        )
        .values_list(
            "movie__languages__id",
            flat=True,
        )
    )

    queryset = (
        Movie.objects
        .exclude(
            id__in=excluded_movie_ids
        )
        .annotate(
            matching_genres=Count(
                "genres",
                filter=Q(
                    genres__id__in=
                    preferred_genre_ids
                ),
                distinct=True,
            ),
            matching_languages=Count(
                "languages",
                filter=Q(
                    languages__id__in=
                    preferred_language_ids
                ),
                distinct=True,
            ),
        )
        .prefetch_related(
            "genres",
            "languages",
        )
        .order_by(
            "-matching_genres",
            "-matching_languages",
            "-rating",
            "-popularity",
            "-release_date",
            "title",
        )
    )

    return queryset[:limit]