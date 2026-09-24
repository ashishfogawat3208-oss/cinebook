"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import SeatMap from "@/components/booking/SeatMap";
import SeatLegend from "@/components/booking/SeatLegend";
import BookingSummary from "@/components/booking/BookingSummary";

import {
  createBooking,
  getShowSeats,
} from "@/lib/bookings";

import type { ShowSeat } from "@/lib/types";

interface ShowData {
  show_id: number;
  movie_id: number;
  start_time: string;
  ticket_price: number;
  seats: ShowSeat[];
}

export default function BookingPage() {
  return (
    <ProtectedRoute>
      <BookingPageContent />
    </ProtectedRoute>
  );
}

function BookingPageContent() {
  const params = useParams();
  const router = useRouter();

  const showId = Number(params.showId);

  const [showData, setShowData] =
    useState<ShowData | null>(null);

  const [selectedSeatIds, setSelectedSeatIds] =
    useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [creatingBooking, setCreatingBooking] =
    useState(false);

  const [error, setError] = useState("");

  const loadSeats = useCallback(async () => {
    if (!showId || Number.isNaN(showId)) {
      setError("Invalid show.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getShowSeats(showId);

      setShowData(data);
      setSelectedSeatIds([]);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load the seats for this show."
      );
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    loadSeats();
  }, [loadSeats]);

  const selectedSeats = useMemo(() => {
    if (!showData) {
      return [];
    }

    return showData.seats.filter((seat) =>
      selectedSeatIds.includes(seat.id)
    );
  }, [showData, selectedSeatIds]);

  const totalAmount = useMemo(() => {
    return selectedSeats.reduce(
      (total, seat) => total + Number(seat.price),
      0
    );
  }, [selectedSeats]);

  const handleSeatToggle = (seat: ShowSeat) => {
    if (seat.status !== "AVAILABLE") {
      return;
    }

    setSelectedSeatIds((current) => {
      if (current.includes(seat.id)) {
        return current.filter(
          (id) => id !== seat.id
        );
      }

      if (current.length >= 10) {
        setError(
          "You can select a maximum of 10 seats per booking."
        );

        return current;
      }

      setError("");

      return [...current, seat.id];
    });
  };

  const handleContinue = async () => {
    if (!selectedSeatIds.length) {
      setError("Please select at least one seat.");
      return;
    }

    try {
      setCreatingBooking(true);
      setError("");

      const booking = await createBooking({
        show_id: showId,
        show_seat_ids: selectedSeatIds,
      });

      router.push(
        `/payment/${booking.booking_id}`
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Unable to create your booking. The selected seats may no longer be available.";

      setError(message);

      await loadSeats();
    } finally {
      setCreatingBooking(false);
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
              Loading cinema seats...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !showData) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="flex min-h-[75vh] items-center justify-center px-5">
          <div className="max-w-md text-center">
            <AlertCircle
              size={42}
              className="mx-auto mb-5 text-red-500"
            />

            <h1 className="text-2xl font-bold">
              Seats unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {error}
            </p>

            <button
              type="button"
              onClick={loadSeats}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!showData) {
    return null;
  }

  const availableSeats = showData.seats.filter(
    (seat) => seat.status === "AVAILABLE"
  ).length;

  const formattedTime = formatDateTime(
    showData.start_time
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(229,9,20,0.12),transparent_45%)]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <Link
            href={`/movies/${showData.movie_id}`}
            className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to movie
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
                Seat Selection
              </p>

              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Choose your seats
              </h1>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-500">
                <span className="flex items-center gap-2">
                  <CalendarDays size={15} />
                  {formattedTime.date}
                </span>

                <span className="flex items-center gap-2">
                  <Clock size={15} />
                  {formattedTime.time}
                </span>

                <span className="flex items-center gap-2">
                  <Users size={15} />
                  {availableSeats} available
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-zinc-600">
                Ticket price
              </p>

              <p className="mt-1 text-lg font-bold">
                ₹{Number(showData.ticket_price).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_330px]">
          <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-8">
            <div className="mb-10">
              <SeatLegend />
            </div>

            <SeatMap
              seats={showData.seats}
              selectedSeatIds={selectedSeatIds}
              onSeatToggle={handleSeatToggle}
            />

            <div className="mt-12 text-center">
              <p className="text-xs text-zinc-600">
                Tap a seat to select or deselect it.
              </p>

              <p className="mt-2 text-xs text-zinc-700">
                Maximum 10 seats per booking.
              </p>
            </div>
          </div>

          <BookingSummary
            selectedSeats={selectedSeats.map(
              (seat) => seat.seat_label
            )}
            totalAmount={totalAmount}
            remainingSeats={availableSeats}
            loading={creatingBooking}
            onContinue={handleContinue}
          />
        </div>
      </section>
    </main>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      date: value,
      time: "",
    };
  }

  return {
    date: date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}