from django.urls import path

from bookings.ticket_views import (
    TicketDetailView,
    TicketDownloadView,
    TicketVerifyView,
)
from bookings.views import (
    BookingDetailView,
    BookingListView,
    CreateBookingView,
    MockPaymentView,
    ShowSeatsView,
)


urlpatterns = [
    # ---------------------------------------------------------
    # SHOW SEATS
    # ---------------------------------------------------------

    path(
        "shows/<int:show_id>/seats/",
        ShowSeatsView.as_view(),
        name="show-seats",
    ),

    # ---------------------------------------------------------
    # BOOKINGS
    # ---------------------------------------------------------

    path(
        "",
        BookingListView.as_view(),
        name="booking-list",
    ),

    path(
        "create/",
        CreateBookingView.as_view(),
        name="booking-create",
    ),

    path(
        "<uuid:booking_id>/",
        BookingDetailView.as_view(),
        name="booking-detail",
    ),

    # ---------------------------------------------------------
    # PAYMENT
    # ---------------------------------------------------------

    path(
        "payment/mock/",
        MockPaymentView.as_view(),
        name="mock-payment",
    ),

    # ---------------------------------------------------------
    # TICKETS
    # ---------------------------------------------------------

    path(
        "tickets/<uuid:booking_id>/",
        TicketDetailView.as_view(),
        name="ticket-detail",
    ),

    path(
        "tickets/<uuid:booking_id>/download/",
        TicketDownloadView.as_view(),
        name="ticket-download",
    ),

    path(
        "tickets/verify/<uuid:verification_code>/",
        TicketVerifyView.as_view(),
        name="ticket-verify",
    ),
]