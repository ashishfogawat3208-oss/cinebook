from datetime import datetime, time, timedelta
from decimal import Decimal
import csv

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Avg
from django.db.models.functions import ExtractHour, TruncDay
from django.http import HttpResponse
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking, BookingSeat, Payment, ShowSeat
from analytics.permissions import IsAdminUserOnly


User = get_user_model()


def decimal_to_float(value):
    if value is None:
        return 0.0

    if isinstance(value, Decimal):
        return float(value)

    return float(value)


def parse_date_range(request):
    """
    Returns:
        start_date
        end_date
        start_datetime
        end_datetime
    """

    today = timezone.localdate()

    default_start = today - timedelta(days=29)
    default_end = today

    start_value = request.query_params.get("start_date")
    end_value = request.query_params.get("end_date")

    try:
        start_date = (
            datetime.strptime(
                start_value,
                "%Y-%m-%d",
            ).date()
            if start_value
            else default_start
        )
    except ValueError:
        start_date = default_start

    try:
        end_date = (
            datetime.strptime(
                end_value,
                "%Y-%m-%d",
            ).date()
            if end_value
            else default_end
        )
    except ValueError:
        end_date = default_end

    if end_date < start_date:
        start_date, end_date = end_date, start_date

    start_datetime = timezone.make_aware(
        datetime.combine(
            start_date,
            time.min,
        )
    )

    end_datetime = timezone.make_aware(
        datetime.combine(
            end_date + timedelta(days=1),
            time.min,
        )
    )

    return (
        start_date,
        end_date,
        start_datetime,
        end_datetime,
    )


def get_revenue_summary():
    """
    Calendar-based revenue:
    today / current week / current month / current year.
    """

    now = timezone.localtime()
    today = now.date()

    today_start = timezone.make_aware(
        datetime.combine(
            today,
            time.min,
        )
    )

    tomorrow_start = today_start + timedelta(days=1)

    week_start_date = (
        today - timedelta(days=today.weekday())
    )

    week_start = timezone.make_aware(
        datetime.combine(
            week_start_date,
            time.min,
        )
    )

    month_start = timezone.make_aware(
        datetime(
            today.year,
            today.month,
            1,
        )
    )

    year_start = timezone.make_aware(
        datetime(
            today.year,
            1,
            1,
        )
    )

    base = Payment.objects.filter(
        status=Payment.STATUS_SUCCESS,
        paid_at__isnull=False,
    )

    def revenue_between(start, end):
        value = (
            base.filter(
                paid_at__gte=start,
                paid_at__lt=end,
            )
            .aggregate(total=Sum("amount"))
            .get("total")
        )

        return decimal_to_float(value)

    return {
        "today": revenue_between(
            today_start,
            tomorrow_start,
        ),
        "this_week": revenue_between(
            week_start,
            tomorrow_start,
        ),
        "this_month": revenue_between(
            month_start,
            tomorrow_start,
        ),
        "this_year": revenue_between(
            year_start,
            tomorrow_start,
        ),
    }


class AnalyticsDashboardView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdminUserOnly,
    ]

    def get(self, request):
        (
            start_date,
            end_date,
            start_datetime,
            end_datetime,
        ) = parse_date_range(request)

        # ---------------------------------------------------------
        # BASE QUERYSETS
        # ---------------------------------------------------------

        bookings = Booking.objects.filter(
            created_at__gte=start_datetime,
            created_at__lt=end_datetime,
        )

        confirmed_bookings = bookings.filter(
            status=Booking.STATUS_CONFIRMED
        )

        successful_payments = Payment.objects.filter(
            status=Payment.STATUS_SUCCESS,
            paid_at__isnull=False,
            paid_at__gte=start_datetime,
            paid_at__lt=end_datetime,
        )

        refunded_payments = Payment.objects.filter(
            status=Payment.STATUS_REFUNDED,
            updated_at__gte=start_datetime,
            updated_at__lt=end_datetime,
        )

        # ---------------------------------------------------------
        # SUMMARY
        # ---------------------------------------------------------

        total_bookings = bookings.count()

        confirmed_count = confirmed_bookings.count()

        pending_count = bookings.filter(
            status=Booking.STATUS_PENDING
        ).count()

        cancelled_count = bookings.filter(
            status=Booking.STATUS_CANCELLED
        ).count()

        failed_count = bookings.filter(
            status=Booking.STATUS_FAILED
        ).count()

        expired_count = bookings.filter(
            status=Booking.STATUS_EXPIRED
        ).count()

        revenue_value = (
            successful_payments.aggregate(
                total=Sum("amount")
            ).get("total")
        )

        total_revenue = decimal_to_float(
            revenue_value
        )

        refunded_value = (
            refunded_payments.aggregate(
                total=Sum("amount")
            ).get("total")
        )

        refunded_amount = decimal_to_float(
            refunded_value
        )

        refunded_count = refunded_payments.count()

        average_booking_value = (
            total_revenue / confirmed_count
            if confirmed_count
            else 0
        )

        new_users = User.objects.filter(
            date_joined__gte=start_datetime,
            date_joined__lt=end_datetime,
        ).count()

        total_users = User.objects.count()

        # ---------------------------------------------------------
        # BOOKING TRENDS
        # ---------------------------------------------------------

        booking_trend_rows = (
            confirmed_bookings
            .annotate(
                day=TruncDay("created_at")
            )
            .values("day")
            .annotate(
                bookings=Count(
                    "id",
                    distinct=True,
                )
            )
            .order_by("day")
        )

        booking_trends = [
            {
                "date": row["day"].date().isoformat()
                if row["day"]
                else "",
                "bookings": row["bookings"] or 0,
            }
            for row in booking_trend_rows
        ]

        # ---------------------------------------------------------
        # REVENUE TRENDS
        # ---------------------------------------------------------

        revenue_trend_rows = (
            successful_payments
            .annotate(
                day=TruncDay("paid_at")
            )
            .values("day")
            .annotate(
                revenue=Sum("amount")
            )
            .order_by("day")
        )

        revenue_trends = [
            {
                "date": row["day"].date().isoformat()
                if row["day"]
                else "",
                "revenue": decimal_to_float(
                    row["revenue"]
                ),
            }
            for row in revenue_trend_rows
        ]

        # ---------------------------------------------------------
        # MOST BOOKED MOVIES
        # ---------------------------------------------------------

        movie_rows = (
            successful_payments
            .values(
                "booking__show__movie_id",
                "booking__show__movie__title",
            )
            .annotate(
                booking_count=Count(
                    "booking_id",
                    distinct=True,
                ),
                revenue=Sum("amount"),
            )
            .order_by(
                "-booking_count",
                "-revenue",
                "booking__show__movie__title",
            )[:10]
        )

        top_movies = [
            {
                "movie_id": row[
                    "booking__show__movie_id"
                ],
                "movie_title": row[
                    "booking__show__movie__title"
                ]
                or "Unknown Movie",
                "booking_count": row[
                    "booking_count"
                ]
                or 0,
                "revenue": decimal_to_float(
                    row["revenue"]
                ),
            }
            for row in movie_rows
        ]

        # ---------------------------------------------------------
        # TOP THEATERS
        # ---------------------------------------------------------

        theater_rows = (
            successful_payments
            .values(
                "booking__show__screen__theater_id",
                "booking__show__screen__theater__name",
                "booking__show__screen__theater__city__name",
            )
            .annotate(
                booking_count=Count(
                    "booking_id",
                    distinct=True,
                ),
                revenue=Sum("amount"),
            )
            .order_by(
                "-booking_count",
                "-revenue",
                "booking__show__screen__theater__name",
            )[:10]
        )

        top_theaters = [
            {
                "theater_id": row[
                    "booking__show__screen__theater_id"
                ],
                "theater_name": row[
                    "booking__show__screen__theater__name"
                ]
                or "Unknown Theater",
                "city_name": row[
                    "booking__show__screen__theater__city__name"
                ]
                or "Unknown City",
                "booking_count": row[
                    "booking_count"
                ]
                or 0,
                "revenue": decimal_to_float(
                    row["revenue"]
                ),
            }
            for row in theater_rows
        ]

        # ---------------------------------------------------------
        # PEAK BOOKING HOURS
        # ---------------------------------------------------------

        peak_hour_rows = (
            confirmed_bookings
            .annotate(
                hour=ExtractHour("created_at")
            )
            .values("hour")
            .annotate(
                booking_count=Count(
                    "id",
                    distinct=True,
                )
            )
            .order_by(
                "-booking_count",
                "hour",
            )
        )

        peak_booking_hours = [
            {
                "hour": int(row["hour"]),
                "booking_count": row[
                    "booking_count"
                ]
                or 0,
            }
            for row in peak_hour_rows
            if row["hour"] is not None
        ]

        # ---------------------------------------------------------
        # THEATER OCCUPANCY
        #
        # Capacity = all seats available across shows
        # in the selected period.
        #
        # Occupied = seats belonging to confirmed bookings
        # in the selected period.
        # ---------------------------------------------------------

        capacity_rows = (
            ShowSeat.objects
            .filter(
                show__start_time__gte=start_datetime,
                show__start_time__lt=end_datetime,
            )
            .values(
                "show__screen__theater_id",
                "show__screen__theater__name",
                "show__screen__theater__city__name",
            )
            .annotate(
                total_seats=Count(
                    "id",
                    distinct=True,
                )
            )
        )

        occupied_rows = (
            BookingSeat.objects
            .filter(
                booking__status=Booking.STATUS_CONFIRMED,
                booking__created_at__gte=start_datetime,
                booking__created_at__lt=end_datetime,
            )
            .values(
                "booking__show__screen__theater_id"
            )
            .annotate(
                occupied_seats=Count(
                    "id",
                    distinct=True,
                )
            )
        )

        occupied_map = {
            row[
                "booking__show__screen__theater_id"
            ]: row["occupied_seats"] or 0
            for row in occupied_rows
        }

        theater_occupancy = []

        for row in capacity_rows:
            theater_id = row[
                "show__screen__theater_id"
            ]

            total_seats = (
                row["total_seats"] or 0
            )

            occupied_seats = occupied_map.get(
                theater_id,
                0,
            )

            occupancy_percentage = (
                (
                    occupied_seats
                    / total_seats
                )
                * 100
                if total_seats
                else 0
            )

            # Safety clamp.
            occupancy_percentage = min(
                max(occupancy_percentage, 0),
                100,
            )

            theater_occupancy.append(
                {
                    "theater_id": theater_id,
                    "theater_name": row[
                        "show__screen__theater__name"
                    ]
                    or "Unknown Theater",
                    "city_name": row[
                        "show__screen__theater__city__name"
                    ]
                    or "Unknown City",
                    "total_seats": total_seats,
                    "occupied_seats": occupied_seats,
                    "occupancy_percentage": round(
                        occupancy_percentage,
                        2,
                    ),
                }
            )

        theater_occupancy.sort(
            key=lambda item: item[
                "occupancy_percentage"
            ],
            reverse=True,
        )

        # ---------------------------------------------------------
        # USER GROWTH
        # ---------------------------------------------------------

        user_growth_rows = (
            User.objects
            .filter(
                date_joined__gte=start_datetime,
                date_joined__lt=end_datetime,
            )
            .annotate(
                day=TruncDay("date_joined")
            )
            .values("day")
            .annotate(
                users=Count(
                    "id",
                    distinct=True,
                )
            )
            .order_by("day")
        )

        user_growth = [
            {
                "date": row["day"].date().isoformat()
                if row["day"]
                else "",
                "users": row["users"] or 0,
            }
            for row in user_growth_rows
        ]

        # ---------------------------------------------------------
        # RESPONSE
        # ---------------------------------------------------------

        return Response(
            {
                "date_range": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                },
                "summary": {
                    "total_bookings": total_bookings,
                    "confirmed_bookings": confirmed_count,
                    "pending_bookings": pending_count,
                    "cancelled_bookings": cancelled_count,
                    "failed_bookings": failed_count,
                    "expired_bookings": expired_count,
                    "total_revenue": total_revenue,
                    "refunded_amount": refunded_amount,
                    "refunded_count": refunded_count,
                    "average_booking_value": round(
                        average_booking_value,
                        2,
                    ),
                    "new_users": new_users,
                    "total_users": total_users,
                },
                "revenue_summary": get_revenue_summary(),
                "booking_trends": booking_trends,
                "revenue_trends": revenue_trends,
                "top_movies": top_movies,
                "top_theaters": top_theaters,
                "peak_booking_hours": peak_booking_hours,
                "theater_occupancy": theater_occupancy,
                "user_growth": user_growth,
            }
        )


class AnalyticsCSVExportView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdminUserOnly,
    ]

    def get(self, request):
        (
            start_date,
            end_date,
            start_datetime,
            end_datetime,
        ) = parse_date_range(request)

        bookings = (
            Booking.objects
            .filter(
                created_at__gte=start_datetime,
                created_at__lt=end_datetime,
            )
            .select_related(
                "user",
                "show",
                "show__movie",
                "show__screen",
                "show__screen__theater",
                "show__screen__theater__city",
                "payment",
            )
            .order_by("-created_at")
        )

        response = HttpResponse(
            content_type="text/csv"
        )

        response[
            "Content-Disposition"
        ] = (
            f'attachment; filename="cinebook-analytics-'
            f'{start_date.isoformat()}-'
            f'{end_date.isoformat()}.csv"'
        )

        writer = csv.writer(response)

        writer.writerow(
            [
                "Booking ID",
                "Booking Date",
                "User",
                "Email",
                "Movie",
                "Theater",
                "City",
                "Show Time",
                "Status",
                "Booking Amount",
                "Payment Status",
                "Payment Reference",
            ]
        )

        for booking in bookings.iterator(
            chunk_size=1000
        ):
            payment = getattr(
                booking,
                "payment",
                None,
            )

            writer.writerow(
                [
                    str(booking.booking_id),
                    booking.created_at.strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                    booking.user.username
                    if booking.user
                    else "",
                    booking.user.email
                    if booking.user
                    else "",
                    booking.show.movie.title
                    if booking.show
                    and booking.show.movie
                    else "",
                    booking.show.screen.theater.name
                    if booking.show
                    and booking.show.screen
                    and booking.show.screen.theater
                    else "",
                    booking.show.screen.theater.city.name
                    if booking.show
                    and booking.show.screen
                    and booking.show.screen.theater
                    and booking.show.screen.theater.city
                    else "",
                    booking.show.start_time.strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )
                    if booking.show
                    else "",
                    booking.status,
                    booking.total_amount,
                    payment.status
                    if payment
                    else "",
                    payment.payment_reference
                    if payment
                    else "",
                ]
            )

        return response