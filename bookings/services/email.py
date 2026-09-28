import base64
import json
import os
from email.message import EmailMessage as PythonEmailMessage

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"


def _get_gmail_credentials():
    """
    Load Gmail OAuth credentials.

    On Render:
        GMAIL_TOKEN_JSON_B64 contains the base64-encoded token.json.

    Locally:
        If GMAIL_TOKEN_JSON_B64 is not set, token.json is used.
    """

    encoded_token = os.getenv("GMAIL_TOKEN_JSON_B64")

    if encoded_token:
        try:
            token_json = base64.b64decode(
                encoded_token
            ).decode("utf-8")

            token_data = json.loads(token_json)

        except Exception as exc:
            raise RuntimeError(
                "GMAIL_TOKEN_JSON_B64 is invalid."
            ) from exc

    else:
        token_path = "token.json"

        if not os.path.exists(token_path):
            raise RuntimeError(
                "Gmail OAuth token is not configured. "
                "token.json is missing."
            )

        try:
            with open(token_path, "r") as token_file:
                token_data = json.load(token_file)

        except Exception as exc:
            raise RuntimeError(
                "Could not read token.json."
            ) from exc

    credentials = Credentials.from_authorized_user_info(
        token_data,
        [GMAIL_SEND_SCOPE],
    )

    return credentials


def send_ticket_email(booking):
    """
    Send the confirmed booking ticket PDF through
    the Gmail API over HTTPS.

    Email failures are raised so the Celery task
    can retry them.
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
        os.getenv(
            "EMAIL_HOST_USER",
            "CineBook",
        ),
    )

    email = PythonEmailMessage()

    email["Subject"] = subject
    email["From"] = from_email
    email["To"] = recipient_email

    email.set_content(
        "Your CineBook ticket is attached."
    )

    email.add_alternative(
        html_message,
        subtype="html",
    )

    email.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=(
            f"CineBook-Ticket-{ticket_number}.pdf"
        ),
    )

    raw_message = base64.urlsafe_b64encode(
        email.as_bytes()
    ).decode("utf-8")

    credentials = _get_gmail_credentials()

    gmail_service = build(
        "gmail",
        "v1",
        credentials=credentials,
        cache_discovery=False,
    )

    result = (
        gmail_service.users()
        .messages()
        .send(
            userId="me",
            body={
                "raw": raw_message,
            },
        )
        .execute()
    )

    return result