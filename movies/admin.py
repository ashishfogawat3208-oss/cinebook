from django.contrib import admin

from movies.models import (
    Genre,
    Language,
    Movie,
    MovieView,
)

from movies.review_models import (
    CastMember,
    MovieCast,
    MoviePoster,
    MovieReview,
)


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
    ]

    search_fields = [
        "name",
    ]


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
    ]

    search_fields = [
        "name",
    ]


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "title",
        "release_date",
        "age_certification",
        "duration_minutes",
        "rating",
        "popularity",
        "is_active",
    ]

    list_filter = [
        "is_active",
        "age_certification",
        "release_date",
    ]

    search_fields = [
        "title",
        "description",
    ]

    filter_horizontal = [
        "genres",
        "languages",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
    ]

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "title",
                    "description",
                    "release_date",
                    "duration_minutes",
                    "age_certification",
                )
            },
        ),
        (
            "Media",
            {
                "fields": (
                    "poster",
                    "trailer_url",
                )
            },
        ),
        (
            "Classification",
            {
                "fields": (
                    "genres",
                    "languages",
                )
            },
        ),
        (
            "Performance",
            {
                "fields": (
                    "rating",
                    "popularity",
                    "is_active",
                )
            },
        ),
        (
            "System",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )


@admin.register(CastMember)
class CastMemberAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "role",
    ]

    search_fields = [
        "name",
        "role",
    ]


@admin.register(MovieCast)
class MovieCastAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "movie",
        "cast_member",
        "character_name",
        "display_order",
    ]

    list_filter = [
        "movie",
    ]

    search_fields = [
        "movie__title",
        "cast_member__name",
        "character_name",
    ]

    ordering = [
        "movie",
        "display_order",
    ]


@admin.register(MoviePoster)
class MoviePosterAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "movie",
        "is_primary",
        "display_order",
        "created_at",
    ]

    list_filter = [
        "is_primary",
    ]

    search_fields = [
        "movie__title",
    ]

    ordering = [
        "movie",
        "display_order",
    ]


@admin.register(MovieReview)
class MovieReviewAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "movie",
        "user",
        "rating",
        "is_reported",
        "is_hidden",
        "created_at",
    ]

    list_filter = [
        "rating",
        "is_reported",
        "is_hidden",
    ]

    search_fields = [
        "movie__title",
        "user__username",
        "review_text",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
    ]

    actions = [
        "hide_selected_reviews",
        "unhide_selected_reviews",
    ]

    @admin.action(
        description="Hide selected reviews"
    )
    def hide_selected_reviews(
        self,
        request,
        queryset,
    ):
        queryset.update(
            is_hidden=True
        )

    @admin.action(
        description="Unhide selected reviews"
    )
    def unhide_selected_reviews(
        self,
        request,
        queryset,
    ):
        queryset.update(
            is_hidden=False
        )


@admin.register(MovieView)
class MovieViewAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "movie",
        "user",
        "viewed_at",
    ]

    list_filter = [
        "viewed_at",
    ]

    search_fields = [
        "movie__title",
        "user__username",
    ]