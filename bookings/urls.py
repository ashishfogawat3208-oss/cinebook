from django.urls import path

from bookings.views import (
    BookingDetailView,
    BookingListView,
    CreateBookingView,
    CreateRazorpayOrderView,
    MockPaymentView,
    RazorpayPaymentFailedView,
    RazorpayWebhookView,
    ReleaseSeatHoldsView,
    ReserveSeatsView,
    ShowSeatsView,
    VerifyRazorpayPaymentView,
    VerifyTicketView,
)

from bookings.ticket_views import (
    TicketDetailView,
    TicketDownloadView,
    TicketVerifyView,
)


urlpatterns = [
    # ============================================================
    # SHOW SEATS
    # ============================================================

    path(
        "shows/<int:show_id>/seats/",
        ShowSeatsView.as_view(),
        name="show-seats",
    ),

    path(
        "shows/<int:show_id>/reserve/",
        ReserveSeatsView.as_view(),
        name="reserve-seats",
    ),

    path(
        "shows/<int:show_id>/release/",
        ReleaseSeatHoldsView.as_view(),
        name="release-seat-holds",
    ),

    # ============================================================
    # BOOKINGS
    # ============================================================

    path(
        "create/",
        CreateBookingView.as_view(),
        name="create-booking",
    ),

    path(
        "",
        BookingListView.as_view(),
        name="booking-list",
    ),

    path(
        "<uuid:booking_id>/",
        BookingDetailView.as_view(),
        name="booking-detail",
    ),

    # ============================================================
    # TICKETS
    # ============================================================

    path(
        "<uuid:booking_id>/ticket/",
        TicketDetailView.as_view(),
        name="ticket-detail",
    ),

    path(
        "<uuid:booking_id>/ticket/download/",
        TicketDownloadView.as_view(),
        name="ticket-download",
    ),

    # Existing public verification endpoint
    path(
        "ticket/verify/<str:verification_code>/",
        VerifyTicketView.as_view(),
        name="verify-ticket",
    ),

    # ============================================================
    # PAYMENTS
    # ============================================================

    path(
        "payment/mock/",
        MockPaymentView.as_view(),
        name="mock-payment",
    ),

    path(
        "payment/create-order/",
        CreateRazorpayOrderView.as_view(),
        name="create-razorpay-order",
    ),

    path(
        "payment/verify/",
        VerifyRazorpayPaymentView.as_view(),
        name="verify-razorpay-payment",
    ),

    path(
        "payment/failed/",
        RazorpayPaymentFailedView.as_view(),
        name="razorpay-payment-failed",
    ),

    path(
        "payment/webhook/",
        RazorpayWebhookView.as_view(),
        name="razorpay-webhook",
    ),
]