"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  MapPin,
} from "lucide-react";
import { useState } from "react";

import type { Booking } from "@/lib/types";

import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { api } from "@/lib/api";

interface BookingCardProps {
  booking: Booking;
}

export default function BookingCard({
  booking,
}: BookingCardProps) {
  const isConfirmed =
    booking.status === "CONFIRMED";

  const [downloadLoading, setDownloadLoading] =
    useState(false);

  const [downloadError, setDownloadError] =
    useState("");

  const handleDownloadTicket = async () => {
    if (!booking.ticket_download_url) {
      return;
    }

    try {
      setDownloadLoading(true);
      setDownloadError("");

      const response = await api.get(
        booking.ticket_download_url,
        {
          responseType: "blob",
        }
      );

      const contentType =
        typeof response.headers["content-type"] ===
        "string"
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
        `movie-ticket-${booking.booking_id}.pdf`;

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

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/15">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3">
              <BookingStatusBadge
                status={booking.status}
                category={booking.booking_category}
              />
            </div>

            <h3 className="truncate text-xl font-bold">
              {booking.movie_title}
            </h3>

            <div className="mt-3 space-y-2 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <MapPin size={14} />

                <span>
                  {booking.theater_name},{" "}
                  {booking.city_name}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <span className="flex items-center gap-2">
                  <CalendarDays size={14} />

                  {formatDate(
                    booking.show_time
                  )}
                </span>

                <span className="flex items-center gap-2">
                  <Clock size={14} />

                  {formatTime(
                    booking.show_time
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-xs uppercase tracking-wide text-zinc-600">
              Total
            </p>

            <p className="mt-1 text-xl font-bold">
              ₹
              {Number(
                booking.total_amount
              ).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="my-5 h-px bg-white/10" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-600">
              Seats
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {booking.booking_seats.map(
                (seat) => (
                  <span
                    key={seat.id}
                    className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-zinc-400"
                  >
                    {seat.seat_label}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isConfirmed &&
              booking.ticket_download_url && (
                <button
                  type="button"
                  onClick={
                    handleDownloadTicket
                  }
                  disabled={downloadLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {downloadLoading ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download
                        size={14}
                      />
                      Ticket
                    </>
                  )}
                </button>
              )}

            {booking.status === "PENDING" && (
              <Link
                href={`/payment/${booking.booking_id}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold transition hover:bg-red-700"
              >
                Complete Payment
              </Link>
            )}

            <Link
              href={`/bookings/${booking.booking_id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-semibold transition hover:bg-white/10"
            >
              View Details
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {downloadError && (
          <p className="mt-3 text-right text-xs text-red-400">
            {downloadError}
          </p>
        )}
      </div>

      {isConfirmed &&
        booking.ticket_number && (
          <div className="border-t border-white/10 bg-green-500/[0.02] px-5 py-3 text-xs text-zinc-600 sm:px-6">
            Ticket #{booking.ticket_number}
          </div>
        )}
    </article>
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