from django.contrib import admin

from .models import City, Theater, Screen, Show, Seat


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Theater)
class TheaterAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "city",
        "is_active",
    )

    list_filter = (
        "city",
        "is_active",
    )

    search_fields = (
        "name",
        "address",
    )


@admin.register(Screen)
class ScreenAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "theater",
        "total_seats",
    )

    list_filter = ("theater",)

    search_fields = (
        "name",
        "theater__name",
    )


@admin.register(Show)
class ShowAdmin(admin.ModelAdmin):
    list_display = (
        "movie",
        "screen",
        "start_time",
        "end_time",
        "ticket_price",
        "is_active",
    )

    list_filter = (
        "is_active",
        "start_time",
    )

    search_fields = (
        "movie__title",
        "screen__name",
        "screen__theater__name",
    )

    date_hierarchy = "start_time"

    ordering = ("start_time",)


@admin.register(Seat)
class SeatAdmin(admin.ModelAdmin):
    list_display = (
        "screen",
        "row",
        "number",
        "seat_type",
    )

    list_filter = (
        "seat_type",
        "screen",
    )

    search_fields = (
        "row",
        "screen__name",
        "screen__theater__name",
    )