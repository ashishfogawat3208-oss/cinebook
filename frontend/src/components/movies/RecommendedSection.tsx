"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getRecommendedMovies } from "@/lib/movies";
import type { Movie } from "@/lib/types";

import RecommendationCard from "@/components/movies/RecommendationCard";

export default function RecommendedSection() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRecommendations() {
      try {
        const results = await getRecommendedMovies();

        if (active) {
          setMovies(results);
        }
      } catch {
        if (active) {
          setError(
            "Unable to load recommendations right now."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section>
        <div className="mb-6">
          <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-4 w-80 animate-pulse rounded bg-white/5" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map(
            (_, index) => (
              <div
                key={index}
                className="aspect-[2/3] animate-pulse rounded-2xl bg-white/5"
              />
            )
          )}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm text-gray-400">
          {error}
        </p>
      </section>
    );
  }

  if (!movies.length) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <p className="text-sm font-medium text-purple-300">
          Recommended for you
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          Your recommendations will appear here
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">
          Watch movies and make bookings to help us
          understand your preferences and personalize
          your recommendations.
        </p>

        <Link
          href="/movies"
          className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
        >
          Explore movies
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-purple-300">
            Personalized for you
          </p>

          <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Recommended for You
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Based on your bookings and recently viewed movies.
          </p>
        </div>

        <Link
          href="/movies"
          className="text-sm font-medium text-gray-300 transition hover:text-white"
        >
          Browse all movies →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {movies.map((movie) => (
          <RecommendationCard
            key={movie.id}
            movie={movie}
          />
        ))}
      </div>
    </section>
  );
}