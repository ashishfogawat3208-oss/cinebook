"use client";

import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Play,
  Star,
} from "lucide-react";

import type { Movie } from "@/lib/types";

interface MovieHeroProps {
  movie: Movie;
}

export default function MovieHero({
  movie,
}: MovieHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0">
        {movie.poster && (
          <img
            src={movie.poster}
            alt=""
            className="h-full w-full object-cover opacity-20 blur-2xl"
          />
        )}

        <div className="absolute inset-0 bg-[#050505]/90" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#050505_10%,transparent_60%,#050505_100%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href="/movies"
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
        >
          ← Back to movies
        </Link>

        <div className="grid gap-10 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            {movie.poster ? (
              <img
                src={movie.poster}
                alt={movie.title}
                className="aspect-[2/3] h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center">
                <span className="text-5xl">🎬</span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-4 flex flex-wrap gap-2">
              {movie.genres?.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {movie.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
              {movie.rating !== undefined &&
                movie.rating !== null && (
                  <span className="flex items-center gap-1.5 font-semibold text-white">
                    <Star
                      size={17}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    {Number(movie.rating).toFixed(1)}
                  </span>
                )}

              {movie.duration_minutes && (
                <span className="flex items-center gap-1.5">
                  <Clock size={16} />
                  {formatDuration(movie.duration_minutes)}
                </span>
              )}

              {movie.release_date && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={16} />
                  {formatDate(movie.release_date)}
                </span>
              )}
            </div>

            {movie.languages &&
              movie.languages.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {movie.languages.map((language) => (
                    <span
                      key={language.id}
                      className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-zinc-400"
                    >
                      {language.name}
                    </span>
                  ))}
                </div>
              )}

            {movie.description && (
              <p className="mt-7 max-w-3xl text-base leading-8 text-zinc-400">
                {movie.description}
              </p>
            )}

            {movie.trailer_url && (
              <div className="mt-8">
                <a
                  href={movie.trailer_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
                >
                  <Play size={16} />
                  Watch Trailer
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remaining}m`;
}