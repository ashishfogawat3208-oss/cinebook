import api from "@/lib/api";

export interface AnalyticsDateRange {
  start: string;
  end: string;
}

export interface AnalyticsSummary {
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  failed_bookings: number;
  expired_bookings: number;
  total_revenue: number;
  refunded_amount: number;
  refunded_count: number;
  average_booking_value: number;
  new_users: number;
  total_users: number;
}

export interface RevenueSummary {
  today: number;
  this_week: number;
  this_month: number;
  this_year: number;
}

export interface BookingTrend {
  date: string;
  bookings: number;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
}

export interface TopMovie {
  movie_id: number;
  movie_title: string;
  booking_count: number;
  revenue: number;
}

export interface TopTheater {
  theater_id: number;
  theater_name: string;
  city_name: string;
  booking_count: number;
  revenue: number;
}

export interface PeakBookingHour {
  hour: number;
  booking_count: number;
}

export interface TheaterOccupancy {
  theater_id: number;
  theater_name: string;
  city_name: string;
  total_seats: number;
  occupied_seats: number;
  occupancy_percentage: number;
}

export interface UserGrowthItem {
  date: string;
  users: number;
}

export interface AnalyticsDashboard {
  date_range: AnalyticsDateRange;
  summary: AnalyticsSummary;
  revenue_summary: RevenueSummary;
  booking_trends: BookingTrend[];
  revenue_trends: RevenueTrend[];
  top_movies: TopMovie[];
  top_theaters: TopTheater[];
  peak_booking_hours: PeakBookingHour[];
  theater_occupancy: TheaterOccupancy[];
  user_growth: UserGrowthItem[];
}

export async function getAnalyticsDashboard(
  start?: string,
  end?: string
): Promise<AnalyticsDashboard> {
  const params: Record<string, string> = {};

  if (start) {
    params.start_date = start;
  }

  if (end) {
    params.end_date = end;
  }

  const response =
    await api.get<AnalyticsDashboard>(
      "/analytics/dashboard/",
      {
        params,
      }
    );

  return response.data;
}

export async function downloadAnalyticsCSV(
  start?: string,
  end?: string
): Promise<void> {
  const params: Record<string, string> = {};

  if (start) {
    params.start_date = start;
  }

  if (end) {
    params.end_date = end;
  }

  const response = await api.get(
    "/analytics/export/",
    {
      params,
      responseType: "blob",
    }
  );

  const blob = new Blob(
    [response.data],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url =
    window.URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `cinebook-analytics-${start || "all"}-${end || "all"}.csv`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);
}