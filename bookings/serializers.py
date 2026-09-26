from django.utils import timezone

from rest_framework import serializers

from bookings.models import (
    Booking,
    BookingSeat,
    Payment,
    ShowSeat,
    Ticket,
)


class ShowSeatSerializer(
    serializers.ModelSerializer
):

    seat_label = serializers.SerializerMethodField()

    reservation_status = (
        serializers.SerializerMethodField()
    )

    held_by_current_user = (
        serializers.SerializerMethodField()
    )

    remaining_seconds = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = ShowSeat

        fields = [
            "id",
            "seat_label",
            "price",
            "status",
            "reservation_status",
            "held_until",
            "held_by_current_user",
            "remaining_seconds",
        ]

        read_only_fields = fields

    def get_seat_label(self, obj):

        return (
            f"{obj.seat.row}"
            f"{obj.seat.number}"
        )

    def _active_hold(self, obj):

        return (
            obj.status
            == ShowSeat.STATUS_AVAILABLE
            and obj.held_until is not None
            and obj.held_until > timezone.now()
        )

    def get_reservation_status(self, obj):

        if (
            obj.status
            == ShowSeat.STATUS_BOOKED
        ):
            return "BOOKED"

        if not self._active_hold(obj):
            return "AVAILABLE"

        request = self.context.get(
            "request"
        )

        if (
            request
            and request.user.is_authenticated
            and obj.held_by_id
            == request.user.id
        ):
            return "MY_RESERVATION"

        return "TEMPORARILY_RESERVED"

    def get_held_by_current_user(self, obj):

        request = self.context.get(
            "request"
        )

        return bool(
            request
            and request.user.is_authenticated
            and obj.held_by_id
            == request.user.id
            and self._active_hold(obj)
        )

    def get_remaining_seconds(self, obj):

        if not self._active_hold(obj):
            return 0

        remaining = (
            obj.held_until
            - timezone.now()
        ).total_seconds()

        return max(
            0,
            int(remaining),
        )


class BookingSeatSerializer(
    serializers.ModelSerializer
):

    seat_label = serializers.SerializerMethodField()

    class Meta:
        model = BookingSeat

        fields = [
            "id",
            "seat_label",
            "price",
        ]

    def get_seat_label(self, obj):

        return (
            f"{obj.show_seat.seat.row}"
            f"{obj.show_seat.seat.number}"
        )


class PaymentSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = Payment

        fields = [
            "payment_reference",
            "amount",
            "status",
            "paid_at",
        ]


class TicketSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = Ticket

        fields = [
            "ticket_number",
            "booking_id",
            "verification_code",
            "pdf",
            "generated_at",
            "created_at",
        ]


class BookingSerializer(
    serializers.ModelSerializer
):

    booking_seats = BookingSeatSerializer(
        many=True,
        read_only=True,
    )

    payment = PaymentSerializer(
        read_only=True
    )

    ticket_number = (
        serializers.SerializerMethodField()
    )

    ticket_download_url = (
        serializers.SerializerMethodField()
    )

    movie_id = serializers.IntegerField(
        source="show.movie_id",
        read_only=True,
    )

    movie_title = serializers.CharField(
        source="show.movie.title",
        read_only=True,
    )

    city_name = serializers.CharField(
        source="show.screen.theater.city.name",
        read_only=True,
    )

    theater_id = serializers.IntegerField(
        source="show.screen.theater_id",
        read_only=True,
    )

    theater_name = serializers.CharField(
        source="show.screen.theater.name",
        read_only=True,
    )

    screen_name = serializers.CharField(
        source="show.screen.name",
        read_only=True,
    )

    show_time = serializers.DateTimeField(
        source="show.start_time",
        read_only=True,
    )

    remaining_seconds = (
        serializers.SerializerMethodField()
    )

    booking_category = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = Booking

        fields = [
            "booking_id",
            "movie_id",
            "movie_title",
            "city_name",
            "theater_id",
            "theater_name",
            "screen_name",
            "show_time",
            "booking_seats",
            "total_amount",
            "status",
            "expires_at",
            "remaining_seconds",
            "booking_category",
            "payment",
            "ticket_number",
            "ticket_download_url",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields

    def get_remaining_seconds(self, obj):

        if (
            obj.status
            != Booking.STATUS_PENDING
        ):
            return 0

        if not obj.expires_at:
            return 0

        remaining = (
            obj.expires_at
            - timezone.now()
        ).total_seconds()

        return max(
            0,
            int(remaining),
        )

    def get_booking_category(self, obj):

        now = timezone.now()

        if (
            obj.status
            == Booking.STATUS_PENDING
            and obj.expires_at
            and obj.expires_at > now
        ):
            return "pending"

        if (
            obj.status
            == Booking.STATUS_CONFIRMED
            and obj.show.start_time >= now
        ):
            return "upcoming"

        if (
            obj.status
            == Booking.STATUS_CONFIRMED
            and obj.show.start_time < now
        ):
            return "completed"

        if (
            obj.status
            == Booking.STATUS_CANCELLED
        ):
            return "cancelled"

        if (
            obj.status
            == Booking.STATUS_FAILED
        ):
            return "failed"

        if (
            obj.status
            == Booking.STATUS_EXPIRED
        ):
            return "expired"

        return "unknown"

    def get_ticket_number(self, obj):

        if hasattr(obj, "ticket"):
            return str(
                obj.ticket.ticket_number
            )

        return None

    def get_ticket_download_url(self, obj):

        if not hasattr(obj, "ticket"):
            return None

        if not obj.ticket.pdf:
            return None

        request = self.context.get(
            "request"
        )

        if request:
            return request.build_absolute_uri(
                obj.ticket.pdf.url
            )

        return obj.ticket.pdf.url


class CreateBookingSerializer(
    serializers.Serializer
):

    show_id = serializers.IntegerField()

    show_seat_ids = serializers.ListField(
        child=serializers.IntegerField(
            min_value=1
        ),
        allow_empty=False,
    )


class ReserveSeatsSerializer(
    serializers.Serializer
):

    show_seat_ids = serializers.ListField(
        child=serializers.IntegerField(
            min_value=1
        ),
        allow_empty=False,
    )

class TicketVerificationSerializer(serializers.Serializer):
    valid = serializers.BooleanField()
    ticket_number = serializers.CharField(
        allow_null=True,
        required=False,
    )
    booking_id = serializers.UUIDField(
        allow_null=True,
        required=False,
    )
    movie_title = serializers.CharField(
        allow_null=True,
        required=False,
    )
    theater_name = serializers.CharField(
        allow_null=True,
        required=False,
    )
    screen_name = serializers.CharField(
        allow_null=True,
        required=False,
    )
    city_name = serializers.CharField(
        allow_null=True,
        required=False,
    )
    show_time = serializers.DateTimeField(
        allow_null=True,
        required=False,
    )
    seats = serializers.ListField(
        child=serializers.CharField(),
        required=False,
    )