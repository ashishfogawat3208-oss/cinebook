import io

import qrcode

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import (
    ParagraphStyle,
    getSampleStyleSheet,
)
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from bookings.models import Booking, Payment, Ticket


def _format_seat_names(booking):
    seats = (
        booking.booking_seats
        .select_related("show_seat__seat")
        .order_by(
            "show_seat__seat__row",
            "show_seat__seat__number",
        )
    )

    return [
        f"{seat.show_seat.seat.row}"
        f"{seat.show_seat.seat.number}"
        for seat in seats
    ]


def _create_qr_image(payload):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=4,
    )

    qr.add_data(payload)
    qr.make(fit=True)

    image = qr.make_image(
        fill_color="black",
        back_color="white",
    )

    buffer = io.BytesIO()

    image.save(
        buffer,
        format="PNG",
    )

    buffer.seek(0)

    return Image(
        buffer,
        width=42 * mm,
        height=42 * mm,
    )


def _get_frontend_base_url():
    return getattr(
        settings,
        "FRONTEND_BASE_URL",
        "http://localhost:3000",
    ).rstrip("/")


@transaction.atomic
def generate_ticket_for_booking(booking):
    """
    Generate the PDF ticket for a confirmed booking.

    The booking itself is locked with SELECT FOR UPDATE.
    Payment is deliberately fetched separately because the
    reverse payment relation can be nullable, and PostgreSQL
    does not allow FOR UPDATE on the nullable side of an
    outer join.
    """

    # Lock only the Booking and non-nullable forward
    # relationships.
    booking = (
        Booking.objects
        .select_for_update()
        .select_related(
            "user",
            "show",
            "show__movie",
            "show__screen",
            "show__screen__theater",
            "show__screen__theater__city",
        )
        .prefetch_related(
            "booking_seats__show_seat__seat",
        )
        .get(
            pk=booking.pk,
        )
    )

    if booking.status != Booking.STATUS_CONFIRMED:
        raise ValueError(
            "A ticket can only be generated "
            "for a confirmed booking."
        )

    # Fetch payment separately.
    # Do NOT include the reverse payment relation in the
    # select_for_update() query above.
    payment = (
        Payment.objects
        .filter(
            booking=booking,
            status=Payment.STATUS_SUCCESS,
        )
        .order_by("-paid_at", "-id")
        .first()
    )

    payment_reference = (
        payment.payment_reference
        if payment is not None
        else "N/A"
    )

    # Reuse an existing ticket if one already exists.
    ticket, _ = Ticket.objects.get_or_create(
        booking=booking,
    )

    seat_names = _format_seat_names(
        booking,
    )

    show = booking.show

    verification_url = (
        f"{_get_frontend_base_url()}"
        f"/ticket-verification/"
        f"{ticket.verification_code}"
    )

    qr_image = _create_qr_image(
        verification_url,
    )

    buffer = io.BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=(
            f"Movie Ticket - "
            f"{show.movie.title}"
        ),
        author="Movie Booking",
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TicketTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=22,
        leading=26,
        spaceAfter=5 * mm,
    )

    subtitle_style = ParagraphStyle(
        "TicketSubtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=10,
        textColor=colors.HexColor(
            "#666666",
        ),
        spaceAfter=8 * mm,
    )

    label_style = ParagraphStyle(
        "TicketLabel",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor(
            "#777777",
        ),
    )

    value_style = ParagraphStyle(
        "TicketValue",
        parent=styles["Normal"],
        fontSize=10,
        leading=13,
        textColor=colors.HexColor(
            "#111111",
        ),
    )

    small_style = ParagraphStyle(
        "TicketSmall",
        parent=styles["Normal"],
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor(
            "#666666",
        ),
    )

    heading_style = ParagraphStyle(
        "TicketHeading",
        parent=styles["Heading2"],
        fontSize=12,
        leading=15,
        spaceAfter=3 * mm,
        textColor=colors.HexColor(
            "#222222",
        ),
    )

    story = []

    story.append(
        Paragraph(
            "MOVIE BOOKING",
            title_style,
        )
    )

    story.append(
        Paragraph(
            "CONFIRMED MOVIE TICKET",
            subtitle_style,
        )
    )

    story.append(
        Paragraph(
            show.movie.title,
            ParagraphStyle(
                "MovieTitle",
                parent=styles["Heading1"],
                alignment=TA_CENTER,
                fontSize=18,
                leading=22,
                textColor=colors.HexColor(
                    "#111111",
                ),
                spaceAfter=8 * mm,
            ),
        )
    )

    movie_info = [
        [
            Paragraph(
                "THEATER",
                label_style,
            ),
            Paragraph(
                "SCREEN",
                label_style,
            ),
        ],
        [
            Paragraph(
                show.screen.theater.name,
                value_style,
            ),
            Paragraph(
                show.screen.name,
                value_style,
            ),
        ],
        [
            Paragraph(
                "CITY",
                label_style,
            ),
            Paragraph(
                "SHOW TIME",
                label_style,
            ),
        ],
        [
            Paragraph(
                show.screen.theater.city.name,
                value_style,
            ),
            Paragraph(
                timezone.localtime(
                    show.start_time,
                ).strftime(
                    "%d %b %Y, %I:%M %p",
                ),
                value_style,
            ),
        ],
    ]

    movie_table = Table(
        movie_info,
        colWidths=[
            82 * mm,
            82 * mm,
        ],
    )

    movie_table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    colors.HexColor(
                        "#F7F7F7",
                    ),
                ),
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor(
                        "#DDDDDD",
                    ),
                ),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.25,
                    colors.HexColor(
                        "#E5E5E5",
                    ),
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    7,
                ),
            ]
        )
    )

    story.append(movie_table)
    story.append(
        Spacer(
            1,
            8 * mm,
        )
    )

    story.append(
        Paragraph(
            "BOOKING DETAILS",
            heading_style,
        )
    )

    booking_info = [
        [
            Paragraph(
                "SEATS",
                label_style,
            ),
            Paragraph(
                ", ".join(seat_names)
                if seat_names
                else "N/A",
                value_style,
            ),
        ],
        [
            Paragraph(
                "TOTAL AMOUNT",
                label_style,
            ),
            Paragraph(
                f"₹{booking.total_amount}",
                value_style,
            ),
        ],
        [
            Paragraph(
                "BOOKING ID",
                label_style,
            ),
            Paragraph(
                str(booking.booking_id),
                small_style,
            ),
        ],
        [
            Paragraph(
                "PAYMENT REFERENCE",
                label_style,
            ),
            Paragraph(
                payment_reference,
                small_style,
            ),
        ],
        [
            Paragraph(
                "TICKET NUMBER",
                label_style,
            ),
            Paragraph(
                str(ticket.ticket_number),
                small_style,
            ),
        ],
    ]

    booking_table = Table(
        booking_info,
        colWidths=[
            48 * mm,
            116 * mm,
        ],
    )

    booking_table.setStyle(
        TableStyle(
            [
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor(
                        "#DDDDDD",
                    ),
                ),
                (
                    "INNERGRID",
                    (0, 0),
                    (-1, -1),
                    0.25,
                    colors.HexColor(
                        "#EEEEEE",
                    ),
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "BACKGROUND",
                    (0, 0),
                    (0, -1),
                    colors.HexColor(
                        "#F7F7F7",
                    ),
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
            ]
        )
    )

    story.append(booking_table)
    story.append(
        Spacer(
            1,
            8 * mm,
        )
    )

    qr_section = Table(
        [
            [
                qr_image,
                Paragraph(
                    "<b>SCAN TO VERIFY</b><br/><br/>"
                    "Scan this QR code to open the "
                    "ticket verification page.<br/><br/>"
                    "Verification code:<br/>"
                    f"{ticket.verification_code}",
                    small_style,
                ),
            ]
        ],
        colWidths=[
            55 * mm,
            109 * mm,
        ],
    )

    qr_section.setStyle(
        TableStyle(
            [
                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.HexColor(
                        "#DDDDDD",
                    ),
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "ALIGN",
                    (0, 0),
                    (0, 0),
                    "CENTER",
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
            ]
        )
    )

    story.append(qr_section)
    story.append(
        Spacer(
            1,
            8 * mm,
        )
    )

    story.append(
        Paragraph(
            "Please arrive at the theater before "
            "the show starts. Keep this ticket "
            "available on your phone or as a printed "
            "copy. Ticket validity is subject to "
            "the theater's terms and conditions.",
            small_style,
        )
    )

    document.build(story)

    buffer.seek(0)

    filename = (
        f"ticket-"
        f"{booking.booking_id}.pdf"
    )

    ticket.pdf.save(
        filename,
        ContentFile(
            buffer.read(),
        ),
        save=False,
    )

    ticket.generated_at = timezone.now()

    ticket.save(
        update_fields=[
            "pdf",
            "generated_at",
        ]
    )

    return ticket