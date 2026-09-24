from django.contrib import admin

from .models import Genre, Language, Movie, MovieView


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "release_date",
        "rating",
        "popularity",
        "duration_minutes",
        "is_active",
    )

    list_filter = (
        "is_active",
        "genres",
        "languages",
        "release_date",
    )

    search_fields = (
        "title",
        "description",
    )

    filter_horizontal = (
        "genres",
        "languages",
    )

    ordering = (
        "-popularity",
        "-release_date",
    )

@admin.register(MovieView)
class MovieViewAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "movie",
        "viewed_at",
    )

    list_filter = (
        "viewed_at",
        "movie",
    )

    search_fields = (
        "user__username",
        "user__email",
        "movie__title",
    )

    ordering = (
        "-viewed_at",
    )