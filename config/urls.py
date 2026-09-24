from django.contrib import admin
from django.urls import include, path

from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/movies/",
        include("movies.api.urls"),
    ),

    path(
        "api/auth/",
        include("accounts.api.urls"),
    ),

    path(
        "api/bookings/",
        include("bookings.urls"),
    ),

    path(
        "api/theaters/",
        include("theaters.api.urls"),
    ),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )