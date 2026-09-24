"use client";

import Link from "next/link";

import type { Movie } from "@/lib/types";

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({
  movie,
}: MovieCardProps) {
  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-white/5">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-950 to-black px-4 text-center">
            <span className="text-sm text-gray-500">
              No poster available
            </span>
          </div>
        )}

        {movie.rating !== null &&
          movie.rating !== undefined && (
            <div className="absolute right-3 top-3 rounded-full bg-black/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              ⭐ {Number(movie.rating).toFixed(1)}
            </div>
          )}

        {movie.lowest_ticket_price !== null &&
          movie.lowest_ticket_price !== undefined && (
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              From ₹
              {Number(
                movie.lowest_ticket_price
              ).toFixed(0)}
            </div>
          )}
      </div>

      <div className="p-4">
        <h2 className="truncate text-base font-semibold text-white">
          {movie.title}
        </h2>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {movie.genres
            ?.slice(0, 2)
            .map((genre) => (
              <span
                key={genre.id}
                className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-gray-400"
              >
                {genre.name}
              </span>
            ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-gray-500">
          <span>
            {movie.release_date
              ? new Date(
                  movie.release_date
                ).getFullYear()
              : "Release date N/A"}
          </span>

          {movie.duration_minutes && (
            <span>
              {movie.duration_minutes} min
            </span>
          )}
        </div>

        {movie.matching_count !== undefined && (
          <div className="mt-3 border-t border-white/5 pt-3 text-xs text-gray-500">
            {movie.matching_count} matching show
            {movie.matching_count === 1
              ? ""
              : "s"}
          </div>
        )}
      </div>
    </Link>
  );
}