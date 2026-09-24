from django.urls import path

from theaters.api.views import (
    CityListView,
    MovieShowListView,
    ScreenListView,
    ShowDetailView,
    TheaterListView,
)


urlpatterns = [
    path(
        "cities/",
        CityListView.as_view(),
        name="city-list",
    ),

    path(
        "theaters/",
        TheaterListView.as_view(),
        name="theater-list",
    ),

    path(
        "screens/",
        ScreenListView.as_view(),
        name="screen-list",
    ),

    path(
        "movies/<int:movie_id>/shows/",
        MovieShowListView.as_view(),
        name="movie-show-list",
    ),

    path(
        "shows/<int:pk>/",
        ShowDetailView.as_view(),
        name="show-detail",
    ),
]