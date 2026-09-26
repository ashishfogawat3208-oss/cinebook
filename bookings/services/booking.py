from datetime import timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from bookings.models import (
    Booking,
    BookingSeat,
    ShowSeat,
)


# -------------------------------------------------
# SMART SEAT SETTINGS
# -------------------------------------------------

SEAT_HOLD_MINUTES = 2
BOOKING_PAYMENT_WINDOW_MINUTES = 2


# -------------------------------------------------
# HELPERS
# -------------------------------------------------

def validate_seat_ids(show_seat_ids):
    if not show_seat_ids:
        raise ValidationError(
            "At least one seat must be selected."
        )

    try:
        requested_ids = [
            int(seat_id)
            for seat_id in show_seat_ids
        ]
    except (TypeError, ValueError):
        raise ValidationError(
            "Seat IDs must be valid integers."
        )

    if any(
        seat_id <= 0
        for seat_id in requested_ids
    ):
        raise ValidationError(
            "Seat IDs must be positive integers."
        )

    if len(requested_ids) != len(
        set(requested_ids)
    ):
        raise ValidationError(
            "Duplicate seats are not allowed."
        )

    return requested_ids


# -------------------------------------------------
# EXPIRED HOLD CLEANUP
# -------------------------------------------------

@transaction.atomic
def cleanup_expired_seat_holds(show=None):
    now = timezone.now()

    queryset = ShowSeat.objects.filter(
        status=ShowSeat.STATUS_AVAILABLE,
        held_until__isnull=False,
        held_until__lte=now,
    )

    if show is not None:
        queryset = queryset.filter(
            show=show
        )

    return queryset.update(
        held_until=None,
        held_by=None,
    )


# -------------------------------------------------
# RESERVE SEATS
# -------------------------------------------------

@transaction.atomic
def reserve_seats(
    *,
    user,
    show,
    show_seat_ids,
):
    """
    Temporarily reserve selected seats for 2 minutes.

    Database row locks prevent concurrent users
    from successfully reserving the same seat.
    """

    requested_ids = validate_seat_ids(
        show_seat_ids
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

    show_seats = list(
        ShowSeat.objects
        .select_for_update()
        .select_related("seat")
        .filter(
            id__in=requested_ids,
            show=show,
        )
        .order_by(
            "seat__row",
            "seat__number",
        )
    )

    if len(show_seats) != len(
        requested_ids
    ):
        raise ValidationError(
            "One or more selected seats are invalid for this show."
        )

    unavailable = []

    for show_seat in show_seats:
        if (
            show_seat.status
            == ShowSeat.STATUS_AVAILABLE
            and show_seat.held_until
            and show_seat.held_until <= now
        ):
            show_seat.held_until = None
            show_seat.held_by = None

        if (
            show_seat.status
            == ShowSeat.STATUS_BOOKED
        ):
            unavailable.append(show_seat)
            continue

        if (
            show_seat.held_until
            and show_seat.held_until > now
            and show_seat.held_by_id != user.id
        ):
            unavailable.append(show_seat)

    if unavailable:
        seat_names = ", ".join(
            f"{seat.seat.row}{seat.seat.number}"
            for seat in unavailable
        )

        raise ValidationError(
            "These seats are no longer available: "
            f"{seat_names}"
        )

    held_until = (
        now
        + timedelta(
            minutes=SEAT_HOLD_MINUTES
        )
    )

    ShowSeat.objects.filter(
        id__in=[
            seat.id
            for seat in show_seats
        ],
        show=show,
    ).update(
        held_until=held_until,
        held_by=user,
    )

    return list(
        ShowSeat.objects
        .select_related("seat", "held_by")
        .filter(
            id__in=[
                seat.id
                for seat in show_seats
            ]
        )
        .order_by(
            "seat__row",
            "seat__number",
        )
    )


# -------------------------------------------------
# RELEASE USER'S TEMPORARY HOLDS
# -------------------------------------------------

@transaction.atomic
def release_seat_holds(
    *,
    user,
    show,
    show_seat_ids=None,
):
    """
    Release temporary reservations owned by
    the current user.

    Returns the number of released seats.
    """

    queryset = (
        ShowSeat.objects
        .select_for_update()
        .filter(
            show=show,
            status=ShowSeat.STATUS_AVAILABLE,
            held_by=user,
        )
    )

    if show_seat_ids:
        requested_ids = validate_seat_ids(
            show_seat_ids
        )

        queryset = queryset.filter(
            id__in=requested_ids
        )

    seats = list(queryset)

    if not seats:
        return 0

    for seat in seats:
        seat.held_until = None
        seat.held_by = None

        seat.save(
            update_fields=[
                "held_until",
                "held_by",
            ]
        )

    return len(seats)


# -------------------------------------------------
# CREATE BOOKING
# -------------------------------------------------

@transaction.atomic
def create_booking(
    *,
    user,
    show,
    show_seat_ids,
):
    """
    Convert the user's temporary seat reservation
    into a PENDING booking.

    IMPORTANT:
    Seats remain temporarily held and AVAILABLE
    until payment succeeds.

    They are changed to BOOKED only after successful
    payment verification/webhook processing.
    """

    requested_ids = validate_seat_ids(
        show_seat_ids
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

    show_seats = list(
        ShowSeat.objects
        .select_for_update()
        .select_related("seat")
        .filter(
            id__in=requested_ids,
            show=show,
        )
        .order_by(
            "seat__row",
            "seat__number",
        )
    )

    if len(show_seats) != len(
        requested_ids
    ):
        raise ValidationError(
            "One or more selected seats are invalid for this show."
        )

    unavailable = []

    for show_seat in show_seats:
        if (
            show_seat.status
            == ShowSeat.STATUS_BOOKED
        ):
            unavailable.append(show_seat)
            continue

        if (
            show_seat.held_by_id != user.id
            or not show_seat.held_until
            or show_seat.held_until <= now
        ):
            unavailable.append(show_seat)

    if unavailable:
        seat_names = ", ".join(
            f"{seat.seat.row}{seat.seat.number}"
            for seat in unavailable
        )

        raise ValidationError(
            "Your reservation has expired or changed: "
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

    # Keep seats AVAILABLE but temporarily held.
    #
    # Payment success will convert them to BOOKED.
    ShowSeat.objects.filter(
        id__in=[
            seat.id
            for seat in show_seats
        ],
        show=show,
    ).update(
        status=ShowSeat.STATUS_AVAILABLE,
        held_until=expires_at,
        held_by=user,
    )

    return booking


# -------------------------------------------------
# REACQUIRE BOOKING SEATS FOR PAYMENT RETRY
# -------------------------------------------------

@transaction.atomic
def reacquire_booking_seats_for_retry(
    *,
    booking,
):
    """
    Re-acquire all seats belonging to a pending booking
    after a previous payment attempt failed.

    The original booking/payment window must still be active.
    """

    booking = (
        Booking.objects
        .select_for_update()
        .get(pk=booking.pk)
    )

    if booking.status != Booking.STATUS_PENDING:
        raise ValidationError(
            "Only pending bookings can be retried."
        )

    now = timezone.now()

    if (
        booking.expires_at
        and booking.expires_at <= now
    ):
        expire_pending_booking(
            booking
        )

        raise ValidationError(
            "This booking payment window has expired."
        )

    booking_seat_ids = list(
        booking.booking_seats.values_list(
            "show_seat_id",
            flat=True,
        )
    )

    if not booking_seat_ids:
        raise ValidationError(
            "This booking has no seats."
        )

    show_seats = list(
        ShowSeat.objects
        .select_for_update()
        .select_related("seat")
        .filter(
            id__in=booking_seat_ids,
            show=booking.show,
        )
        .order_by(
            "seat__row",
            "seat__number",
        )
    )

    if len(show_seats) != len(
        booking_seat_ids
    ):
        raise ValidationError(
            "One or more booking seats no longer exist."
        )

    unavailable = []

    for show_seat in show_seats:
        if (
            show_seat.status
            == ShowSeat.STATUS_BOOKED
        ):
            unavailable.append(show_seat)
            continue

        if (
            show_seat.held_until
            and show_seat.held_until > now
            and show_seat.held_by_id != booking.user_id
        ):
            unavailable.append(show_seat)

    if unavailable:
        seat_names = ", ".join(
            f"{seat.seat.row}{seat.seat.number}"
            for seat in unavailable
        )

        raise ValidationError(
            "These seats are no longer available: "
            f"{seat_names}"
        )

    ShowSeat.objects.filter(
        id__in=booking_seat_ids,
        show=booking.show,
    ).update(
        status=ShowSeat.STATUS_AVAILABLE,
        held_until=booking.expires_at,
        held_by=booking.user,
    )

    return booking


# -------------------------------------------------
# FINALIZE BOOKING SEATS AFTER SUCCESSFUL PAYMENT
# -------------------------------------------------

@transaction.atomic
def finalize_booking_seats(
    *,
    booking,
):
    """
    Convert the seats belonging to a successfully paid
    booking from temporary holds into permanent BOOKED
    seats.

    This function is concurrency-safe.
    """

    booking = (
        Booking.objects
        .select_for_update()
        .get(pk=booking.pk)
    )

    if booking.status != Booking.STATUS_CONFIRMED:
        raise ValidationError(
            "Only confirmed bookings can finalize seats."
        )

    booking_seat_ids = list(
        booking.booking_seats.values_list(
            "show_seat_id",
            flat=True,
        )
    )

    if not booking_seat_ids:
        raise ValidationError(
            "Confirmed booking has no seats."
        )

    show_seats = list(
        ShowSeat.objects
        .select_for_update()
        .filter(
            id__in=booking_seat_ids,
            show=booking.show,
        )
    )

    if len(show_seats) != len(
        booking_seat_ids
    ):
        raise ValidationError(
            "One or more booking seats no longer exist."
        )

    for show_seat in show_seats:
        if (
            show_seat.status
            == ShowSeat.STATUS_BOOKED
        ):
            # Already finalized. This makes the operation
            # safely idempotent.
            continue

        if (
            show_seat.held_by_id
            not in {
                None,
                booking.user_id,
            }
        ):
            raise ValidationError(
                "One or more seats are held by another user."
            )

        show_seat.status = ShowSeat.STATUS_BOOKED
        show_seat.held_until = None
        show_seat.held_by = None

        show_seat.save(
            update_fields=[
                "status",
                "held_until",
                "held_by",
            ]
        )

    return booking


# -------------------------------------------------
# RELEASE BOOKING SEATS
# -------------------------------------------------

@transaction.atomic
def release_booking_seats(
    booking,
):
    """
    Safely release seats belonging to a pending,
    expired, failed, or cancelled booking.

    Confirmed bookings are never released.
    """

    booking = (
        Booking.objects
        .select_for_update()
        .get(pk=booking.pk)
    )

    if booking.status == Booking.STATUS_CONFIRMED:
        return booking

    show_seat_ids = list(
        booking.booking_seats.values_list(
            "show_seat_id",
            flat=True,
        )
    )

    if show_seat_ids:
        show_seats = list(
            ShowSeat.objects
            .select_for_update()
            .filter(
                id__in=show_seat_ids,
                show=booking.show,
            )
        )

        for show_seat in show_seats:
            show_seat.status = ShowSeat.STATUS_AVAILABLE
            show_seat.held_until = None
            show_seat.held_by = None

            show_seat.save(
                update_fields=[
                    "status",
                    "held_until",
                    "held_by",
                ]
            )

    return booking


# -------------------------------------------------
# EXPIRE PENDING BOOKING
# -------------------------------------------------

@transaction.atomic
def expire_pending_booking(
    booking,
):
    """
    Mark an expired pending booking as EXPIRED
    and release its seats.
    """

    booking = (
        Booking.objects
        .select_for_update()
        .get(pk=booking.pk)
    )

    if booking.status != Booking.STATUS_PENDING:
        return booking

    now = timezone.now()

    if (
        booking.expires_at
        and booking.expires_at > now
    ):
        return booking

    booking.status = Booking.STATUS_EXPIRED

    booking.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    release_booking_seats(
        booking
    )

    return booking