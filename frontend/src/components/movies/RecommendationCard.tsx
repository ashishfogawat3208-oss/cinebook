"use client";

import Link from "next/link";

import type { Movie } from "@/lib/types";

interface RecommendationCardProps {
  movie: Movie;
}

export default function RecommendationCard({
  movie,
}: RecommendationCardProps) {
  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-white/5">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            No poster
          </div>
        )}

        {movie.rating !== null &&
          movie.rating !== undefined && (
            <div className="absolute right-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              ⭐ {Number(movie.rating).toFixed(1)}
            </div>
          )}
      </div>

      <div className="p-4">
        <h3 className="truncate font-semibold text-white">
          {movie.title}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {movie.genres?.slice(0, 2).map((genre) => (
            <span
              key={genre.id}
              className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-gray-400"
            >
              {genre.name}
            </span>
          ))}
        </div>

        {movie.release_date && (
          <p className="mt-3 text-xs text-gray-500">
            {new Date(
              movie.release_date
            ).getFullYear()}
          </p>
        )}
      </div>
    </Link>
  );
}