from django.urls import path

from analytics.views import (
    AnalyticsCSVExportView,
    AnalyticsDashboardView,
)


urlpatterns = [
    path(
        "dashboard/",
        AnalyticsDashboardView.as_view(),
        name="analytics-dashboard",
    ),

    path(
        "export/",
        AnalyticsCSVExportView.as_view(),
        name="analytics-export",
    ),
]