from django.contrib import admin

from .models import Booking, BookingSeat, Payment, ShowSeat, Ticket


@admin.register(ShowSeat)
class ShowSeatAdmin(admin.ModelAdmin):
    list_display = (
        "show",
        "seat",
        "price",
        "status",
    )

    list_filter = (
        "status",
        "show",
    )

    search_fields = (
        "seat__row",
        "show__movie__title",
        "show__screen__theater__name",
    )


class BookingSeatInline(admin.TabularInline):
    model = BookingSeat
    extra = 0
    readonly_fields = ("price",)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "booking_id",
        "user",
        "show",
        "total_amount",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "booking_id",
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "booking_id",
        "created_at",
        "updated_at",
    )

    inlines = [
        BookingSeatInline,
    ]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "payment_reference",
        "booking",
        "amount",
        "status",
        "paid_at",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "payment_reference",
        "booking__booking_id",
    )


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        "ticket_number",
        "booking",
        "generated_at",
        "created_at",
    )

    search_fields = (
        "ticket_number",
        "booking__booking_id",
        "verification_code",
    )

    readonly_fields = (
        "ticket_number",
        "verification_code",
        "generated_at",
        "created_at",
    )