from django.urls import path

from movies.api.review_views import (
    MovieReviewListCreateView,
    MovieReviewUpdateDeleteView,
    ReportMovieReviewView,
)

from movies.api.views import (
    GenreListView,
    LanguageListView,
    MovieDiscoveryView,
    MovieDetailView,
    MovieViewCreateView,
    RecommendedMovieView,
)


urlpatterns = [
    # Movie discovery
    path(
        "",
        MovieDiscoveryView.as_view(),
        name="movie-discovery",
    ),

    # Genres
    path(
        "genres/",
        GenreListView.as_view(),
        name="genre-list",
    ),

    # Languages
    path(
        "languages/",
        LanguageListView.as_view(),
        name="language-list",
    ),

    # Movie details
    path(
        "<int:pk>/",
        MovieDetailView.as_view(),
        name="movie-detail",
    ),

    # Recommendations
    path(
        "recommended/",
        RecommendedMovieView.as_view(),
        name="recommended-movies",
    ),

    # Record movie view
    path(
        "views/",
        MovieViewCreateView.as_view(),
        name="movie-view-create",
    ),

    # Reviews
    path(
        "<int:movie_id>/reviews/",
        MovieReviewListCreateView.as_view(),
        name="movie-review-list-create",
    ),

    path(
        "reviews/<int:review_id>/",
        MovieReviewUpdateDeleteView.as_view(),
        name="movie-review-detail",
    ),

    path(
        "reviews/<int:review_id>/report/",
        ReportMovieReviewView.as_view(),
        name="movie-review-report",
    ),
]