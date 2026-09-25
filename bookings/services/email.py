import base64
import os

import resend


def send_ticket_email(booking):
    """
    Send the confirmed booking ticket PDF through Resend.

    Email failures are intentionally caught by the caller so that
    a successful payment is never converted into a failed payment
    response just because email delivery has a problem.
    """

    api_key = os.getenv("RESEND_API_KEY")

    if not api_key:
        raise RuntimeError(
            "RESEND_API_KEY is not configured."
        )

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

    pdf_base64 = base64.b64encode(
        pdf_bytes
    ).decode("utf-8")

    resend.api_key = api_key

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

    params = {
        "from": "CineBook <onboarding@resend.dev>",
        "to": [recipient_email],
        "subject": (
            f"CineBook Ticket Confirmed - "
            f"{movie_title}"
        ),
        "html": f"""
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
        """,
        "attachments": [
            {
                "content": pdf_base64,
                "filename": (
                    f"CineBook-Ticket-{ticket_number}.pdf"
                ),
                "content_type": "application/pdf",
            }
        ],
    }

    response = resend.Emails.send(
        params
    )

    return response