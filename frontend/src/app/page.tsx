"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Film,
  MapPin,
  Search,
  Ticket,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen bg-[#050505] text-white">

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(229,9,20,0.3),transparent_45%)]" />

        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-24 sm:px-8 lg:pb-32 lg:pt-32">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              <Film size={16} />
              Your cinema experience starts here
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
              Find your next
              <span className="block text-red-600">
                great movie.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
              Discover movies, compare showtimes, explore theaters,
              choose your seats and book everything from one place.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/movies"
                className="group flex items-center justify-center gap-2 rounded-xl bg-red-600 px-7 py-4 font-semibold transition hover:bg-red-700"
              >
                Explore Movies

                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              {!isAuthenticated && (
                <Link
                  href="/register"
                  className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 py-4 font-semibold transition hover:bg-white/10"
                >
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl gap-px sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={<Search size={22} />}
            title="Discover"
            description="Search and filter movies exactly the way you want."
          />

          <Feature
            icon={<MapPin size={22} />}
            title="Find Shows"
            description="Explore cinemas, theaters and available showtimes."
          />

          <Feature
            icon={<CalendarDays size={22} />}
            title="Choose Seats"
            description="Pick your preferred seats from the cinema layout."
          />

          <Feature
            icon={<Ticket size={22} />}
            title="Get Your Ticket"
            description="Receive your digital ticket with a secure QR code."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
              Discover
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              Movies made for your mood.
            </h2>

            <p className="mt-4 leading-7 text-zinc-400">
              Search by title, genre, language, rating, city,
              theater, price and showtime.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
              Book
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              Your seat. Your choice.
            </h2>

            <p className="mt-4 leading-7 text-zinc-400">
              See live seat availability and reserve the seats
              you actually want.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
              Experience
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              Everything after booking.
            </h2>

            <p className="mt-4 leading-7 text-zinc-400">
              Access your bookings, payment references, downloadable
              tickets and QR verification.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-zinc-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} CineBook. All rights reserved.
          </p>

          <Link
            href="/movies"
            className="text-zinc-400 transition hover:text-white"
          >
            Browse Movies →
          </Link>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[#050505] p-8">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/10 text-red-500">
        {icon}
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        {description}
      </p>
    </div>
  );
}