from django.http import FileResponse
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response

from bookings.models import (
    Booking,
    Ticket,
)

from bookings.ticket_serializers import (
    TicketSerializer,
)


class TicketDetailView(
    generics.GenericAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
        booking_id,
    ):
        ticket = get_object_or_404(
            Ticket.objects.select_related(
                "booking",
                "booking__show",
                "booking__show__movie",
            ),
            booking__booking_id=booking_id,
            booking__user=request.user,
        )

        serializer = TicketSerializer(
            ticket
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class TicketDownloadView(
    generics.GenericAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
        booking_id,
    ):
        ticket = get_object_or_404(
            Ticket.objects.select_related(
                "booking",
            ),
            booking__booking_id=booking_id,
            booking__user=request.user,
        )

        if not ticket.pdf:
            return Response(
                {
                    "detail":
                        "Ticket PDF has not "
                        "been generated yet."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return FileResponse(
            ticket.pdf.open("rb"),
            as_attachment=True,
            filename=(
                f"ticket-{booking_id}.pdf"
            ),
            content_type="application/pdf",
        )


class TicketVerifyView(
    generics.GenericAPIView
):
    permission_classes = [
        AllowAny
    ]

    def get(
        self,
        request,
        verification_code,
    ):
        ticket = get_object_or_404(
            Ticket.objects.select_related(
                "booking",
                "booking__show",
                "booking__show__movie",
                "booking__show__screen",
                "booking__show__screen__theater",
                "booking__show__screen__theater__city",
            ),
            verification_code=verification_code,
        )

        booking = ticket.booking
        show = booking.show

        seats = list(
            booking.booking_seats
            .select_related(
                "show_seat__seat"
            )
            .all()
        )

        seat_names = [
            (
                f"{seat.show_seat.seat.row}"
                f"{seat.show_seat.seat.number}"
            )
            for seat in seats
        ]

        is_valid = (
            booking.status
            == Booking.STATUS_CONFIRMED
        )

        return Response(
            {
                "valid": is_valid,
                "ticket_number": str(
                    ticket.ticket_number
                ),
                "verification_code": str(
                    ticket.verification_code
                ),
                "booking_id": str(
                    booking.booking_id
                ),
                "movie": show.movie.title,
                "theater":
                    show.screen.theater.name,
                "city":
                    show.screen.theater.city.name,
                "screen":
                    show.screen.name,
                "show_time":
                    show.start_time,
                "seats": seat_names,
                "total_amount":
                    str(booking.total_amount),
            },
            status=status.HTTP_200_OK,
        )