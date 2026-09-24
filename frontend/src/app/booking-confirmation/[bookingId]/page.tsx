"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Download,
  Home,
  Loader2,
  Mail,
  RefreshCw,
  Ticket,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

import { getBooking, getTicket } from "@/lib/bookings";

import { api } from "@/lib/api";

import type {
  Booking,
  Ticket as TicketType,
} from "@/lib/types";

export default function BookingConfirmationPage() {
  return (
    <ProtectedRoute>
      <BookingConfirmationContent />
    </ProtectedRoute>
  );
}

function BookingConfirmationContent() {
  const params = useParams();

  const bookingId = String(params.bookingId);

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [ticket, setTicket] =
    useState<TicketType | null>(null);

  const [loading, setLoading] = useState(true);

  const [ticketLoading, setTicketLoading] =
    useState(true);

  const [downloadLoading, setDownloadLoading] =
    useState(false);

  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const bookingData =
        await getBooking(bookingId);

      setBooking(bookingData);

      if (bookingData.status === "CONFIRMED") {
        try {
          const ticketData =
            await getTicket(bookingId);

          setTicket(ticketData);
        } catch {
          setTicket(null);
        } finally {
          setTicketLoading(false);
        }
      } else {
        setTicketLoading(false);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load your booking."
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /*
   * Ticket generation happens asynchronously through Celery.
   * Poll for the ticket while the booking is confirmed.
   */
  useEffect(() => {
    if (
      !booking ||
      booking.status !== "CONFIRMED" ||
      ticket
    ) {
      return;
    }

    let active = true;

    const pollTicket = async () => {
      try {
        const ticketData =
          await getTicket(bookingId);

        if (active) {
          setTicket(ticketData);
          setTicketLoading(false);
        }
      } catch {
        // Ticket may still be generating.
      }
    };

    const interval = window.setInterval(
      pollTicket,
      3000
    );

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [booking, bookingId, ticket]);

  /*
   * Download the PDF through Axios instead of a normal
   * <a href=""> navigation.
   *
   * Axios uses the interceptor in lib/api.ts, which adds:
   *
   * Authorization: Bearer <access_token>
   */
  const handleDownloadTicket = async () => {
    const currentBooking = booking;

    if (
      !currentBooking ||
      !currentBooking.ticket_download_url
    ) {
      return;
    }

    try {
      setDownloadLoading(true);

      const response = await api.get(
        currentBooking.ticket_download_url,
        {
          responseType: "blob",
        }
      );

      const contentType =
        typeof response.headers["content-type"] === "string"
          ? response.headers["content-type"]
          : "application/pdf";

      const blob = new Blob(
        [response.data],
        {
          type: contentType,
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `movie-ticket-${currentBooking.booking_id}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(
        "Ticket download failed:",
        err
      );

      if (
        err?.response?.status === 401
      ) {
        setError(
          "Your session has expired. Please log in again and try downloading the ticket."
        );
      } else {
        setError(
          "Unable to download your ticket. Please try again."
        );
      }
    } finally {
      setDownloadLoading(false);
    }
  };

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
              Loading your booking...
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

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {error ||
                "We couldn't load this booking."}
            </p>

            <Link
              href="/movies"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold"
            >
              Browse Movies
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (booking.status !== "CONFIRMED") {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="flex min-h-[75vh] items-center justify-center px-5">
          <div className="max-w-lg text-center">
            <h1 className="text-3xl font-bold">
              Booking status: {booking.status}
            </h1>

            <p className="mt-4 text-sm leading-7 text-zinc-500">
              This booking has not reached the confirmed
              state.
            </p>

            <Link
              href="/movies"
              className="mt-7 inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold"
            >
              Browse Movies
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2
              size={44}
              className="text-green-500"
            />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-green-500">
            Booking Confirmed
          </p>

          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            You're going to the movies!
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-500">
            Your payment was successful and your seats have
            been reserved.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="border-b border-white/10 p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-600">
                  Movie
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {booking.movie_title}
                </h2>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs uppercase tracking-wide text-zinc-600">
                  Booking ID
                </p>

                <p className="mt-2 break-all font-mono text-sm text-zinc-400">
                  {booking.booking_id}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <Detail
              label="Theater"
              value={`${booking.theater_name}, ${booking.city_name}`}
            />

            <Detail
              label="Screen"
              value={booking.screen_name}
            />

            <Detail
              label="Show"
              value={formatDateTime(
                booking.show_time
              )}
            />

            <Detail
              label="Seats"
              value={booking.booking_seats
                .map((seat) => seat.seat_label)
                .join(", ")}
            />

            <Detail
              label="Payment"
              value={
                booking.payment?.payment_reference ||
                "Confirmed"
              }
            />

            <Detail
              label="Total"
              value={`₹${Number(
                booking.total_amount
              ).toFixed(2)}`}
            />
          </div>

          <div className="border-t border-white/10 p-6 sm:p-8">
            {ticketLoading && !ticket ? (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-sm text-yellow-500">
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Generating your digital ticket...
              </div>
            ) : ticket ? (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-green-500">
                      <Ticket size={18} />

                      <span className="font-semibold">
                        Digital ticket ready
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-zinc-500">
                      Ticket #{ticket.ticket_number}
                    </p>
                  </div>

                  {booking.ticket_download_url && (
                    <button
                      type="button"
                      onClick={
                        handleDownloadTicket
                      }
                      disabled={
                        downloadLoading
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadLoading ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download
                            size={16}
                          />
                          Download Ticket
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                <div className="flex items-start gap-3">
                  <Clock3
                    size={18}
                    className="mt-0.5 text-yellow-500"
                  />

                  <div>
                    <p className="font-semibold text-yellow-500">
                      Ticket is being generated
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      Your booking is confirmed. The PDF
                      ticket will appear here shortly.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/bookings"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold transition hover:bg-white/10"
          >
            <Ticket size={16} />
            My Bookings
          </Link>

          <Link
            href="/movies"
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-semibold transition hover:bg-red-700"
          >
            <Home size={16} />
            Browse More Movies
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-700">
          <Mail size={14} />
          Your ticket email is processed asynchronously.
        </div>
      </section>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}