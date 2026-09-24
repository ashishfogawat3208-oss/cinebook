"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

import MovieHero from "@/components/movies/MovieHero";
import ShowtimeSection from "@/components/movies/ShowtimeSection";

import {
  createMovieView,
  getCities,
  getMovie,
} from "@/lib/movies";

import type {
  City,
  Movie,
} from "@/lib/types";

function MovieDetailsContent() {
  const params = useParams();

  const movieId = Number(params.id);

  const [movie, setMovie] =
    useState<Movie | null>(null);

  const [cities, setCities] =
    useState<City[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!movieId || Number.isNaN(movieId)) {
      setError("Invalid movie ID.");
      setLoading(false);
      return;
    }

    let active = true;

    async function loadMovie() {
      try {
        setLoading(true);
        setError("");

        const [movieData, citiesData] =
          await Promise.all([
            getMovie(movieId),
            getCities(),
          ]);

        if (!active) {
          return;
        }

        setMovie(movieData);
        setCities(citiesData);

        // Record the movie as recently viewed.
        // Failure here should never break the movie page.
        createMovieView(movieId).catch(() => {});
      } catch (err) {
        if (!active) {
          return;
        }

        console.error(
          "Failed to load movie details:",
          err
        );

        setError(
          "Unable to load this movie right now."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMovie();

    return () => {
      active = false;
    };
  }, [movieId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="h-[420px] animate-pulse rounded-3xl bg-white/5" />

          <div className="space-y-4">
            <div className="h-8 w-64 animate-pulse rounded bg-white/10" />

            <div className="h-5 w-96 max-w-full animate-pulse rounded bg-white/5" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-2xl bg-white/5"
                />
              )
            )}
          </div>
        </div>
      </main>
    );
  }

  if (error || !movie) {
    return (
      <main className="min-h-screen bg-black px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <h1 className="text-2xl font-bold text-white">
            Movie unavailable
          </h1>

          <p className="mt-3 text-sm text-red-200">
            {error ||
              "We couldn't find this movie."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        <MovieHero movie={movie} />

        <ShowtimeSection
          movieId={movie.id}
          cities={cities}
        />
      </div>
    </main>
  );
}

export default function MovieDetailsPage() {
  return (
    <ProtectedRoute>
      <MovieDetailsContent />
    </ProtectedRoute>
  );
}