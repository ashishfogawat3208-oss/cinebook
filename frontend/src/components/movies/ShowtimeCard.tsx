"use client";

import Link from "next/link";
import {
  Clock,
  MapPin,
  MonitorPlay,
  Users,
} from "lucide-react";

import type { Show } from "@/lib/types";

interface ShowtimeCardProps {
  show: Show;
}

export default function ShowtimeCard({
  show,
}: ShowtimeCardProps) {
  const availableSeats = show.available_seats ?? 0;

  return (
    <Link
      href={`/booking/${show.id}`}
      className="group block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-red-500/30 hover:bg-white/[0.05]"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <MapPin size={13} />

            <span>
              {show.city_name || "City"}
            </span>

            <span>•</span>

            <span>
              {show.theater_name || "Theater"}
            </span>
          </div>

          <h3 className="mt-2 text-lg font-semibold">
            {show.theater_name || "Theater"}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <MonitorPlay size={13} />
              {show.screen_name || "Screen"}
            </span>

            <span className="flex items-center gap-1.5">
              <Users size={13} />

              {availableSeats} seats available
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <Clock
                size={18}
                className="text-red-500"
              />

              {formatTime(show.start_time)}
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              ₹{Number(show.ticket_price).toFixed(0)} per seat
            </p>
          </div>

          <span className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold transition group-hover:bg-red-700">
            Select
          </span>
        </div>
      </div>
    </Link>
  );
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