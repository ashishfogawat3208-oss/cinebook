from django.core.exceptions import ValidationError

from django.core.mail import EmailMessage, get_connection

from django.db import transaction

from django.shortcuts import get_object_or_404

from django.utils import timezone

import os

from rest_framework import generics, status

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from bookings.models import (
    Booking,
    Payment,
    ShowSeat,
)

from bookings.serializers import (
    BookingSerializer,
    CreateBookingSerializer,
    ShowSeatSerializer,
)

from bookings.services.booking import (
    create_booking,
)

from bookings.services.payment import (
    process_mock_payment,
)

from bookings.services.ticket import (
    generate_ticket_for_booking,
)

from theaters.models import Show


class ShowSeatsView(
    generics.GenericAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
        show_id,
    ):
        show = get_object_or_404(
            Show.objects.select_related(
                "movie",
                "screen",
                "screen__theater",
            ),
            id=show_id,
        )

        show_seats = (
            ShowSeat.objects
            .select_related("seat")
            .filter(show=show)
            .order_by(
                "seat__row",
                "seat__number",
            )
        )

        serializer = ShowSeatSerializer(
            show_seats,
            many=True,
        )

        return Response(
            {
                "show_id": show.id,
                "movie_id": show.movie_id,
                "start_time": show.start_time,
                "ticket_price": show.ticket_price,
                "seats": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class CreateBookingView(
    generics.CreateAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = (
        CreateBookingSerializer
    )

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        show_id = (
            serializer.validated_data[
                "show_id"
            ]
        )

        show_seat_ids = (
            serializer.validated_data[
                "show_seat_ids"
            ]
        )

        show = get_object_or_404(
            Show.objects.select_related(
                "movie",
                "screen",
                "screen__theater",
            ),
            id=show_id,
        )

        try:
            booking = create_booking(
                user=request.user,
                show=show,
                show_seat_ids=show_seat_ids,
            )

        except ValidationError as exc:
            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking = (
            Booking.objects
            .select_related(
                "show",
                "show__movie",
                "show__screen",
                "show__screen__theater",
                "show__screen__theater__city",
                "payment",
                "ticket",
            )
            .prefetch_related(
                "booking_seats__show_seat__seat"
            )
            .get(pk=booking.pk)
        )

        response_serializer = (
            BookingSerializer(
                booking,
                context={
                    "request": request
                },
            )
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


class BookingListView(
    generics.ListAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = BookingSerializer

    def get_queryset(self):
        queryset = (
            Booking.objects
            .filter(
                user=self.request.user
            )
            .select_related(
                "show",
                "show__movie",
                "show__screen",
                "show__screen__theater",
                "show__screen__theater__city",
                "payment",
                "ticket",
            )
            .prefetch_related(
                "booking_seats__show_seat__seat"
            )
        )

        category = (
            self.request.query_params.get(
                "category"
            )
        )

        status_filter = (
            self.request.query_params.get(
                "status"
            )
        )

        movie_id = (
            self.request.query_params.get(
                "movie"
            )
        )

        if status_filter:
            queryset = queryset.filter(
                status=status_filter.upper()
            )

        if movie_id:
            queryset = queryset.filter(
                show__movie_id=movie_id
            )

        now = timezone.now()

        if category == "upcoming":
            queryset = queryset.filter(
                status=Booking.STATUS_CONFIRMED,
                show__start_time__gte=now,
            )

        elif category == "completed":
            queryset = queryset.filter(
                status=Booking.STATUS_CONFIRMED,
                show__start_time__lt=now,
            )

        elif category == "pending":
            queryset = queryset.filter(
                status=Booking.STATUS_PENDING,
                expires_at__gt=now,
            )

        elif category == "failed":
            queryset = queryset.filter(
                status=Booking.STATUS_FAILED
            )

        elif category == "expired":
            queryset = queryset.filter(
                status=Booking.STATUS_EXPIRED
            )

        elif category == "cancelled":
            queryset = queryset.filter(
                status=Booking.STATUS_CANCELLED
            )

        return queryset.order_by(
            "-created_at"
        )


class BookingDetailView(
    generics.RetrieveAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    serializer_class = BookingSerializer

    lookup_field = "booking_id"

    def get_queryset(self):
        return (
            Booking.objects
            .filter(
                user=self.request.user
            )
            .select_related(
                "show",
                "show__movie",
                "show__screen",
                "show__screen__theater",
                "show__screen__theater__city",
                "payment",
                "ticket",
            )
            .prefetch_related(
                "booking_seats__show_seat__seat"
            )
        )


class MockPaymentView(
    generics.GenericAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):
        booking_id = request.data.get(
            "booking_id"
        )

        success = request.data.get(
            "success",
            True,
        )

        if isinstance(
            success,
            str,
        ):
            success = (
                success.lower()
                in {
                    "true",
                    "1",
                    "yes",
                    "success",
                }
            )

        if booking_id is None:
            return Response(
                {
                    "detail":
                        "booking_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking = get_object_or_404(
            Booking,
            booking_id=booking_id,
            user=request.user,
        )

        try:
            payment = process_mock_payment(
                booking=booking,
                success=success,
            )

        except ValidationError as exc:
            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            payment.status
            == Payment.STATUS_SUCCESS
        ):

            booking_id_for_ticket = (
                booking.booking_id
            )

            def generate_ticket_after_commit():
                try:
                    booking_for_ticket = (
                        Booking.objects
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
                            booking_id=booking_id_for_ticket
                        )
                    )

                    ticket = generate_ticket_for_booking(
                        booking_for_ticket
                    )

                    recipient = (
                        booking_for_ticket.user.email
                        or ""
                    ).strip()

                    if not recipient:
                        print(
                            "Ticket email skipped: user has no email address."
                        )
                        return

                    smtp_password = os.getenv(
                        "EMAIL_HOST_PASSWORD",
                        "",
                    )

                    if not smtp_password:
                        print(
                            "Ticket email skipped: EMAIL_HOST_PASSWORD is not configured."
                        )
                        return

                    use_tls = os.getenv(
                        "EMAIL_USE_TLS",
                        "True",
                    ).lower() in {
                        "true",
                        "1",
                        "yes",
                    }

                    use_ssl = os.getenv(
                        "EMAIL_USE_SSL",
                        "False",
                    ).lower() in {
                        "true",
                        "1",
                        "yes",
                    }

                    connection = get_connection(
                        backend=(
                            "django.core.mail.backends.smtp.EmailBackend"
                        ),
                        host=os.getenv(
                            "EMAIL_HOST",
                            "smtp.gmail.com",
                        ),
                        port=int(
                            os.getenv(
                                "EMAIL_PORT",
                                "587",
                            )
                        ),
                        username=os.getenv(
                            "EMAIL_HOST_USER",
                            "",
                        ),
                        password=smtp_password,
                        use_tls=use_tls,
                        use_ssl=use_ssl,
                        fail_silently=False,
                    )

                    show = booking_for_ticket.show

                    seat_names = [
                        f"{seat.show_seat.seat.row}"
                        f"{seat.show_seat.seat.number}"
                        for seat in booking_for_ticket.booking_seats.all()
                    ]

                    show_time = timezone.localtime(
                        show.start_time
                    ).strftime(
                        "%d %b %Y, %I:%M %p"
                    )

                    from_email = os.getenv(
                        "DEFAULT_FROM_EMAIL",
                        os.getenv(
                            "EMAIL_HOST_USER",
                            "CineBook",
                        ),
                    )

                    email = EmailMessage(
                        subject=(
                            "CineBook - Your Movie Ticket is Confirmed"
                        ),
                        body=(
                            f"Hi {booking_for_ticket.user.first_name or booking_for_ticket.user.username},\n\n"
                            "Your CineBook booking has been confirmed successfully.\n\n"
                            f"Movie: {show.movie.title}\n"
                            f"Theater: {show.screen.theater.name}\n"
                            f"City: {show.screen.theater.city.name}\n"
                            f"Screen: {show.screen.name}\n"
                            f"Show: {show_time}\n"
                            f"Seats: {', '.join(seat_names) or 'N/A'}\n"
                            f"Amount: Rs. {booking_for_ticket.total_amount}\n"
                            f"Booking ID: {booking_for_ticket.booking_id}\n"
                            f"Payment Reference: {payment.payment_reference}\n"
                            f"Ticket Number: {ticket.ticket_number}\n\n"
                            "Your PDF ticket is attached to this email.\n\n"
                            "Please keep this ticket available when you visit the theater.\n\n"
                            "Thanks,\n"
                            "CineBook Team"
                        ),
                        from_email=from_email,
                        to=[recipient],
                        connection=connection,
                    )

                    with ticket.pdf.open("rb") as pdf_file:
                        email.attach(
                            f"ticket-{booking_for_ticket.booking_id}.pdf",
                            pdf_file.read(),
                            "application/pdf",
                        )

                    email.send(fail_silently=False)

                    print(
                        "Ticket email sent successfully to:",
                        recipient,
                    )

                except Exception as exc:
                    print(
                        "Ticket email/generation failed:",
                        exc,
                    )

            transaction.on_commit(
                generate_ticket_after_commit
            )

        updated_booking = (
            Booking.objects.get(
                pk=booking.pk
            )
        )

        return Response(
            {
                "booking_id": str(
                    booking.booking_id
                ),
                "payment_reference":
                    payment.payment_reference,
                "payment_status":
                    payment.status,
                "booking_status":
                    updated_booking.status,
                "amount": str(
                    payment.amount
                ),
            },
            status=status.HTTP_200_OK,
        )