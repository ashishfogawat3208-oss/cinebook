import hashlib
import hmac
import os

from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from bookings.models import (
    Booking,
    Payment,
    ShowSeat,
    Ticket,
)

from bookings.serializers import (
    BookingSerializer,
    CreateBookingSerializer,
    ShowSeatSerializer,
)

from bookings.services.booking import (
    create_booking,
    release_seat_holds,
    reserve_seats,
)

from bookings.services.payment import (
    create_payment_order,
    mark_payment_failed,
    process_mock_payment,
    verify_payment_signature,
)

from bookings.tasks import generate_ticket_task

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
            .select_related(
                "seat",
                "held_by",
            )
            .filter(
                show=show
            )
            .order_by(
                "seat__row",
                "seat__number",
            )
        )

        serializer = ShowSeatSerializer(
            show_seats,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "show_id": show.id,
                "movie_id": show.movie_id,
                "start_time":
                    show.start_time,
                "ticket_price":
                    show.ticket_price,
                "seats":
                    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ReserveSeatsView(
    generics.GenericAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
        show_id,
    ):
        show = get_object_or_404(
            Show,
            id=show_id,
        )

        show_seat_ids = (
            request.data.get(
                "show_seat_ids",
                [],
            )
        )

        try:
            reserved_seats = reserve_seats(
                user=request.user,
                show=show,
                show_seat_ids=show_seat_ids,
            )

        except ValidationError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ShowSeatSerializer(
            reserved_seats,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "show_id":
                    show.id,
                "seats":
                    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class ReleaseSeatHoldsView(
    generics.GenericAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
        show_id,
    ):
        show = get_object_or_404(
            Show,
            id=show_id,
        )

        show_seat_ids = (
            request.data.get(
                "show_seat_ids"
            )
        )

        try:
            released_count = (
                release_seat_holds(
                    user=request.user,
                    show=show,
                    show_seat_ids=show_seat_ids,
                )
            )

        except ValidationError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "show_id":
                    show.id,
                "released":
                    released_count,
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
                    "detail": str(exc),
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
            .get(
                pk=booking.pk
            )
        )

        response_serializer = (
            BookingSerializer(
                booking,
                context={
                    "request":
                        request,
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


class CreateRazorpayOrderView(
    generics.GenericAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):
        booking_id = (
            request.data.get(
                "booking_id"
            )
        )

        if not booking_id:
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
            order = create_payment_order(
                booking=booking
            )

        except ValidationError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "booking_id":
                    str(
                        booking.booking_id
                    ),
                "order_id":
                    order["order_id"],
                "amount":
                    order["amount"],
                "currency":
                    order["currency"],
                "key_id":
                    order["key_id"],
            },
            status=status.HTTP_200_OK,
        )


class VerifyRazorpayPaymentView(
    generics.GenericAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):
        booking_id = (
            request.data.get(
                "booking_id"
            )
        )

        razorpay_order_id = (
            request.data.get(
                "razorpay_order_id"
            )
        )

        razorpay_payment_id = (
            request.data.get(
                "razorpay_payment_id"
            )
        )

        razorpay_signature = (
            request.data.get(
                "razorpay_signature"
            )
        )

        if not booking_id:
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
            payment = (
                verify_payment_signature(
                    booking=booking,
                    razorpay_order_id=(
                        razorpay_order_id
                    ),
                    razorpay_payment_id=(
                        razorpay_payment_id
                    ),
                    razorpay_signature=(
                        razorpay_signature
                    ),
                )
            )

        except ValidationError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        transaction.on_commit(
            lambda booking_id=booking.booking_id: generate_ticket_task.delay(
                str(booking_id)
            )
        )

        updated_booking = (
            Booking.objects.get(
                pk=booking.pk
            )
        )

        return Response(
            {
                "booking_id":
                    str(
                        booking.booking_id
                    ),
                "payment_reference":
                    payment.payment_reference,
                "razorpay_payment_id":
                    payment.gateway_payment_id,
                "payment_status":
                    payment.status,
                "booking_status":
                    updated_booking.status,
                "amount":
                    str(payment.amount),
            },
            status=status.HTTP_200_OK,
        )


class RazorpayPaymentFailedView(
    generics.GenericAPIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):
        booking_id = (
            request.data.get(
                "booking_id"
            )
        )

        if not booking_id:
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
            payment = mark_payment_failed(
                booking=booking
            )

        except ValidationError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "booking_id":
                    str(
                        booking.booking_id
                    ),
                "payment_status":
                    payment.status,
                "booking_status":
                    booking.status,
            },
            status=status.HTTP_200_OK,
        )


class RazorpayWebhookView(
    generics.GenericAPIView
):
    """
    Razorpay webhook endpoint.

    Razorpay sends the raw request body.
    Signature is verified using the configured
    RAZORPAY_WEBHOOK_SECRET.
    """

    permission_classes = [
        AllowAny
    ]

    authentication_classes = []

    def post(
        self,
        request,
    ):
        webhook_secret = os.getenv(
            "RAZORPAY_WEBHOOK_SECRET",
            "",
        )

        if not webhook_secret:
            return Response(
                {
                    "detail":
                        "Webhook secret is not configured."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        received_signature = (
            request.headers.get(
                "X-Razorpay-Signature",
                "",
            )
        )

        if not received_signature:
            return Response(
                {
                    "detail":
                        "Missing Razorpay webhook signature."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        expected_signature = (
            hmac.new(
                webhook_secret.encode(
                    "utf-8"
                ),
                request.body,
                hashlib.sha256,
            )
            .hexdigest()
        )

        if not hmac.compare_digest(
            expected_signature,
            received_signature,
        ):
            return Response(
                {
                    "detail":
                        "Invalid webhook signature."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = request.data

        event = payload.get(
            "event"
        )

        payment_entity = (
            payload
            .get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )

        order_id = payment_entity.get(
            "order_id"
        )

        payment_id = payment_entity.get(
            "id"
        )

        if event in {
            "payment.captured",
            "payment.authorized",
        }:
            if not order_id or not payment_id:
                return Response(
                    {
                        "detail":
                            "Webhook payment data is incomplete."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                payment = (
                    Payment.objects
                    .select_related(
                        "booking"
                    )
                    .get(
                        gateway_order_id=
                            order_id
                    )
                )

                booking = payment.booking

                if (
                    payment.status
                    != Payment.STATUS_SUCCESS
                ):
                    verified_payment = (
                        verify_payment_signature(
                            booking=booking,
                            razorpay_order_id=
                                order_id,
                            razorpay_payment_id=
                                payment_id,
                            razorpay_signature=
                                received_signature,
                        )
                    )

                    transaction.on_commit(
                        lambda booking_id=booking.booking_id: generate_ticket_task.delay(
                            str(booking_id)
                        )
                    )

                    return Response(
                        {
                            "status":
                                "processed",
                            "payment_id":
                                verified_payment.gateway_payment_id,
                        },
                        status=status.HTTP_200_OK,
                    )

            except Payment.DoesNotExist:
                return Response(
                    {
                        "status":
                            "ignored",
                    },
                    status=status.HTTP_200_OK,
                )

        elif event == "payment.failed":
            if order_id:
                payment = (
                    Payment.objects
                    .select_related(
                        "booking"
                    )
                    .filter(
                        gateway_order_id=
                            order_id
                    )
                    .first()
                )

                if payment:
                    booking = (
                        payment.booking
                    )

                    if (
                        booking.status
                        == Booking.STATUS_PENDING
                    ):
                        try:
                            mark_payment_failed(
                                booking=booking
                            )
                        except ValidationError:
                            pass

        return Response(
            {
                "status":
                    "received",
            },
            status=status.HTTP_200_OK,
        )



class VerifyTicketView(
    generics.GenericAPIView
):
    """Public ticket verification endpoint."""

    permission_classes = [
        AllowAny
    ]

    authentication_classes = []

    def get(
        self,
        request,
        verification_code,
    ):
        ticket = (
            Ticket.objects
            .select_related(
                "booking",
                "booking__show",
                "booking__show__movie",
                "booking__show__screen",
                "booking__show__screen__theater",
                "booking__show__screen__theater__city",
            )
            .prefetch_related(
                "booking__booking_seats__show_seat__seat",
            )
            .filter(
                verification_code=verification_code,
            )
            .first()
        )

        if ticket is None:
            return Response(
                {
                    "valid": False,
                    "detail": "Ticket not found.",
                },
                status=status.HTTP_200_OK,
            )

        booking = ticket.booking
        show = booking.show
        theater = show.screen.theater
        city = theater.city

        seats = []

        for booking_seat in booking.booking_seats.all():
            seat = booking_seat.show_seat.seat
            seats.append(
                f"{seat.row}{seat.number}"
            )

        return Response(
            {
                "valid":
                    booking.status
                    == Booking.STATUS_CONFIRMED,
                "ticket_number":
                    str(ticket.ticket_number),
                "booking_id":
                    str(booking.booking_id),
                "movie_title":
                    show.movie.title,
                "theater_name":
                    theater.name,
                "screen_name":
                    show.screen.name,
                "city_name":
                    city.name,
                "show_time":
                    show.start_time,
                "seats":
                    seats,
            },
            status=status.HTTP_200_OK,
        )


class MockPaymentView(
    generics.GenericAPIView
):
    """
    Existing development-only mock payment endpoint.
    """

    permission_classes = [
        IsAuthenticated
    ]

    def post(
        self,
        request,
    ):
        booking_id = (
            request.data.get(
                "booking_id"
            )
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
                lambda booking_id=booking.booking_id: generate_ticket_task.delay(
                    str(booking_id)
                )
            )

        updated_booking = (
            Booking.objects.get(
                pk=booking.pk
            )
        )

        return Response(
            {
                "booking_id":
                    str(
                        booking.booking_id
                    ),
                "payment_reference":
                    payment.payment_reference,
                "payment_status":
                    payment.status,
                "booking_status":
                    updated_booking.status,
                "amount":
                    str(payment.amount),
            },
            status=status.HTTP_200_OK,
        )