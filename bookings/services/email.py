import os

from django.core.mail import EmailMessage


def send_ticket_email(booking):
    """
    Send the confirmed booking ticket PDF through Gmail SMTP.

    Email failures are raised so the Celery task can retry them.
    """

    ticket = getattr(
        booking,
        "ticket",
        None,
    )

    if not ticket:
        raise RuntimeError(
            "Ticket does not exist for this booking."
        )

    if not ticket.pdf:
        raise RuntimeError(
            "Ticket PDF does not exist for this booking."
        )

    user = booking.user

    recipient_email = getattr(
        user,
        "email",
        None,
    )

    if not recipient_email:
        raise RuntimeError(
            "Booking user does not have an email address."
        )

    ticket.pdf.open("rb")

    try:
        pdf_bytes = ticket.pdf.read()
    finally:
        ticket.pdf.close()

    movie = booking.show.movie
    movie_title = movie.title

    booking_id = str(
        booking.booking_id
    )

    ticket_number = str(
        ticket.ticket_number
    )

    amount = str(
        booking.total_amount
    )

    show_time = booking.show.start_time

    subject = (
        f"CineBook Ticket Confirmed - "
        f"{movie_title}"
    )

    html_message = f"""
    <div style="
        font-family: Arial, sans-serif;
        max-width: 650px;
        margin: 0 auto;
        padding: 24px;
        color: #222;
    ">

        <h1 style="
            margin-bottom: 8px;
        ">
            🎬 CineBook
        </h1>

        <h2>
            Booking Confirmed
        </h2>

        <p>
            Hi {user.get_username()},
        </p>

        <p>
            Your movie booking has been
            successfully confirmed.
        </p>

        <div style="
            background: #f5f5f5;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        ">

            <p>
                <strong>Movie:</strong>
                {movie_title}
            </p>

            <p>
                <strong>Show:</strong>
                {show_time}
            </p>

            <p>
                <strong>Booking ID:</strong>
                {booking_id}
            </p>

            <p>
                <strong>Ticket Number:</strong>
                {ticket_number}
            </p>

            <p>
                <strong>Amount Paid:</strong>
                ₹{amount}
            </p>

        </div>

        <p>
            Your ticket PDF is attached to this email.
        </p>

        <p>
            Please keep this email and your ticket
            available when you arrive at the theatre.
        </p>

        <p style="
            margin-top: 30px;
            color: #666;
        ">
            Thank you for booking with CineBook.
        </p>

    </div>
    """

    from_email = os.getenv(
        "DEFAULT_FROM_EMAIL",
        os.getenv("EMAIL_HOST_USER"),
    )

    email = EmailMessage(
        subject=subject,
        body=html_message,
        from_email=from_email,
        to=[recipient_email],
    )

    email.content_subtype = "html"

    email.attach(
        f"CineBook-Ticket-{ticket_number}.pdf",
        pdf_bytes,
        "application/pdf",
    )

    return email.send(
        fail_silently=False
    )