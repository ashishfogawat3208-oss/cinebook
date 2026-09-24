import uuid

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from bookings.models import (
    Booking,
    Payment,
)
from bookings.services.booking import (
    release_booking_seats,
)


@transaction.atomic
def process_mock_payment(
    *,
    booking,
    success=True,
):
    """
    Process a development/mock payment.

    The booking row is locked for the complete payment
    transaction so the same pending booking cannot be
    processed concurrently.
    """

    booking = (
        Booking.objects
        .select_for_update()
        .select_related(
            "show",
            "show__movie",
            "show__screen",
            "show__screen__theater",
        )
        .get(pk=booking.pk)
    )

    if booking.status != Booking.STATUS_PENDING:
        raise ValidationError(
            "This booking is not awaiting payment."
        )

    now = timezone.now()

    if (
        booking.expires_at is not None
        and booking.expires_at <= now
    ):
        booking.status = (
            Booking.STATUS_EXPIRED
        )

        booking.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        release_booking_seats(booking)

        raise ValidationError(
            "This booking has expired. "
            "Please create a new booking."
        )

    if Payment.objects.filter(
        booking=booking
    ).exists():
        raise ValidationError(
            "Payment already exists for this booking."
        )

    if not success:
        booking.status = (
            Booking.STATUS_FAILED
        )

        booking.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        payment = Payment.objects.create(
            booking=booking,
            payment_reference=(
                "MOCK-FAILED-"
                f"{uuid.uuid4().hex[:12].upper()}"
            ),
            amount=booking.total_amount,
            status=Payment.STATUS_FAILED,
        )

        release_booking_seats(booking)

        return payment

    payment_reference = (
        "MOCK-"
        f"{uuid.uuid4().hex[:16].upper()}"
    )

    payment = Payment.objects.create(
        booking=booking,
        payment_reference=payment_reference,
        amount=booking.total_amount,
        status=Payment.STATUS_SUCCESS,
        paid_at=now,
    )

    booking.status = (
        Booking.STATUS_CONFIRMED
    )

    booking.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    return payment