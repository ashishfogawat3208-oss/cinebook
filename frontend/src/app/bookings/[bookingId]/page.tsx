"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  MapPin,
  RefreshCw,
  Ticket,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

import BookingStatusBadge from "@/components/booking/BookingStatusBadge";

import {
  getBooking,
  getTicket,
} from "@/lib/bookings";

import type {
  Booking,
  Ticket as TicketType,
} from "@/lib/types";

export default function BookingDetailsPage() {
  return (
    <ProtectedRoute>
      <BookingDetailsContent />
    </ProtectedRoute>
  );
}

function BookingDetailsContent() {
  const params = useParams();

  const bookingId = String(params.bookingId);

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [ticket, setTicket] =
    useState<TicketType | null>(null);

  const [loading, setLoading] = useState(true);
  const [ticketLoading, setTicketLoading] =
    useState(false);

  const [error, setError] = useState("");

  const loadBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getBooking(bookingId);

      setBooking(data);

      if (
        data.status === "CONFIRMED" &&
        data.ticket_number
      ) {
        try {
          setTicketLoading(true);

          const ticketData =
            await getTicket(bookingId);

          setTicket(ticketData);
        } catch {
          setTicket(null);
        } finally {
          setTicketLoading(false);
        }
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load this booking."
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">

        <div className="flex min-h-[75vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-zinc-500">
            <Loader2
              size={32}
              className="animate-spin text-red-500"
            />

            <p className="text-sm">
              Loading booking...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!booking || error) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">

        <div className="flex min-h-[75vh] items-center justify-center px-5">
          <div className="max-w-md text-center">
            <RefreshCw
              size={40}
              className="mx-auto mb-5 text-red-500"
            />

            <h1 className="text-2xl font-bold">
              Booking unavailable
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              {error ||
                "We couldn't find this booking."}
            </p>

            <Link
              href="/bookings"
              className="mt-6 inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isConfirmed =
    booking.status === "CONFIRMED";

  return (
    <main className="min-h-screen bg-[#050505] text-white">

      <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to bookings
        </Link>

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-red-500">
              Booking details
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              {booking.movie_title}
            </h1>

            <p className="mt-3 font-mono text-xs text-zinc-600">
              {booking.booking_id}
            </p>
          </div>

          <BookingStatusBadge
            status={booking.status}
            category={booking.booking_category}
          />
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <Detail
              icon={<MapPin size={16} />}
              label="Theater"
              value={`${booking.theater_name}, ${booking.city_name}`}
            />

            <Detail
              icon={<Ticket size={16} />}
              label="Screen"
              value={booking.screen_name}
            />

            <Detail
              icon={<CalendarDays size={16} />}
              label="Date"
              value={formatDate(booking.show_time)}
            />

            <Detail
              icon={<Clock size={16} />}
              label="Time"
              value={formatTime(booking.show_time)}
            />
          </div>

          <div className="border-t border-white/10 p-6 sm:p-8">
            <p className="text-xs uppercase tracking-wide text-zinc-600">
              Seats
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {booking.booking_seats.map((seat) => (
                <span
                  key={seat.id}
                  className="rounded-lg bg-red-600/10 px-3 py-2 text-sm font-semibold text-red-400"
                >
                  {seat.seat_label}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <Detail
                label="Total amount"
                value={`₹${Number(
                  booking.total_amount
                ).toFixed(2)}`}
              />

              <Detail
                label="Payment reference"
                value={
                  booking.payment
                    ?.payment_reference ||
                  "Not available"
                }
              />

              <Detail
                label="Booking created"
                value={formatDateTime(
                  booking.created_at
                )}
              />

              <Detail
                label="Ticket number"
                value={
                  booking.ticket_number ||
                  "Ticket not generated yet"
                }
              />
            </div>
          </div>

          {isConfirmed && (
            <div className="border-t border-white/10 p-6 sm:p-8">
              {ticketLoading ? (
                <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-500">
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                  Loading ticket...
                </div>
              ) : ticket ? (
                <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle2 size={18} />

                        <span className="font-semibold">
                          Ticket ready
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-zinc-600">
                        Ticket #{ticket.ticket_number}
                      </p>
                    </div>

                    {booking.ticket_download_url && (
                      <a
                        href={
                          booking.ticket_download_url
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
                      >
                        <Download size={16} />
                        Download PDF
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-500">
                  Your ticket is still being generated.
                  Refresh this page shortly.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {booking.status === "PENDING" && (
            <Link
              href={`/payment/${booking.booking_id}`}
              className="flex flex-1 items-center justify-center rounded-xl bg-red-600 px-5 py-3.5 text-sm font-semibold transition hover:bg-red-700"
            >
              Complete Payment
            </Link>
          )}

          <Link
            href="/movies"
            className="flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold transition hover:bg-white/10"
          >
            Browse Movies
          </Link>
        </div>
      </section>
    </main>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-600">
        {icon}
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}