"use client";

import {
  ArrowRight,
  Clock3,
  Ticket,
} from "lucide-react";

interface BookingSummaryProps {
  selectedSeats: string[];
  totalAmount: number;
  remainingSeats: number;
  loading: boolean;
  onContinue: () => void;
}

export default function BookingSummary({
  selectedSeats,
  totalAmount,
  remainingSeats,
  loading,
  onContinue,
}: BookingSummaryProps) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:sticky lg:top-24">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-500">
          <Ticket size={19} />
        </div>

        <div>
          <h2 className="font-semibold">
            Your booking
          </h2>

          <p className="text-xs text-zinc-600">
            Review your selected seats
          </p>
        </div>
      </div>

      <div className="my-6 h-px bg-white/10" />

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
          Selected seats
        </p>

        {selectedSeats.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">
            No seats selected yet.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedSeats.map((seat) => (
              <span
                key={seat}
                className="rounded-lg bg-red-600/10 px-3 py-1.5 text-sm font-semibold text-red-400"
              >
                {seat}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="my-6 h-px bg-white/10" />

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Seats
          </span>

          <span className="font-medium">
            {selectedSeats.length}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Total
          </span>

          <span className="text-xl font-bold">
            ₹{totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl bg-yellow-500/5 px-3 py-3 text-xs text-yellow-600">
        <Clock3 size={14} />

        Seats will be held for 15 minutes after booking.
      </div>

      <button
        type="button"
        disabled={
          selectedSeats.length === 0 ||
          loading ||
          remainingSeats <= 0
        }
        onClick={onContinue}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          "Creating booking..."
        ) : (
          <>
            Continue to Payment
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </aside>
  );
}