from datetime import timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from bookings.models import Booking, BookingSeat, ShowSeat


BOOKING_PAYMENT_WINDOW_MINUTES = 15


@transaction.atomic
def create_booking(*, user, show, show_seat_ids):
    """
    Create a pending booking while atomically locking the
    requested ShowSeat rows.

    The selected seats remain BOOKED while the booking is
    pending and are released if payment fails or the booking
    expires.
    """

    if not show_seat_ids:
        raise ValidationError(
            "At least one seat must be selected."
        )

    try:
        requested_seat_ids = [
            int(seat_id)
            for seat_id in show_seat_ids
        ]
    except (TypeError, ValueError):
        raise ValidationError(
            "Seat IDs must be valid integers."
        )

    if any(
        seat_id <= 0
        for seat_id in requested_seat_ids
    ):
        raise ValidationError(
            "Seat IDs must be positive integers."
        )

    if len(requested_seat_ids) != len(
        set(requested_seat_ids)
    ):
        raise ValidationError(
            "Duplicate seats are not allowed."
        )

    if show is None:
        raise ValidationError(
            "Invalid show."
        )

    now = timezone.now()

    if show.start_time <= now:
        raise ValidationError(
            "This show has already started."
        )

    # Lock the requested ShowSeat rows so two users
    # cannot successfully book the same seats concurrently.
    show_seats = list(
        ShowSeat.objects
        .select_for_update()
        .select_related("seat")
        .filter(
            id__in=requested_seat_ids,
            show=show,
        )
        .order_by(
            "seat__row",
            "seat__number",
        )
    )

    if len(show_seats) != len(
        requested_seat_ids
    ):
        raise ValidationError(
            "One or more selected seats are invalid "
            "for this show."
        )

    unavailable = [
        seat
        for seat in show_seats
        if seat.status != ShowSeat.STATUS_AVAILABLE
    ]

    if unavailable:
        seat_names = ", ".join(
            f"{seat.seat.row}{seat.seat.number}"
            for seat in unavailable
        )

        raise ValidationError(
            f"These seats are no longer available: "
            f"{seat_names}"
        )

    total_amount = sum(
        (
            seat.price
            for seat in show_seats
        ),
        Decimal("0.00"),
    )

    if total_amount <= Decimal("0.00"):
        raise ValidationError(
            "The selected seats have an invalid price."
        )

    expires_at = (
        now
        + timedelta(
            minutes=BOOKING_PAYMENT_WINDOW_MINUTES
        )
    )

    booking = Booking.objects.create(
        user=user,
        show=show,
        total_amount=total_amount,
        status=Booking.STATUS_PENDING,
        expires_at=expires_at,
    )

    BookingSeat.objects.bulk_create(
        [
            BookingSeat(
                booking=booking,
                show_seat=show_seat,
                price=show_seat.price,
            )
            for show_seat in show_seats
        ]
    )

    ShowSeat.objects.filter(
        id__in=[
            seat.id
            for seat in show_seats
        ],
        show=show,
    ).update(
        status=ShowSeat.STATUS_BOOKED
    )

    return booking


@transaction.atomic
def release_booking_seats(booking):
    """
    Release seats belonging to a booking.

    Only seats currently marked BOOKED are released.
    This makes the operation safe to call more than once.
    """

    booking = (
        Booking.objects
        .select_for_update()
        .get(pk=booking.pk)
    )

    show_seat_ids = list(
        booking.booking_seats.values_list(
            "show_seat_id",
            flat=True,
        )
    )

    if show_seat_ids:
        (
            ShowSeat.objects
            .filter(
                id__in=show_seat_ids,
                show=booking.show,
                status=ShowSeat.STATUS_BOOKED,
            )
            .update(
                status=ShowSeat.STATUS_AVAILABLE
            )
        )

    return booking