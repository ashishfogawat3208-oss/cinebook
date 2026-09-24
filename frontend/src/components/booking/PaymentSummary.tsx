import {
  CalendarDays,
  Clock,
  MapPin,
  Ticket,
} from "lucide-react";

import type { Booking } from "@/lib/types";

interface PaymentSummaryProps {
  booking: Booking;
}

export default function PaymentSummary({
  booking,
}: PaymentSummaryProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/10 text-red-500">
          <Ticket size={19} />
        </div>

        <div>
          <h2 className="font-semibold">
            Booking summary
          </h2>

          <p className="text-xs text-zinc-600">
            Review everything before payment
          </p>
        </div>
      </div>

      <div className="my-5 h-px bg-white/10" />

      <h3 className="text-lg font-bold">
        {booking.movie_title}
      </h3>

      <div className="mt-4 space-y-3 text-sm">
        <InfoRow
          icon={<MapPin size={15} />}
          value={`${booking.theater_name}, ${booking.city_name}`}
        />

        <InfoRow
          icon={<CalendarDays size={15} />}
          value={formatDate(booking.show_time)}
        />

        <InfoRow
          icon={<Clock size={15} />}
          value={formatTime(booking.show_time)}
        />
      </div>

      <div className="my-5 h-px bg-white/10" />

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-600">
          Selected seats
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {booking.booking_seats.map((seat) => (
            <span
              key={seat.id}
              className="rounded-lg bg-red-600/10 px-3 py-1.5 text-sm font-semibold text-red-400"
            >
              {seat.seat_label}
            </span>
          ))}
        </div>
      </div>

      <div className="my-5 h-px bg-white/10" />

      <div className="flex items-end justify-between">
        <span className="text-sm text-zinc-500">
          Total amount
        </span>

        <span className="text-2xl font-bold">
          ₹{Number(booking.total_amount).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-zinc-400">
      <span className="text-zinc-600">{icon}</span>
      <span>{value}</span>
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