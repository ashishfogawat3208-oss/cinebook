"use client";

import { useEffect, useState } from "react";

import type {
  City,
  Show,
} from "@/lib/types";

import { getMovieShows } from "@/lib/movies";

import ShowtimeCard from "@/components/movies/ShowtimeCard";

interface ShowtimeSectionProps {
  movieId: number;
  cities: City[];
}

export default function ShowtimeSection({
  movieId,
  cities,
}: ShowtimeSectionProps) {
  const [shows, setShows] = useState<Show[]>([]);

  const [selectedCity, setSelectedCity] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadShows() {
      try {
        setLoading(true);
        setError("");

        const data = await getMovieShows(movieId, {
          city: selectedCity || undefined,
          date: selectedDate || undefined,
        });

        if (!active) {
          return;
        }

        setShows(data);
      } catch (err) {
        if (!active) {
          return;
        }

        console.error(
          "Failed to load movie shows:",
          err
        );

        setError(
          "Unable to load showtimes right now."
        );

        setShows([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadShows();

    return () => {
      active = false;
    };
  }, [movieId, selectedCity, selectedDate]);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-medium text-purple-300">
          Choose your show
        </p>

        <h2 className="mt-1 text-3xl font-bold text-white">
          Showtimes
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Select a city and date to find available
          screenings.
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:grid-cols-2">
        <div>
          <label
            htmlFor="movie-city"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            City
          </label>

          <select
            id="movie-city"
            value={selectedCity}
            onChange={(event) =>
              setSelectedCity(event.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
          >
            <option value="">
              All cities
            </option>

            {cities.map((city) => (
              <option
                key={city.id}
                value={city.id}
              >
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="movie-date"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Date
          </label>

          <input
            id="movie-date"
            type="date"
            value={selectedDate}
            onChange={(event) =>
              setSelectedDate(event.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
          />
        </div>
      </div>

      {loading && (
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
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-sm text-red-200">
            {error}
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        shows.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
            <div className="text-4xl">
              🎬
            </div>

            <h3 className="mt-4 text-xl font-semibold text-white">
              No showtimes found
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Try selecting another city or date.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        shows.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {shows.length}{" "}
                {shows.length === 1
                  ? "show"
                  : "shows"}{" "}
                available
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shows.map((show) => (
                <ShowtimeCard
                  key={show.id}
                  show={show}
                />
              ))}
            </div>
          </div>
        )}
    </section>
  );
}