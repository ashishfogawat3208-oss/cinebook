from pathlib import Path

from celery import shared_task
from django.core.mail import EmailMessage
from django.shortcuts import get_object_or_404

from bookings.models import Booking


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
    max_retries=5,
)
def send_ticket_email_task(
    self,
    previous_result,
    booking_id,
):
    """
    Send the generated ticket PDF by email.

    This task runs after generate_ticket_task in the
    Celery chain.
    """

    booking = (
        Booking.objects
        .select_related(
            "user",
            "show",
            "show__movie",
            "show__screen",
            "show__screen__theater",
        )
        .get(
            booking_id=booking_id
        )
    )

    if booking.status != Booking.STATUS_CONFIRMED:
        return {
            "status": "skipped",
            "reason":
                "Booking is not confirmed.",
            "booking_id":
                str(booking_id),
        }

    try:
        ticket = booking.ticket
    except Exception:
        raise RuntimeError(
            "Ticket does not exist yet."
        )

    if not ticket.pdf:
        raise RuntimeError(
            "Ticket PDF has not been generated yet."
        )

    if not booking.user.email:
        return {
            "status": "skipped",
            "reason":
                "User does not have an email address.",
            "booking_id":
                str(booking_id),
        }

    pdf_path = Path(
        ticket.pdf.path
    )

    if not pdf_path.exists():
        raise RuntimeError(
            "Ticket PDF file does not exist."
        )

    movie_title = booking.show.movie.title

    subject = (
        f"Your movie ticket — "
        f"{movie_title}"
    )

    body = f"""
Hi {booking.user.first_name or booking.user.username},

Your movie booking is confirmed.

Movie: {movie_title}
Booking ID: {booking.booking_id}
Ticket Number: {ticket.ticket_number}

Your ticket PDF is attached to this email.

Thank you for using Movie Booking.
""".strip()

    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=None,
        to=[
            booking.user.email
        ],
    )

    email.attach_file(
        str(pdf_path)
    )

    email.send(
        fail_silently=False
    )

    return {
        "status": "success",
        "booking_id":
            str(booking_id),
        "email":
            booking.user.email,
        "ticket_number":
            str(ticket.ticket_number),
        "previous_result":
            previous_result,
    }