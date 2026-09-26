import uuid

from django.conf import settings
from django.db import models


class ShowSeat(models.Model):
    STATUS_AVAILABLE = "AVAILABLE"
    STATUS_BOOKED = "BOOKED"

    STATUS_CHOICES = [
        (STATUS_AVAILABLE, "Available"),
        (STATUS_BOOKED, "Booked"),
    ]

    show = models.ForeignKey(
        "theaters.Show",
        on_delete=models.CASCADE,
        related_name="show_seats",
    )

    seat = models.ForeignKey(
        "theaters.Seat",
        on_delete=models.CASCADE,
        related_name="show_seats",
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_AVAILABLE,
        db_index=True,
    )

    # Temporary 2-minute seat reservation
    held_until = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )

    held_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="held_show_seats",
        db_index=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "show",
                    "seat",
                ],
                name="unique_show_seat",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "show",
                    "status",
                ],
            ),
            models.Index(
                fields=[
                    "held_until",
                ],
            ),
            models.Index(
                fields=[
                    "held_by",
                    "held_until",
                ],
            ),
        ]

        ordering = [
            "seat__row",
            "seat__number",
        ]

    def __str__(self):
        return (
            f"{self.show} - "
            f"{self.seat.row}"
            f"{self.seat.number}"
        )


class Booking(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_CONFIRMED = "CONFIRMED"
    STATUS_CANCELLED = "CANCELLED"
    STATUS_FAILED = "FAILED"
    STATUS_EXPIRED = "EXPIRED"

    STATUS_CHOICES = [
        (
            STATUS_PENDING,
            "Pending",
        ),
        (
            STATUS_CONFIRMED,
            "Confirmed",
        ),
        (
            STATUS_CANCELLED,
            "Cancelled",
        ),
        (
            STATUS_FAILED,
            "Failed",
        ),
        (
            STATUS_EXPIRED,
            "Expired",
        ),
    ]

    booking_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookings",
    )

    show = models.ForeignKey(
        "theaters.Show",
        on_delete=models.PROTECT,
        related_name="bookings",
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "user",
                    "-created_at",
                ],
            ),
            models.Index(
                fields=[
                    "status",
                    "expires_at",
                ],
            ),
        ]

    def __str__(self):
        return str(
            self.booking_id
        )


class BookingSeat(models.Model):
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="booking_seats",
    )

    show_seat = models.ForeignKey(
        ShowSeat,
        on_delete=models.PROTECT,
        related_name="booking_seats",
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "booking",
                    "show_seat",
                ],
                name="unique_booking_show_seat",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "booking",
                ],
            ),
            models.Index(
                fields=[
                    "show_seat",
                ],
            ),
        ]

    def __str__(self):
        return (
            f"{self.booking.booking_id} - "
            f"{self.show_seat}"
        )


class Payment(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_SUCCESS = "SUCCESS"
    STATUS_FAILED = "FAILED"
    STATUS_REFUNDED = "REFUNDED"

    STATUS_CHOICES = [
        (
            STATUS_PENDING,
            "Pending",
        ),
        (
            STATUS_SUCCESS,
            "Success",
        ),
        (
            STATUS_FAILED,
            "Failed",
        ),
        (
            STATUS_REFUNDED,
            "Refunded",
        ),
    ]

    booking = models.OneToOneField(
        Booking,
        on_delete=models.PROTECT,
        related_name="payment",
    )

    # Razorpay order ID / existing mock reference
    payment_reference = models.CharField(
        max_length=100,
        unique=True,
    )

    # Razorpay transaction/payment ID
    gateway_payment_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        unique=True,
        db_index=True,
    )

    # Razorpay order ID
    gateway_order_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        unique=True,
        db_index=True,
    )

    # Razorpay signature
    gateway_signature = models.CharField(
        max_length=255,
        null=True,
        blank=True,
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
        db_index=True,
    )

    paid_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        indexes = [
            models.Index(
                fields=[
                    "status",
                    "-created_at",
                ],
            ),
            models.Index(
                fields=[
                    "gateway_payment_id",
                ],
            ),
            models.Index(
                fields=[
                    "gateway_order_id",
                ],
            ),
        ]

    def __str__(self):
        return self.payment_reference


class Ticket(models.Model):
    booking = models.OneToOneField(
        Booking,
        on_delete=models.PROTECT,
        related_name="ticket",
    )

    ticket_number = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    verification_code = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    pdf = models.FileField(
        upload_to="tickets/%Y/%m/%d/",
        blank=True,
        null=True,
    )

    generated_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return str(
            self.ticket_number
        )