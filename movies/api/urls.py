from django.urls import path

from movies.api.filter_views import (
    GenreListView,
    LanguageListView,
)

from movies.api.views import (
    MovieDetailView,
    MovieDiscoveryView,
    MovieViewCreateView,
    RecommendedMovieView,
)


urlpatterns = [
    path(
        "",
        MovieDiscoveryView.as_view(),
        name="movie-discovery",
    ),

    path(
        "genres/",
        GenreListView.as_view(),
        name="movie-genres",
    ),

    path(
        "languages/",
        LanguageListView.as_view(),
        name="movie-languages",
    ),

    path(
        "recommended/",
        RecommendedMovieView.as_view(),
        name="movie-recommended",
    ),

    path(
        "views/",
        MovieViewCreateView.as_view(),
        name="movie-view-create",
    ),

    path(
        "<int:pk>/",
        MovieDetailView.as_view(),
        name="movie-detail",
    ),
]