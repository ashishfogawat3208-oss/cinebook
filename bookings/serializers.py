from django.utils import timezone

from rest_framework import serializers

from bookings.models import (
    Booking,
    BookingSeat,
    Payment,
    ShowSeat,
)


class ShowSeatSerializer(
    serializers.ModelSerializer
):
    seat_label = serializers.SerializerMethodField()

    class Meta:
        model = ShowSeat

        fields = [
            "id",
            "seat_label",
            "price",
            "status",
        ]

        read_only_fields = [
            "id",
            "seat_label",
            "price",
            "status",
        ]

    def get_seat_label(self, obj):
        return (
            f"{obj.seat.row}"
            f"{obj.seat.number}"
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

        read_only_fields = [
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

        read_only_fields = [
            "payment_reference",
            "amount",
            "status",
            "paid_at",
        ]


class BookingSerializer(
    serializers.ModelSerializer
):
    booking_seats = BookingSeatSerializer(
        many=True,
        read_only=True,
    )

    payment = PaymentSerializer(
        read_only=True,
    )

    movie_title = serializers.CharField(
        source="show.movie.title",
        read_only=True,
    )

    movie_id = serializers.IntegerField(
        source="show.movie.id",
        read_only=True,
    )

    theater_name = serializers.CharField(
        source="show.screen.theater.name",
        read_only=True,
    )

    theater_id = serializers.IntegerField(
        source="show.screen.theater.id",
        read_only=True,
    )

    city_name = serializers.CharField(
        source="show.screen.theater.city.name",
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

    ticket_number = (
        serializers.SerializerMethodField()
    )

    ticket_download_url = (
        serializers.SerializerMethodField()
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

    def get_ticket_number(self, obj):
        try:
            return str(
                obj.ticket.ticket_number
            )
        except Exception:
            return None

    def get_ticket_download_url(self, obj):
        try:
            if not obj.ticket.pdf:
                return None
        except Exception:
            return None

        request = self.context.get(
            "request"
        )

        if request is None:
            return None

        return request.build_absolute_uri(
            f"/api/bookings/tickets/"
            f"{obj.booking_id}/download/"
        )

    def get_remaining_seconds(self, obj):
        if obj.status != Booking.STATUS_PENDING:
            return 0

        if obj.expires_at is None:
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

        if obj.status == Booking.STATUS_PENDING:
            if (
                obj.expires_at
                and obj.expires_at > now
            ):
                return "PAYMENT_PENDING"

            return "EXPIRED"

        if obj.status == Booking.STATUS_CONFIRMED:
            if obj.show.start_time >= now:
                return "UPCOMING"

            return "COMPLETED"

        if obj.status == Booking.STATUS_FAILED:
            return "FAILED"

        if obj.status == Booking.STATUS_CANCELLED:
            return "CANCELLED"

        if obj.status == Booking.STATUS_EXPIRED:
            return "EXPIRED"

        return "OTHER"


class CreateBookingSerializer(
    serializers.Serializer
):
    show_id = serializers.IntegerField(
        min_value=1
    )

    show_seat_ids = serializers.ListField(
        child=serializers.IntegerField(
            min_value=1
        ),
        allow_empty=False,
        min_length=1,
        max_length=10,
    )

    def validate_show_seat_ids(
        self,
        value,
    ):
        if len(value) != len(set(value)):
            raise serializers.ValidationError(
                "Duplicate seats are not allowed."
            )

        return value