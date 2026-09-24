"use client";

import { Armchair, Check } from "lucide-react";

import type { ShowSeat } from "@/lib/types";

interface SeatMapProps {
  seats: ShowSeat[];
  selectedSeatIds: number[];
  onSeatToggle: (seat: ShowSeat) => void;
}

interface SeatRow {
  row: string;
  seats: ShowSeat[];
}

export default function SeatMap({
  seats,
  selectedSeatIds,
  onSeatToggle,
}: SeatMapProps) {
  const rows = buildRows(seats);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[650px]">
        <div className="mx-auto mb-10 max-w-2xl">
          <div className="relative h-10 overflow-hidden rounded-[50%] border-t-4 border-zinc-500 bg-gradient-to-b from-white/10 to-transparent">
            <div className="absolute inset-x-16 top-2 text-center text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
              Screen
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {rows.map((row) => (
            <div
              key={row.row}
              className="flex items-center justify-center gap-3"
            >
              <span className="flex w-7 shrink-0 items-center justify-center text-xs font-semibold text-zinc-600">
                {row.row}
              </span>

              <div className="flex items-center gap-2">
                {row.seats.map((seat, index) => {
                  const selected = selectedSeatIds.includes(seat.id);

                  const unavailable =
                    seat.status !== "AVAILABLE";

                  const previousSeat =
                    row.seats[index - 1];

                  const shouldCreateGap =
                    previousSeat &&
                    previousSeat.seat_label.charAt(0) ===
                      seat.seat_label.charAt(0) &&
                    Number(
                      previousSeat.seat_label.slice(1)
                    ) % 5 === 0;

                  return (
                    <div
                      key={seat.id}
                      className={
                        shouldCreateGap
                          ? "ml-4"
                          : undefined
                      }
                    >
                      <SeatButton
                        seat={seat}
                        selected={selected}
                        unavailable={unavailable}
                        onClick={() => onSeatToggle(seat)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SeatButton({
  seat,
  selected,
  unavailable,
  onClick,
}: {
  seat: ShowSeat;
  selected: boolean;
  unavailable: boolean;
  onClick: () => void;
}) {
  if (unavailable) {
    return (
      <button
        type="button"
        disabled
        className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-700"
        title={`${seat.seat_label} unavailable`}
      >
        <Armchair size={17} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-semibold transition duration-200 ${
        selected
          ? "border-red-400 bg-red-600 text-white shadow-lg shadow-red-600/20"
          : "border-white/10 bg-white/[0.04] text-zinc-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-white"
      }`}
      title={`${seat.seat_label} — ₹${Number(
        seat.price
      ).toFixed(0)}`}
    >
      {selected ? (
        <Check size={16} />
      ) : (
        <Armchair size={16} />
      )}

      <span className="absolute -bottom-5 whitespace-nowrap text-[9px] text-zinc-700 opacity-0 transition group-hover:opacity-100">
        {seat.seat_label}
      </span>
    </button>
  );
}

function buildRows(seats: ShowSeat[]): SeatRow[] {
  const rowMap = new Map<string, ShowSeat[]>();

  seats.forEach((seat) => {
    const row = seat.seat_label.charAt(0);

    if (!rowMap.has(row)) {
      rowMap.set(row, []);
    }

    rowMap.get(row)!.push(seat);
  });

  return Array.from(rowMap.entries())
    .sort(([rowA], [rowB]) =>
      rowA.localeCompare(rowB)
    )
    .map(([row, rowSeats]) => ({
      row,
      seats: [...rowSeats].sort(
        (a, b) =>
          extractSeatNumber(a.seat_label) -
          extractSeatNumber(b.seat_label)
      ),
    }));
}

function extractSeatNumber(label: string) {
  const number = Number(label.slice(1));

  return Number.isNaN(number) ? 0 : number;
}