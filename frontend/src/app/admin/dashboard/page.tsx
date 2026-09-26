"use client";

import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Film,
  Loader2,
  RefreshCw,
  Ticket,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

import {
  downloadAnalyticsCSV,
  getAnalyticsDashboard,
  type AnalyticsDashboard,
} from "@/lib/analytics";

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:00 ${suffix}`;
}

function formatDate(date: string) {
  if (!date) {
    return "-";
  }

  const parts = date.split("-");

  if (parts.length === 3) {
    return new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof TrendingUp;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>

          <p className="mt-2 text-2xl font-bold text-white">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-zinc-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/15 text-purple-400">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
      <h2 className="mb-5 text-lg font-semibold text-white">
        {title}
      </h2>

      {children}
    </section>
  );
}

function EmptyState({
  text = "No data available.",
}: {
  text?: string;
}) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-zinc-500">
      {text}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const [data, setData] =
    useState<AnalyticsDashboard | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [exporting, setExporting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const loadDashboard = useCallback(
    async (
      start?: string,
      end?: string,
      showRefresh = false
    ) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const result =
          await getAnalyticsDashboard(
            start,
            end
          );

        setData(result);
      } catch (err: any) {
        console.error(
          "Analytics dashboard error:",
          err
        );

        const status =
          err?.response?.status;

        if (status === 403) {
          setError(
            "Administrator access is required to view this dashboard."
          );
        } else if (status === 401) {
          setError(
            "Your session has expired. Please log in again."
          );
        } else {
          setError(
            err?.response?.data?.detail ||
              "Unable to load analytics."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleApplyFilter = () => {
    loadDashboard(
      startDate || undefined,
      endDate || undefined,
      true
    );
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");

    loadDashboard(
      undefined,
      undefined,
      true
    );
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      await downloadAnalyticsCSV(
        startDate || undefined,
        endDate || undefined
      );
    } catch (err: any) {
      console.error(
        "Analytics CSV export failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to export analytics CSV."
      );
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="flex min-h-[75vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-zinc-500">
            <Loader2
              size={34}
              className="animate-spin text-purple-500"
            />

            <p className="text-sm">
              Loading admin analytics...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="flex min-h-[75vh] items-center justify-center px-5">
          <div className="max-w-md text-center">
            <XCircle
              size={46}
              className="mx-auto mb-5 text-red-500"
            />

            <h1 className="text-2xl font-bold">
              Dashboard unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadDashboard(
                  undefined,
                  undefined,
                  true
                )
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  const {
    summary,
    revenue_summary,
    booking_trends,
    revenue_trends,
    top_movies,
    top_theaters,
    peak_booking_hours,
    theater_occupancy,
    user_growth,
    date_range,
  } = data;

  const maxBookingTrend = Math.max(
    ...booking_trends.map(
      (item) => item.bookings || 0
    ),
    1
  );

  const maxRevenueTrend = Math.max(
    ...revenue_trends.map(
      (item) => item.revenue || 0
    ),
    1
  );

  const maxUserGrowth = Math.max(
    ...user_growth.map(
      (item) => item.users || 0
    ),
    1
  );

  const maxMovieBookings = Math.max(
    ...top_movies.map(
      (item) => item.booking_count || 0
    ),
    1
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-purple-400">
              <BarChart3 size={17} />
              Administrator
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              CineBook Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Business overview, bookings, revenue,
              occupancy and user growth.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadDashboard(
                startDate || undefined,
                endDate || undefined,
                true
              )
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* DATE FILTER */}

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays
              size={18}
              className="text-purple-400"
            />

            <h2 className="font-semibold">
              Report period
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
            <label className="block">
              <span className="mb-2 block text-xs text-zinc-500">
                Start date
              </span>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs text-zinc-500">
                End date
              </span>

              <input
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
              />
            </label>

            <button
              type="button"
              onClick={handleApplyFilter}
              className="self-end rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="self-end rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
            >
              Reset
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              Showing{" "}
              {formatDate(date_range.start)}
              {" – "}
              {formatDate(date_range.end)}
            </p>

            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/5 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Download size={15} />
              )}

              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* MAIN STATS */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(
              summary.total_revenue
            )}
            subtitle="Selected period"
            icon={TrendingUp}
          />

          <StatCard
            title="Confirmed Bookings"
            value={formatNumber(
              summary.confirmed_bookings
            )}
            subtitle={`${formatNumber(
              summary.total_bookings
            )} total bookings`}
            icon={CheckCircle2}
          />

          <StatCard
            title="Average Booking"
            value={formatCurrency(
              summary.average_booking_value
            )}
            subtitle="Confirmed bookings"
            icon={Ticket}
          />

          <StatCard
            title="New Users"
            value={formatNumber(
              summary.new_users
            )}
            subtitle={`${formatNumber(
              summary.total_users
            )} users overall`}
            icon={Users}
          />
        </div>

        {/* REVENUE SUMMARY */}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today"
            value={formatCurrency(
              revenue_summary.today
            )}
            icon={CalendarDays}
          />

          <StatCard
            title="This Week"
            value={formatCurrency(
              revenue_summary.this_week
            )}
            icon={TrendingUp}
          />

          <StatCard
            title="This Month"
            value={formatCurrency(
              revenue_summary.this_month
            )}
            icon={BarChart3}
          />

          <StatCard
            title="This Year"
            value={formatCurrency(
              revenue_summary.this_year
            )}
            icon={Film}
          />
        </div>

        {/* BOOKING STATUS */}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending"
            value={formatNumber(
              summary.pending_bookings
            )}
            icon={Clock3}
          />

          <StatCard
            title="Cancelled"
            value={formatNumber(
              summary.cancelled_bookings
            )}
            icon={XCircle}
          />

          <StatCard
            title="Failed"
            value={formatNumber(
              summary.failed_bookings
            )}
            icon={XCircle}
          />

          <StatCard
            title="Refunded"
            value={formatCurrency(
              summary.refunded_amount
            )}
            subtitle={`${formatNumber(
              summary.refunded_count
            )} refunds`}
            icon={RefreshCw}
          />
        </div>

        {/* TRENDS */}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <SectionCard title="Booking Trends">
            {booking_trends.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {booking_trends.map(
                  (item) => {
                    const value =
                      item.bookings || 0;

                    const width =
                      (value /
                        maxBookingTrend) *
                      100;

                    return (
                      <div
                        key={item.date}
                      >
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-zinc-500">
                            {formatDate(
                              item.date
                            )}
                          </span>

                          <span className="font-medium text-white">
                            {formatNumber(
                              value
                            )}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-purple-500 transition-all"
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Revenue Trends">
            {revenue_trends.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {revenue_trends.map(
                  (item) => {
                    const value =
                      item.revenue || 0;

                    const width =
                      (value /
                        maxRevenueTrend) *
                      100;

                    return (
                      <div
                        key={item.date}
                      >
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-zinc-500">
                            {formatDate(
                              item.date
                            )}
                          </span>

                          <span className="font-medium text-white">
                            {formatCurrency(
                              value
                            )}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </SectionCard>
        </div>

        {/* MOVIES + THEATERS */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SectionCard title="Most Booked Movies">
            {top_movies.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {top_movies.map(
                  (movie, index) => {
                    const width =
                      (movie.booking_count /
                        maxMovieBookings) *
                      100;

                    return (
                      <div
                        key={movie.movie_id}
                        className="rounded-xl border border-white/5 bg-black/20 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600/15 text-sm font-bold text-purple-400">
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">
                              {movie.movie_title}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              {formatNumber(
                                movie.booking_count
                              )}{" "}
                              bookings
                            </p>
                          </div>

                          <p className="text-sm font-semibold text-emerald-400">
                            {formatCurrency(
                              movie.revenue
                            )}
                          </p>
                        </div>

                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-purple-500"
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Top Performing Theaters">
            {top_theaters.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-zinc-500">
                      <th className="pb-3 pr-4">
                        Theater
                      </th>

                      <th className="pb-3 pr-4">
                        Bookings
                      </th>

                      <th className="pb-3">
                        Revenue
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {top_theaters.map(
                      (theater) => (
                        <tr
                          key={
                            theater.theater_id
                          }
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="py-4 pr-4">
                            <p className="font-medium text-white">
                              {
                                theater.theater_name
                              }
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              {
                                theater.city_name
                              }
                            </p>
                          </td>

                          <td className="py-4 pr-4 text-zinc-300">
                            {formatNumber(
                              theater.booking_count
                            )}
                          </td>

                          <td className="py-4 font-medium text-emerald-400">
                            {formatCurrency(
                              theater.revenue
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* OCCUPANCY + PEAK HOURS */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SectionCard title="Theater Occupancy">
            {theater_occupancy.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {theater_occupancy.map(
                  (theater) => (
                    <div
                      key={
                        theater.theater_id
                      }
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {
                              theater.theater_name
                            }
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            {
                              theater.city_name
                            }{" "}
                            ·{" "}
                            {formatNumber(
                              theater.occupied_seats
                            )}
                            /
                            {formatNumber(
                              theater.total_seats
                            )}{" "}
                            seats
                          </p>
                        </div>

                        <span className="shrink-0 text-sm font-semibold text-purple-400">
                          {Number(
                            theater.occupancy_percentage ||
                              0
                          ).toFixed(1)}
                          %
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-purple-500"
                          style={{
                            width: `${Math.min(
                              Number(
                                theater.occupancy_percentage ||
                                  0
                              ),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Peak Booking Hours">
            {peak_booking_hours.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {peak_booking_hours.map(
                  (item) => (
                    <div
                      key={item.hour}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Clock3
                          size={17}
                          className="text-purple-400"
                        />

                        <span className="text-sm text-zinc-300">
                          {formatHour(
                            item.hour
                          )}
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-white">
                        {formatNumber(
                          item.booking_count
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </SectionCard>
        </div>

        {/* USER GROWTH */}

        <div className="mt-6">
          <SectionCard title="User Growth">
            {user_growth.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {user_growth.map(
                  (item) => {
                    const value =
                      item.users || 0;

                    const width =
                      (value /
                        maxUserGrowth) *
                      100;

                    return (
                      <div
                        key={item.date}
                      >
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-zinc-500">
                            {formatDate(
                              item.date
                            )}
                          </span>

                          <span className="font-medium text-white">
                            {formatNumber(
                              value
                            )}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </SectionCard>
        </div>

      </div>
    </main>
  );
}