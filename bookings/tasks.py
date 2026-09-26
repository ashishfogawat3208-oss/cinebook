from celery import shared_task
from django.db import transaction
from django.utils import timezone

from bookings.models import Booking, ShowSeat
from bookings.services.booking import release_booking_seats
from bookings.services.email import send_ticket_email
from bookings.services.ticket import generate_ticket_for_booking


@shared_task
def celery_health_check():
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
def generate_ticket_task(self, booking_id):
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
        .get(booking_id=booking_id)
    )

    if booking.status != Booking.STATUS_CONFIRMED:
        return {
            "status": "skipped",
            "reason": "Booking is not confirmed.",
            "booking_id": str(booking_id),
        }

    ticket = generate_ticket_for_booking(booking)
    email_response = send_ticket_email(booking)

    return {
        "status": "success",
        "booking_id": str(booking_id),
        "ticket_number": str(ticket.ticket_number),
        "pdf": ticket.pdf.name if ticket.pdf else None,
        "email_response": str(email_response),
    }


@shared_task
def release_expired_seat_holds():
    now = timezone.now()
    expired_ids = list(
        ShowSeat.objects.filter(
            status=ShowSeat.STATUS_AVAILABLE,
            held_until__isnull=False,
            held_until__lte=now,
        ).values_list("id", flat=True)
    )

    released_count = 0

    for show_seat_id in expired_ids:
        with transaction.atomic():
            try:
                show_seat = (
                    ShowSeat.objects
                    .select_for_update()
                    .get(pk=show_seat_id)
                )
            except ShowSeat.DoesNotExist:
                continue

            if show_seat.status != ShowSeat.STATUS_AVAILABLE:
                continue

            if not show_seat.held_until or show_seat.held_until > now:
                continue

            show_seat.held_until = None
            show_seat.held_by = None
            show_seat.save(
                update_fields=[
                    "held_until",
                    "held_by",
                ]
            )
            released_count += 1

    return {
        "status": "completed",
        "released_count": released_count,
    }


@shared_task
def expire_pending_bookings():
    now = timezone.now()
    booking_ids = list(
        Booking.objects.filter(
            status=Booking.STATUS_PENDING,
            expires_at__isnull=False,
            expires_at__lte=now,
        ).values_list("id", flat=True)
    )

    expired_count = 0

    for booking_pk in booking_ids:
        with transaction.atomic():
            try:
                booking = (
                    Booking.objects
                    .select_for_update()
                    .get(pk=booking_pk)
                )
            except Booking.DoesNotExist:
                continue

            if booking.status != Booking.STATUS_PENDING:
                continue

            if booking.expires_at is None or booking.expires_at > now:
                continue

            booking.status = Booking.STATUS_EXPIRED
            booking.save(update_fields=["status", "updated_at"])
            release_booking_seats(booking)
            expired_count += 1

    return {
        "status": "completed",
        "expired_count": expired_count,
    }
