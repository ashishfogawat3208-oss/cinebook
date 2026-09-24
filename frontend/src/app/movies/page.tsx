"use client";

import { useEffect, useMemo, useState } from "react";

import MovieCard from "@/components/movies/MovieCard";
import MovieFilters, {
  type MovieFilterValues,
} from "@/components/movies/MovieFilters";

import {
  getCities,
  getMovieGenres,
  getMovieLanguages,
  getMovies,
  getTheaters,
} from "@/lib/movies";

import type {
  City,
  Genre,
  Language,
  Movie,
  PaginatedResponse,
  Theater,
} from "@/lib/types";

const INITIAL_FILTERS: MovieFilterValues = {
  search: "",
  genre: "",
  language: "",
  city: "",
  theater: "",
  release_from: "",
  release_to: "",
  min_rating: "",
  max_rating: "",
  show_date: "",
  show_time: "",
  min_price: "",
  max_price: "",
  sort: "popularity",
};

export default function MoviesPage() {
  const [filters, setFilters] =
    useState<MovieFilterValues>(
      INITIAL_FILTERS
    );

  const [movies, setMovies] = useState<
    Movie[]
  >([]);

  const [pagination, setPagination] =
    useState<PaginatedResponse<Movie> | null>(
      null
    );

  const [genres, setGenres] = useState<
    Genre[]
  >([]);

  const [languages, setLanguages] =
    useState<Language[]>([]);

  const [cities, setCities] = useState<
    City[]
  >([]);

  const [theaters, setTheaters] = useState<
    Theater[]
  >([]);

  const [page, setPage] = useState(1);

  const [loading, setLoading] =
    useState(true);

  const [filterLoading, setFilterLoading] =
    useState(true);

  const [error, setError] = useState("");

  const pageSize = 12;

  /*
   * Load filter options.
   */
  useEffect(() => {
    let active = true;

    async function loadFilterOptions() {
      try {
        setFilterLoading(true);

        const [
          genreData,
          languageData,
          cityData,
        ] = await Promise.all([
          getMovieGenres(),
          getMovieLanguages(),
          getCities(),
        ]);

        if (!active) {
          return;
        }

        setGenres(genreData);
        setLanguages(languageData);
        setCities(cityData);
      } catch (err) {
        if (!active) {
          return;
        }

        console.error(
          "Failed to load movie filters:",
          err
        );
      } finally {
        if (active) {
          setFilterLoading(false);
        }
      }
    }

    loadFilterOptions();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Load theaters when city changes.
   */
  useEffect(() => {
    let active = true;

    async function loadTheaters() {
      try {
        if (!filters.city) {
          setTheaters([]);
          return;
        }

        const data = await getTheaters(
          filters.city
        );

        if (!active) {
          return;
        }

        setTheaters(data);

        /*
         * If the currently selected theater
         * doesn't belong to the selected city,
         * clear it.
         */
        const theaterStillValid =
          data.some(
            (theater) =>
              String(theater.id) ===
              filters.theater
          );

        if (
          filters.theater &&
          !theaterStillValid
        ) {
          setFilters((current) => ({
            ...current,
            theater: "",
          }));
        }
      } catch (err) {
        if (!active) {
          return;
        }

        console.error(
          "Failed to load theaters:",
          err
        );

        setTheaters([]);
      }
    }

    loadTheaters();

    return () => {
      active = false;
    };
  }, [filters.city]);

  /*
   * Load movies whenever filters/page changes.
   */
  useEffect(() => {
    let active = true;

    async function loadMovies() {
      try {
        setLoading(true);
        setError("");

        const response = await getMovies({
          search: filters.search || undefined,
          genre: filters.genre || undefined,
          language:
            filters.language || undefined,
          city: filters.city || undefined,
          theater:
            filters.theater || undefined,
          release_from:
            filters.release_from || undefined,
          release_to:
            filters.release_to || undefined,
          min_rating:
            filters.min_rating || undefined,
          max_rating:
            filters.max_rating || undefined,
          show_date:
            filters.show_date || undefined,
          show_time:
            filters.show_time || undefined,
          min_price:
            filters.min_price || undefined,
          max_price:
            filters.max_price || undefined,
          sort:
            filters.sort || "popularity",
          page,
          page_size: pageSize,
        });

        if (!active) {
          return;
        }

        setMovies(response.results);
        setPagination(response);
      } catch (err) {
        if (!active) {
          return;
        }

        console.error(
          "Failed to load movies:",
          err
        );

        setMovies([]);
        setPagination(null);

        setError(
          "Unable to load movies right now."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMovies();

    return () => {
      active = false;
    };
  }, [filters, page]);

  function handleFilterChange(
    key: keyof MovieFilterValues,
    value: string
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));

    setPage(1);
  }

  function handleReset() {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }

  const totalPages = useMemo(() => {
    if (!pagination) {
      return 0;
    }

    return Math.ceil(
      pagination.count / pageSize
    );
  }, [pagination]);

  const currentPage = page;

  const hasPreviousPage =
    Boolean(pagination?.previous) ||
    currentPage > 1;

  const hasNextPage =
    Boolean(pagination?.next) ||
    currentPage < totalPages;

  return (
    <main className="min-h-screen bg-black px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <section>
          <p className="text-sm font-medium text-purple-300">
            Movie discovery
          </p>

          <h1 className="mt-1 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Find your next movie
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
            Search movies, explore genres, compare
            showtimes and find tickets that fit your
            plans.
          </p>
        </section>

        {/* Filters */}
        <MovieFilters
          filters={filters}
          genres={genres}
          languages={languages}
          cities={cities}
          theaters={theaters}
          onChange={handleFilterChange}
          onReset={handleReset}
        />

        {/* Results header */}
        <section className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              {loading
                ? "Finding movies..."
                : `${pagination?.count ?? 0} movie${
                    pagination?.count === 1
                      ? ""
                      : "s"
                  } found`}
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              Movies
            </h2>
          </div>

          {!filterLoading &&
            filters.city && (
              <p className="text-sm text-gray-500">
                Theater options updated for your
                selected city.
              </p>
            )}
        </section>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]"
                >
                  <div className="aspect-[2/3] animate-pulse bg-white/5" />

                  <div className="space-y-3 p-4">
                    <div className="h-5 animate-pulse rounded bg-white/10" />

                    <div className="h-4 w-2/3 animate-pulse rounded bg-white/5" />

                    <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
            <div className="text-4xl">
              ⚠️
            </div>

            <h2 className="mt-4 text-xl font-bold text-white">
              Something went wrong
            </h2>

            <p className="mt-2 text-sm text-red-200">
              {error}
            </p>
          </section>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          movies.length === 0 && (
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
              <div className="text-5xl">
                🎬
              </div>

              <h2 className="mt-5 text-2xl font-bold text-white">
                No movies found
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-400">
                We couldn't find any movies matching
                your current filters. Try changing
                your search or resetting the filters.
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                Clear filters
              </button>
            </section>
          )}

        {/* Movies */}
        {!loading &&
          !error &&
          movies.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {movies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <section className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
                  <p className="text-sm text-gray-500">
                    Page {currentPage} of{" "}
                    {totalPages}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!hasPreviousPage}
                      onClick={() =>
                        setPage((current) =>
                          Math.max(
                            1,
                            current - 1
                          )
                        )
                      }
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      ← Previous
                    </button>

                    <div className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                      {currentPage}
                    </div>

                    <button
                      type="button"
                      disabled={!hasNextPage}
                      onClick={() =>
                        setPage((current) =>
                          Math.min(
                            totalPages,
                            current + 1
                          )
                        )
                      }
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Next →
                    </button>
                  </div>
                </section>
              )}
            </>
          )}
      </div>
    </main>
  );
}