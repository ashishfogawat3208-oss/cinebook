from decimal import Decimal
import uuid

import razorpay

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from bookings.models import (
    Booking,
    Payment,
)

from bookings.services.booking import (
    expire_pending_booking,
    finalize_booking_seats,
    reacquire_booking_seats_for_retry,
    release_booking_seats,
)


def get_razorpay_client():
    key_id = getattr(
        settings,
        "RAZORPAY_KEY_ID",
        "",
    )

    key_secret = getattr(
        settings,
        "RAZORPAY_KEY_SECRET",
        "",
    )

    if not key_id or not key_secret:
        raise ValidationError(
            "Razorpay credentials are not configured."
        )

    return razorpay.Client(
        auth=(
            key_id,
            key_secret,
        )
    )


@transaction.atomic
def create_payment_order(*, booking):
    """
    Create or reuse a Razorpay order for a pending booking.

    If a previous payment attempt failed, the booking's
    seats are reacquired before a new order is created.
    """

    booking = (
        Booking.objects
        .select_for_update()
        .get(pk=booking.pk)
    )

    if booking.status != Booking.STATUS_PENDING:
        raise ValidationError(
            "Only pending bookings can be paid."
        )

    now = timezone.now()

    if (
        booking.expires_at
        and booking.expires_at <= now
    ):
        expire_pending_booking(
            booking
        )

        raise ValidationError(
            "This booking payment window has expired."
        )

    amount = Decimal(
        booking.total_amount
    )

    if amount <= Decimal("0.00"):
        raise ValidationError(
            "Invalid booking amount."
        )

    payment = (
        Payment.objects
        .select_for_update()
        .filter(
            booking=booking
        )
        .first()
    )

    # If there is no payment yet, or the previous payment
    # failed, reacquire the booking seats before retrying.
    if (
        payment is None
        or payment.status == Payment.STATUS_FAILED
    ):
        reacquire_booking_seats_for_retry(
            booking=booking
        )

    # Reuse an existing pending Razorpay order.
    if (
        payment
        and payment.status == Payment.STATUS_PENDING
        and payment.gateway_order_id
    ):
        return {
            "payment": payment,
            "order_id": payment.gateway_order_id,
            "amount": int(
                amount * Decimal("100")
            ),
            "currency": "INR",
            "key_id": getattr(
                settings,
                "RAZORPAY_KEY_ID",
                "",
            ),
        }

    client = get_razorpay_client()

    amount_in_paise = int(
        amount * Decimal("100")
    )

    receipt = (
        f"cinebook_{booking.booking_id}"
    )

    order = client.order.create(
        data={
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": {
                "booking_id": str(
                    booking.booking_id
                ),
                "user_id": str(
                    booking.user_id
                ),
            },
        }
    )

    razorpay_order_id = order["id"]

    if payment is None:
        payment = Payment.objects.create(
            booking=booking,
            payment_reference=razorpay_order_id,
            gateway_order_id=razorpay_order_id,
            amount=amount,
            status=Payment.STATUS_PENDING,
        )
    else:
        payment.payment_reference = (
            razorpay_order_id
        )
        payment.gateway_order_id = (
            razorpay_order_id
        )
        payment.gateway_payment_id = None
        payment.gateway_signature = None
        payment.amount = amount
        payment.status = Payment.STATUS_PENDING
        payment.paid_at = None

        payment.save(
            update_fields=[
                "payment_reference",
                "gateway_order_id",
                "gateway_payment_id",
                "gateway_signature",
                "amount",
                "status",
                "paid_at",
                "updated_at",
            ]
        )

    return {
        "payment": payment,
        "order_id": razorpay_order_id,
        "amount": amount_in_paise,
        "currency": "INR",
        "key_id": getattr(
            settings,
            "RAZORPAY_KEY_ID",
            "",
        ),
    }


@transaction.atomic
def verify_payment_signature(
    *,
    booking,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
):
    """
    Verify Razorpay Checkout payment server-side.

    Successful payment:
        Payment -> SUCCESS
        Booking -> CONFIRMED
        Seats -> BOOKED
    """

    booking = (
        Booking.objects
        .select_for_update()
        .get(pk=booking.pk)
    )

    payment = (
        Payment.objects
        .select_for_update()
        .get(
            booking=booking
        )
    )

    # Idempotency.
    if (
        payment.status == Payment.STATUS_SUCCESS
        and payment.gateway_payment_id
        == razorpay_payment_id
    ):
        return payment

    if booking.status == Booking.STATUS_CONFIRMED:
        return payment

    if booking.status != Booking.STATUS_PENDING:
        raise ValidationError(
            "This booking is no longer payable."
        )

    now = timezone.now()

    if (
        booking.expires_at
        and booking.expires_at <= now
    ):
        expire_pending_booking(
            booking
        )

        raise ValidationError(
            "This booking payment window has expired."
        )

    if not razorpay_order_id:
        raise ValidationError(
            "Razorpay order ID is required."
        )

    if not razorpay_payment_id:
        raise ValidationError(
            "Razorpay payment ID is required."
        )

    if not razorpay_signature:
        raise ValidationError(
            "Razorpay signature is required."
        )

    if (
        payment.gateway_order_id
        and payment.gateway_order_id
        != razorpay_order_id
    ):
        raise ValidationError(
            "Razorpay order does not match this booking."
        )

    if (
        payment.amount
        != booking.total_amount
    ):
        raise ValidationError(
            "Payment amount does not match the booking."
        )

    client = get_razorpay_client()

    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id":
                    razorpay_order_id,
                "razorpay_payment_id":
                    razorpay_payment_id,
                "razorpay_signature":
                    razorpay_signature,
            }
        )
    except Exception as exc:
        raise ValidationError(
            "Payment signature verification failed."
        ) from exc

    payment.gateway_order_id = (
        razorpay_order_id
    )

    payment.gateway_payment_id = (
        razorpay_payment_id
    )

    payment.gateway_signature = (
        razorpay_signature
    )

    payment.payment_reference = (
        razorpay_order_id
    )

    payment.status = (
        Payment.STATUS_SUCCESS
    )

    payment.paid_at = timezone.now()

    payment.save(
        update_fields=[
            "gateway_order_id",
            "gateway_payment_id",
            "gateway_signature",
            "payment_reference",
            "status",
            "paid_at",
            "updated_at",
        ]
    )

    booking.status = (
        Booking.STATUS_CONFIRMED
    )

    booking.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    # Payment is now confirmed, so permanently book
    # the seats.
    finalize_booking_seats(
        booking=booking
    )

    return payment


@transaction.atomic
def mark_payment_failed(*, booking):
    """
    Mark the current payment attempt as failed.

    The booking remains PENDING so the user can retry
    payment while the original booking window is active.

    Failed payment releases the temporary seat holds.
    A later retry reacquires the seats.
    """

    booking = (
        Booking.objects
        .select_for_update()
        .get(pk=booking.pk)
    )

    if booking.status == Booking.STATUS_CONFIRMED:
        raise ValidationError(
            "A confirmed booking cannot be marked failed."
        )

    if booking.status in {
        Booking.STATUS_EXPIRED,
        Booking.STATUS_CANCELLED,
    }:
        raise ValidationError(
            "This booking can no longer accept payment."
        )

    now = timezone.now()

    if (
        booking.expires_at
        and booking.expires_at <= now
    ):
        expire_pending_booking(
            booking
        )

        raise ValidationError(
            "This booking payment window has expired."
        )

    payment, _ = (
        Payment.objects
        .select_for_update()
        .get_or_create(
            booking=booking,
            defaults={
                "payment_reference":
                    f"FAILED-{uuid.uuid4().hex[:20].upper()}",
                "amount":
                    booking.total_amount,
                "status":
                    Payment.STATUS_FAILED,
            },
        )
    )

    payment.status = (
        Payment.STATUS_FAILED
    )

    payment.paid_at = None

    payment.save(
        update_fields=[
            "status",
            "paid_at",
            "updated_at",
        ]
    )

    # Requirement:
    # failed payment releases temporary seats.
    release_booking_seats(
        booking
    )

    # IMPORTANT:
    # Booking remains PENDING so the same booking can
    # retry payment before expires_at.
    booking.status = Booking.STATUS_PENDING

    booking.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    return payment


@transaction.atomic
def process_mock_payment(
    *,
    booking,
    success=True,
):
    """
    Development/mock payment flow.

    Uses the same seat finalization/release rules as
    the real Razorpay flow.
    """

    booking = (
        Booking.objects
        .select_for_update()
        .get(pk=booking.pk)
    )

    if booking.status != Booking.STATUS_PENDING:
        raise ValidationError(
            "Only pending bookings can be paid."
        )

    now = timezone.now()

    if (
        booking.expires_at
        and booking.expires_at <= now
    ):
        expire_pending_booking(
            booking
        )

        raise ValidationError(
            "This booking payment window has expired."
        )

    if not success:
        return mark_payment_failed(
            booking=booking
        )

    # Make sure the seats are held before success.
    reacquire_booking_seats_for_retry(
        booking=booking
    )

    payment_reference = (
        f"MOCK-{uuid.uuid4().hex[:20].upper()}"
    )

    payment, _ = (
        Payment.objects
        .update_or_create(
            booking=booking,
            defaults={
                "payment_reference":
                    payment_reference,
                "gateway_order_id":
                    None,
                "gateway_payment_id":
                    None,
                "gateway_signature":
                    None,
                "amount":
                    booking.total_amount,
                "status":
                    Payment.STATUS_SUCCESS,
                "paid_at":
                    timezone.now(),
            },
        )
    )

    booking.status = (
        Booking.STATUS_CONFIRMED
    )

    booking.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    finalize_booking_seats(
        booking=booking
    )

    return payment