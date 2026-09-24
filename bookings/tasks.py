from celery import shared_task
from django.db import transaction
from django.utils import timezone

from bookings.models import Booking
from bookings.services.booking import (
    release_booking_seats,
)
from bookings.services.ticket import (
    generate_ticket_for_booking,
)


@shared_task
def celery_health_check():
    """
    Simple task used to verify that the Celery worker
    is receiving and executing tasks correctly.
    """

    return {
        "status": "ok",
        "service": "celery",
        "message": "Celery worker is running.",
    }


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
    max_retries=5,
)
def generate_ticket_task(
    self,
    booking_id,
):
    """
    Generate a ticket only for a confirmed booking.
    """

    booking = (
        Booking.objects
        .select_related(
            "user",
            "show",
            "show__movie",
            "show__screen",
            "show__screen__theater",
            "show__screen__theater__city",
        )
        .get(
            booking_id=booking_id
        )
    )

    if (
        booking.status
        != Booking.STATUS_CONFIRMED
    ):
        return {
            "status": "skipped",
            "reason": (
                "Booking is not confirmed."
            ),
            "booking_id": str(
                booking_id
            ),
        }

    ticket = generate_ticket_for_booking(
        booking
    )

    return {
        "status": "success",
        "booking_id": str(
            booking_id
        ),
        "ticket_number": str(
            ticket.ticket_number
        ),
        "pdf": (
            ticket.pdf.name
            if ticket.pdf
            else None
        ),
    }


@shared_task
def expire_pending_bookings():
    """
    Expire pending bookings whose payment window
    has ended and release their seats.
    """

    now = timezone.now()

    booking_ids = list(
        Booking.objects.filter(
            status=Booking.STATUS_PENDING,
            expires_at__isnull=False,
            expires_at__lte=now,
        ).values_list(
            "id",
            flat=True,
        )
    )

    expired_count = 0

    for booking_pk in booking_ids:
        with transaction.atomic():
            booking = (
                Booking.objects
                .select_for_update()
                .get(pk=booking_pk)
            )

            if (
                booking.status
                != Booking.STATUS_PENDING
            ):
                continue

            if (
                booking.expires_at is None
                or booking.expires_at > now
            ):
                continue

            booking.status = (
                Booking.STATUS_EXPIRED
            )

            booking.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

            release_booking_seats(
                booking
            )

            expired_count += 1

    return {
        "status": "completed",
        "expired_count": expired_count,
    }