import Link from "next/link";
import { Film, Ticket } from "lucide-react";

interface EmptyBookingsProps {
  category: string;
}

export default function EmptyBookings({
  category,
}: EmptyBookingsProps) {
  const categoryText =
    category === "upcoming"
      ? "upcoming"
      : category === "completed"
      ? "completed"
      : category === "pending"
      ? "pending"
      : category === "failed"
      ? "failed"
      : category === "expired"
      ? "expired"
      : category === "cancelled"
      ? "cancelled"
      : "";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
        {categoryText ? (
          <Ticket
            size={28}
            className="text-zinc-600"
          />
        ) : (
          <Film
            size={28}
            className="text-zinc-600"
          />
        )}
      </div>

      <h2 className="mt-5 text-xl font-bold">
        {categoryText
          ? `No ${categoryText} bookings`
          : "No bookings yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {categoryText
          ? `You don't have any ${categoryText} bookings right now.`
          : "Your movie adventures will appear here after you make your first booking."}
      </p>

      <Link
        href="/movies"
        className="mt-6 inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
      >
        Explore Movies
      </Link>
    </div>
  );
}