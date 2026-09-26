"use client";

import { useMemo } from "react";
import type { ShowSeat } from "@/lib/types";

interface SeatMapProps {
  seats: ShowSeat[];
  selectedSeatIds: number[];
  onSeatClick: (seat: ShowSeat) => void;
}

function getSeatState(
  seat: ShowSeat,
  selectedSeatIds: number[]
) {
  if (
    selectedSeatIds.includes(seat.id)
  ) {
    return "selected";
  }

  switch (seat.reservation_status) {
    case "BOOKED":
      return "booked";

    case "TEMPORARILY_RESERVED":
      return "reserved";

    case "MY_RESERVATION":
      return "mine";

    default:
      return "available";
  }
}

export default function SeatMap({
  seats,
  selectedSeatIds,
  onSeatClick,
}: SeatMapProps) {
  const groupedSeats = useMemo(() => {
    const groups: Record<
      string,
      ShowSeat[]
    > = {};

    for (const seat of seats) {
      const row =
        seat.seat_label.match(/^[A-Za-z]+/)?.[0] ||
        "A";

      if (!groups[row]) {
        groups[row] = [];
      }

      groups[row].push(seat);
    }

    return groups;
  }, [seats]);

  const rows = Object.entries(
    groupedSeats
  ).sort(([a], [b]) =>
    a.localeCompare(b, undefined, {
      numeric: true,
    })
  );

  function handleSeatClick(
    seat: ShowSeat
  ) {
    const state = getSeatState(
      seat,
      selectedSeatIds
    );

    if (
      state === "booked" ||
      state === "reserved"
    ) {
      return;
    }

    onSeatClick(seat);
  }

  return (
    <div className="space-y-8">
      {/* Screen */}
      <div className="flex flex-col items-center">
        <div className="h-1.5 w-[80%] rounded-full bg-white/70 shadow-[0_0_30px_rgba(255,255,255,0.35)]" />

        <p className="mt-3 text-xs uppercase tracking-[0.35em] text-zinc-600">
          Screen
        </p>
      </div>

      {/* Seats */}
      <div className="overflow-x-auto pb-3">
        <div className="mx-auto min-w-fit space-y-4">
          {rows.map(
            ([rowName, rowSeats]) => (
              <div
                key={rowName}
                className="flex items-center justify-center gap-2 sm:gap-3"
              >
                <span className="w-5 text-center text-xs font-semibold text-zinc-600">
                  {rowName}
                </span>

                <div className="flex gap-2 sm:gap-3">
                  {rowSeats.map(
                    (seat) => {
                      const state =
                        getSeatState(
                          seat,
                          selectedSeatIds
                        );

                      const isMine =
                        state === "mine";

                      const isSelected =
                        state === "selected";

                      const disabled =
                        state ===
                          "booked" ||
                        state ===
                          "reserved";

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            handleSeatClick(
                              seat
                            )
                          }
                          title={`${seat.seat_label} • ₹${Number(
                            seat.price
                          ).toFixed(2)}`}
                          className={[
                            "relative flex h-9 w-9 items-center justify-center rounded-t-lg rounded-b-md border text-[10px] font-semibold transition sm:h-10 sm:w-10",
                            disabled
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer hover:-translate-y-0.5",
                            isSelected
                              ? "border-red-400 bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.35)]"
                              : "",
                            isMine
                              ? "border-yellow-400 bg-yellow-500/20 text-yellow-300"
                              : "",
                            state ===
                            "available"
                              ? "border-white/15 bg-white/[0.06] text-zinc-400 hover:border-green-400 hover:bg-green-500/10 hover:text-green-300"
                              : "",
                            state ===
                            "reserved"
                              ? "border-orange-400/30 bg-orange-500/10 text-orange-300"
                              : "",
                            state ===
                            "booked"
                              ? "border-white/5 bg-zinc-800 text-zinc-600"
                              : "",
                          ].join(" ")}
                        >
                          {seat.seat_label}

                          {seat.remaining_seconds &&
                          seat.remaining_seconds >
                            0 &&
                          state ===
                            "reserved" ? (
                            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] text-orange-400">
                              {Math.ceil(
                                seat.remaining_seconds /
                                  60
                              )}
                              m
                            </span>
                          ) : null}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-zinc-500">
        <Legend
          className="bg-white/[0.06] border-white/15"
          label="Available"
        />

        <Legend
          className="bg-red-600 border-red-400"
          label="Selected"
        />

        <Legend
          className="bg-yellow-500/20 border-yellow-400"
          label="Your reservation"
        />

        <Legend
          className="bg-orange-500/10 border-orange-400/30"
          label="Temporarily reserved"
        />

        <Legend
          className="bg-zinc-800 border-white/5"
          label="Booked"
        />
      </div>
    </div>
  );
}

function Legend({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-4 w-4 rounded-sm border ${className}`}
      />

      <span>{label}</span>
    </div>
  );
}