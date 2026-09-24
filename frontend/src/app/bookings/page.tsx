"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  Ticket,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

import BookingCard from "@/components/booking/BookingCard";
import BookingFilters, {
  type BookingCategory,
} from "@/components/booking/BookingFilters";
import EmptyBookings from "@/components/booking/EmptyBookings";

import {
  getBookings,
} from "@/lib/bookings";

import type { Booking } from "@/lib/types";

export default function BookingsPage() {
  return (
    <ProtectedRoute>
      <BookingsPageContent />
    </ProtectedRoute>
  );
}

function BookingsPageContent() {
  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [activeCategory, setActiveCategory] =
    useState<BookingCategory>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getBookings(
        activeCategory || undefined
      );

      setBookings(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load your bookings."
      );
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(229,9,20,0.12),transparent_45%)]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
                <Ticket size={16} />
                Your Cinema
              </div>

              <h1 className="text-4xl font-bold sm:text-5xl">
                My Bookings
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-500">
                Manage your movie bookings, tickets and payment
                information from one place.
              </p>
            </div>

            {!loading && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs text-zinc-600">
                  Showing
                </p>

                <p className="mt-1 text-lg font-bold">
                  {bookings.length}{" "}
                  {bookings.length === 1
                    ? "booking"
                    : "bookings"}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <BookingFilters
          active={activeCategory}
          onChange={setActiveCategory}
        />

        <div className="mt-8">
          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center">
              <AlertCircle
                size={32}
                className="mx-auto mb-4 text-red-500"
              />

              <h2 className="font-semibold">
                Couldn't load bookings
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                {error}
              </p>

              <button
                onClick={loadBookings}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          ) : loading ? (
            <BookingSkeleton />
          ) : bookings.length === 0 ? (
            <EmptyBookings
              category={activeCategory}
            />
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.booking_id}
                  booking={booking}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function BookingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-52 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}