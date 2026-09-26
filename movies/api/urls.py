from django.urls import path

from movies.api.review_views import (
    MovieReviewListCreateView,
    MovieReviewUpdateDeleteView,
    ReportMovieReviewView,
)

from movies.api.views import (
    MovieDiscoveryView,
    MovieDetailView,
    MovieViewCreateView,
    RecommendedMovieView,
)


urlpatterns = [
    # ---------------------------------------------------------
    # Movie discovery
    # GET /api/movies/
    # ---------------------------------------------------------
    path(
        "",
        MovieDiscoveryView.as_view(),
        name="movie-discovery",
    ),

    # ---------------------------------------------------------
    # Movie detail
    # GET /api/movies/<id>/
    # ---------------------------------------------------------
    path(
        "<int:pk>/",
        MovieDetailView.as_view(),
        name="movie-detail",
    ),

    # ---------------------------------------------------------
    # Recommendations
    # GET /api/movies/recommended/
    # ---------------------------------------------------------
    path(
        "recommended/",
        RecommendedMovieView.as_view(),
        name="recommended-movies",
    ),

    # ---------------------------------------------------------
    # Movie view tracking
    # POST /api/movies/views/
    # ---------------------------------------------------------
    path(
        "views/",
        MovieViewCreateView.as_view(),
        name="movie-view-create",
    ),

    # ---------------------------------------------------------
    # Movie reviews
    # GET  /api/movies/<movie_id>/reviews/
    # POST /api/movies/<movie_id>/reviews/
    # ---------------------------------------------------------
    path(
        "<int:movie_id>/reviews/",
        MovieReviewListCreateView.as_view(),
        name="movie-review-list-create",
    ),

    # ---------------------------------------------------------
    # Edit/delete own review
    # PUT/PATCH/DELETE
    # /api/movies/reviews/<review_id>/
    # ---------------------------------------------------------
    path(
        "reviews/<int:review_id>/",
        MovieReviewUpdateDeleteView.as_view(),
        name="movie-review-detail",
    ),

    # ---------------------------------------------------------
    # Report review
    # POST /api/movies/reviews/<review_id>/report/
    # ---------------------------------------------------------
    path(
        "reviews/<int:review_id>/report/",
        ReportMovieReviewView.as_view(),
        name="movie-review-report",
    ),
]