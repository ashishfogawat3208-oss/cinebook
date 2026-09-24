from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from bookings.models import (
    Booking,
    Payment,
    ShowSeat,
)

from bookings.notification_tasks import (
    queue_ticket_workflow,
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
            transaction.on_commit(
                lambda: queue_ticket_workflow(
                    str(
                        booking.booking_id
                    )
                )
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