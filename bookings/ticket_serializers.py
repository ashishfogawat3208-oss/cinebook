from rest_framework import serializers

from bookings.models import Ticket


class TicketSerializer(
    serializers.ModelSerializer
):
    booking_id = serializers.UUIDField(
        source="booking.booking_id",
        read_only=True,
    )

    class Meta:
        model = Ticket

        fields = [
            "ticket_number",
            "booking_id",
            "verification_code",
            "pdf",
            "generated_at",
            "created_at",
        ]

        read_only_fields = fields