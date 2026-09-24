from django.db import transaction

from bookings.models import ShowSeat


@transaction.atomic
def create_show_seats(show):
    seats = show.screen.seats.all()

    show_seats = [
        ShowSeat(
            show=show,
            seat=seat,
            price=show.ticket_price,
        )
        for seat in seats
    ]

    ShowSeat.objects.bulk_create(
        show_seats,
        ignore_conflicts=True,
    )

    return ShowSeat.objects.filter(show=show)