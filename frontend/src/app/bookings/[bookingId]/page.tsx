"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  MapPin,
  RefreshCw,
  Ticket as TicketIcon,
  XCircle,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { api } from "@/lib/api";
import {
  getBooking,
  getTicket,
} from "@/lib/bookings";
import type {
  Booking,
  Ticket,
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
  const router = useRouter();

  const bookingId = String(
    params.bookingId
  );

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [ticket, setTicket] =
    useState<Ticket | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [ticketLoading, setTicketLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [downloadLoading, setDownloadLoading] =
    useState(false);

  const [downloadError, setDownloadError] =
    useState("");

  /*
   * ==========================================================
   * LOAD BOOKING
   * ==========================================================
   */

  const loadBooking = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getBooking(bookingId);

        setBooking(data);
      } catch (err: any) {
        console.error(
          "Unable to load booking:",
          err
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load this booking."
        );
      } finally {
        setLoading(false);
      }
    },
    [bookingId]
  );

  /*
   * ==========================================================
   * LOAD TICKET
   * ==========================================================
   */

  const loadTicket = useCallback(
    async () => {
      if (!booking) {
        return false;
      }

      if (booking.status !== "CONFIRMED") {
        return false;
      }

      try {
        setTicketLoading(true);

        const data =
          await getTicket(
            booking.booking_id
          );

        if (data) {
          setTicket(data);
          return true;
        }

        return false;
      } catch (err: any) {
        /*
         * Ticket may not exist yet because
         * backend generation happens after
         * successful payment.
         *
         * Do not show an error immediately.
         */
        return false;
      } finally {
        setTicketLoading(false);
      }
    },
    [booking]
  );

  /*
   * ==========================================================
   * INITIAL LOAD
   * ==========================================================
   */

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  /*
   * ==========================================================
   * TICKET POLLING
   * ==========================================================
   *
   * After confirmation, the ticket may take
   * a few seconds to be generated.
   *
   * Poll for up to ~30 seconds.
   * Once available, stop polling.
   */

  useEffect(() => {
    if (
      !booking ||
      booking.status !== "CONFIRMED" ||
      ticket
    ) {
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const MAX_ATTEMPTS = 10;

    const checkTicket = async () => {
      if (cancelled) {
        return;
      }

      attempts += 1;

      try {
        const data =
          await getTicket(
            booking.booking_id
          );

        if (
          data &&
          !cancelled
        ) {
          setTicket(data);
          return;
        }
      } catch {
        /*
         * Ticket is probably still being generated.
         */
      }

      if (
        !cancelled &&
        attempts < MAX_ATTEMPTS
      ) {
        window.setTimeout(
          checkTicket,
          3000
        );
      }
    };

    checkTicket();

    return () => {
      cancelled = true;
    };
  }, [booking, ticket]);

  /*
   * ==========================================================
   * DOWNLOAD TICKET
   * ==========================================================
   */

  const handleDownloadTicket =
    async () => {
      if (!booking) {
        return;
      }

      if (
        !booking.ticket_download_url
      ) {
        setDownloadError(
          "The ticket PDF is not available yet."
        );

        return;
      }

      try {
        setDownloadLoading(true);
        setDownloadError("");

        const response =
          await api.get(
            booking.ticket_download_url,
            {
              responseType: "blob",
            }
          );

        const contentType =
          typeof response.headers[
            "content-type"
          ] === "string"
            ? response.headers[
                "content-type"
              ]
            : "application/pdf";

        const blob =
          new Blob(
            [response.data],
            {
              type: contentType,
            }
          );

        const url =
          window.URL.createObjectURL(
            blob
          );

        const link =
          document.createElement("a");

        link.href = url;

        link.download =
          `movie-ticket-${booking.booking_id}.pdf`;

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
          url
        );
      } catch (err: any) {
        console.error(
          "Ticket download failed:",
          err
        );

        if (
          err?.response?.status === 401
        ) {
          setDownloadError(
            "Your session has expired. Please log in again."
          );
        } else {
          setDownloadError(
            "Unable to download the ticket. Please try again."
          );
        }
      } finally {
        setDownloadLoading(false);
      }
    };

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

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

  /*
   * ==========================================================
   * NOT FOUND
   * ==========================================================
   */

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="flex min-h-[75vh] items-center justify-center px-5">
          <div className="max-w-md text-center">
            <XCircle
              size={52}
              className="mx-auto text-red-500"
            />

            <h1 className="mt-6 text-2xl font-bold">
              Booking not found
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {error ||
                "We couldn't find this booking."}
            </p>

            <Link
              href="/bookings"
              className="mt-7 inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ==========================================================
   * PENDING
   * ==========================================================
   */

  if (booking.status === "PENDING") {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <section className="border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
          <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
            <Link
              href="/bookings"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              My bookings
            </Link>

            <h1 className="mt-5 text-3xl font-bold">
              Complete your booking
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              Your seats are reserved. Complete
              payment before the booking expires.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
          <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/[0.03] p-8 text-center sm:p-12">
            <Clock
              size={54}
              className="mx-auto text-yellow-500"
            />

            <h2 className="mt-6 text-2xl font-bold">
              Payment pending
            </h2>

            <p className="mt-3 text-sm leading-7 text-zinc-500">
              Your selected seats are still
              reserved. Continue to payment to
              complete the booking.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={`/payment/${booking.booking_id}`}
                className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold transition hover:bg-red-700"
              >
                Complete Payment
              </Link>

              <Link
                href="/bookings"
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                My Bookings
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /*
   * ==========================================================
   * CANCELLED / FAILED / EXPIRED
   * ==========================================================
   */

  if (
    booking.status === "CANCELLED" ||
    booking.status === "FAILED" ||
    booking.status === "EXPIRED"
  ) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="mx-auto flex min-h-[75vh] max-w-2xl items-center justify-center px-5 py-16">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center sm:p-12">
            <XCircle
              size={56}
              className="mx-auto text-red-500"
            />

            <h1 className="mt-6 text-3xl font-bold">
              {booking.status ===
              "EXPIRED"
                ? "Booking expired"
                : booking.status ===
                  "FAILED"
                ? "Payment failed"
                : "Booking cancelled"}
            </h1>

            <p className="mt-4 text-sm leading-7 text-zinc-500">
              This booking is no longer active.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/movies"
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
              >
                Browse Movies
              </Link>

              <Link
                href="/bookings"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                My Bookings
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ==========================================================
   * CONFIRMED BOOKING
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-green-500/[0.05] to-transparent">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            My bookings
          </Link>

          <div className="mt-6 flex items-center gap-3">
            <CheckCircle2
              size={30}
              className="text-green-500"
            />

            <div>
              <h1 className="text-3xl font-bold">
                Booking confirmed
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                Your payment was successful.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* BOOKING INFORMATION */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-600">
                  Movie
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {booking.movie_title}
                </h2>
              </div>

              <CheckCircle2
                size={24}
                className="shrink-0 text-green-500"
              />
            </div>

            <div className="my-6 h-px bg-white/10" />

            <div className="grid gap-5 sm:grid-cols-2">
              <InfoItem
                icon={
                  <MapPin size={16} />
                }
                label="Theater"
                value={`${booking.theater_name}, ${booking.city_name}`}
              />

              <InfoItem
                icon={
                  <CalendarDays size={16} />
                }
                label="Show date"
                value={formatDate(
                  booking.show_time
                )}
              />

              <InfoItem
                icon={
                  <Clock size={16} />
                }
                label="Show time"
                value={formatTime(
                  booking.show_time
                )}
              />

              <InfoItem
                icon={
                  <TicketIcon size={16} />
                }
                label="Booking ID"
                value={booking.booking_id}
              />
            </div>

            <div className="my-6 h-px bg-white/10" />

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-600">
                Seats
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {booking.booking_seats.map(
                  (seat) => (
                    <span
                      key={seat.id}
                      className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300"
                    >
                      {seat.seat_label}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* TICKET */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                <TicketIcon
                  size={19}
                  className="text-green-500"
                />
              </div>

              <div>
                <h2 className="font-semibold">
                  Digital Ticket
                </h2>

                <p className="text-xs text-zinc-600">
                  Your ticket PDF
                </p>
              </div>
            </div>

            <div className="my-6 h-px bg-white/10" />

            {ticket ? (
              <>
                <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-400">
                    <CheckCircle2 size={16} />
                    Ticket ready
                  </div>

                  {ticket.ticket_number && (
                    <p className="mt-2 text-xs text-zinc-600">
                      Ticket #
                      {ticket.ticket_number}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={
                    handleDownloadTicket
                  }
                  disabled={
                    downloadLoading
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadLoading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download size={17} />
                      Download Ticket
                    </>
                  )}
                </button>

                {downloadError && (
                  <p className="mt-3 text-center text-xs text-red-400">
                    {downloadError}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Loader2
                      size={16}
                      className="animate-spin text-red-500"
                    />

                    Generating your ticket...
                  </div>

                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    Your booking is confirmed. The
                    ticket PDF is being generated and
                    will appear here automatically.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const found =
                      await loadTicket();

                    if (!found) {
                      setError(
                        "The ticket is still being generated. Please try again in a few seconds."
                      );
                    }
                  }}
                  disabled={ticketLoading}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ticketLoading ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Check for Ticket
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/bookings"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            My Bookings
          </Link>

          <Link
            href="/movies"
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
          >
            Browse More Movies
          </Link>
        </div>
      </section>
    </main>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-zinc-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-zinc-600">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-zinc-300">
          {value}
        </p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );
}