"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Film,
  Languages,
  PlayCircle,
  Star,
  Ticket,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

import MovieHero from "@/components/movies/MovieHero";
import MovieReviews from "@/components/movies/MovieReviews";
import ShowtimeSection from "@/components/movies/ShowtimeSection";
import MoviePosterGallery from "@/components/movies/MoviePosterGallery";
import MovieCast from "@/components/movies/MovieCast";
import YouTubeTrailer from "@/components/movies/YouTubeTrailer";
import MovieCard from "@/components/movies/MovieCard";

import {
  createMovieView,
  getCities,
  getMovie,
  getRecommendedMovies,
  getSimilarMovies,
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

  const [similarMovies, setSimilarMovies] =
    useState<Movie[]>([]);

  const [recommendedMovies, setRecommendedMovies] =
    useState<Movie[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [recommendationsLoading, setRecommendationsLoading] =
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

        const [
          movieData,
          citiesData,
        ] = await Promise.all([
          getMovie(movieId),
          getCities(),
        ]);

        if (!active) {
          return;
        }

        setMovie(movieData);
        setCities(citiesData);

        /*
         * Record the movie as recently viewed.
         * This does not block the movie page.
         */
        createMovieView(movieId).catch(() => {});


        /*
         * Similar movies
         */
        try {
          const similar =
            await getSimilarMovies(movieData);

          if (active) {
            setSimilarMovies(
              similar
                .filter(
                  (item) =>
                    item.id !== movieData.id
                )
                .slice(0, 6)
            );
          }
        } catch {
          if (active) {
            setSimilarMovies([]);
          }
        }


        /*
         * Personalized recommendations
         */
        try {
          const recommended =
            await getRecommendedMovies();

          if (active) {
            setRecommendedMovies(
              recommended
                .filter(
                  (item) =>
                    item.id !== movieData.id
                )
                .slice(0, 6)
            );
          }
        } catch {
          if (active) {
            setRecommendedMovies([]);
          }
        } finally {
          if (active) {
            setRecommendationsLoading(false);
          }
        }

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

        setRecommendationsLoading(false);

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

          <Link
            href="/movies"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
          >
            <ArrowLeft size={16} />
            Back to Movies
          </Link>

        </div>

      </main>
    );
  }


  const genreNames =
    movie.genres?.map(
      (genre) => genre.name
    ) ?? [];


  const languageNames =
    movie.languages?.map(
      (language) => language.name
    ) ?? [];


  /*
   * MovieCast.tsx expects:
   *
   * role: string
   * photo?: string
   *
   * Convert API null/undefined values
   * into values accepted by the component.
   */
  const castForComponent =
    movie.cast_members?.map(
      (member) => ({
        id: member.id,

        name: member.name,

        role: member.role ?? "",

        photo: member.photo ?? undefined,
      })
    ) ?? [];


  /*
   * MoviePosterGallery.tsx expects:
   *
   * posters
   * title
   */
  const postersForGallery =
    movie.posters ?? [];


  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl space-y-16">


        {/* Back navigation */}

        <div>

          <Link
            href="/movies"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Movies
          </Link>

        </div>


        {/* Movie hero */}

        <section>

          <MovieHero
            movie={movie}
          />

        </section>


        {/* Movie metadata */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">


          {/* Release date */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">

            <div className="mb-3 flex items-center gap-2 text-gray-400">

              <CalendarDays size={18} />

              <span className="text-sm">
                Release Date
              </span>

            </div>

            <p className="font-semibold text-white">

              {movie.release_date
                ? new Date(
                    movie.release_date
                  ).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )
                : "Not available"}

            </p>

          </div>


          {/* Duration */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">

            <div className="mb-3 flex items-center gap-2 text-gray-400">

              <Clock3 size={18} />

              <span className="text-sm">
                Duration
              </span>

            </div>

            <p className="font-semibold text-white">

              {movie.duration_minutes
                ? `${movie.duration_minutes} minutes`
                : "Not available"}

            </p>

          </div>


          {/* Rating */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">

            <div className="mb-3 flex items-center gap-2 text-gray-400">

              <Star size={18} />

              <span className="text-sm">
                Rating
              </span>

            </div>

            <p className="font-semibold text-white">

              {movie.rating !== null &&
              movie.rating !== undefined
                ? `${Number(movie.rating).toFixed(1)} / 10`
                : "Not rated"}

            </p>

          </div>


          {/* Certification */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">

            <div className="mb-3 flex items-center gap-2 text-gray-400">

              <Film size={18} />

              <span className="text-sm">
                Certification
              </span>

            </div>

            <p className="font-semibold text-white">

              {movie.age_certification ||
                "U"}

            </p>

          </div>

        </section>


        {/* Description */}

        {movie.description && (
          <section>

            <div className="mb-5 flex items-center gap-3">

              <div className="h-8 w-1 rounded-full bg-purple-500" />

              <h2 className="text-2xl font-bold">
                About the Movie
              </h2>

            </div>


            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">

              <p className="max-w-5xl whitespace-pre-line text-base leading-8 text-gray-300">

                {movie.description}

              </p>


              {/* Genres */}

              {genreNames.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">

                  {genreNames.map(
                    (genre) => (
                      <span
                        key={genre}
                        className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-200"
                      >
                        {genre}
                      </span>
                    )
                  )}

                </div>
              )}


              {/* Languages */}

              {languageNames.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-400">

                  <Languages size={16} />

                  {languageNames.map(
                    (language, index) => (
                      <span key={language}>

                        {language}

                        {index <
                        languageNames.length - 1
                          ? ", "
                          : ""}

                      </span>
                    )
                  )}

                </div>
              )}

            </div>

          </section>
        )}


        {/* Trailer */}

        {movie.trailer_url && (
          <section>

            <div className="mb-5 flex items-center gap-3">

              <PlayCircle
                size={24}
                className="text-purple-400"
              />

              <h2 className="text-2xl font-bold">
                Official Trailer
              </h2>

            </div>


            <YouTubeTrailer
              url={movie.trailer_url}
              title={movie.title}
            />

          </section>
        )}


        {/* Poster gallery */}

        <section>

          <div className="mb-5 flex items-center gap-3">

            <div className="h-8 w-1 rounded-full bg-purple-500" />

            <h2 className="text-2xl font-bold">
              Movie Gallery
            </h2>

          </div>


          <MoviePosterGallery
            posters={postersForGallery}
            title={movie.title}
          />

        </section>


        {/* Cast */}

        {castForComponent.length > 0 && (
          <section>

            <div className="mb-5 flex items-center gap-3">

              <div className="h-8 w-1 rounded-full bg-purple-500" />

              <h2 className="text-2xl font-bold">
                Cast & Crew
              </h2>

            </div>


            <MovieCast
              cast={castForComponent}
            />

          </section>
        )}


        {/* Showtimes */}

        <section>

          <div className="mb-5 flex items-center gap-3">

            <Ticket
              size={24}
              className="text-purple-400"
            />

            <h2 className="text-2xl font-bold">
              Book Tickets
            </h2>

          </div>


          <ShowtimeSection
            movieId={movie.id}
            cities={cities}
          />

        </section>


        {/* Reviews */}

        <section>

          <MovieReviews
            movieId={movie.id}
          />

        </section>


        {/* Similar Movies */}

        {similarMovies.length > 0 && (
          <section>

            <div className="mb-6">

              <h2 className="text-2xl font-bold">
                Similar Movies
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                More movies from the same genre
              </p>

            </div>


            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

              {similarMovies.map(
                (similarMovie) => (
                  <MovieCard
                    key={similarMovie.id}
                    movie={similarMovie}
                  />
                )
              )}

            </div>

          </section>
        )}


        {/* Recommended For You */}

        {!recommendationsLoading &&
          recommendedMovies.length > 0 && (
            <section>

              <div className="mb-6">

                <h2 className="text-2xl font-bold">
                  Recommended For You
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Based on your activity and preferences
                </p>

              </div>


              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

                {recommendedMovies.map(
                  (recommendedMovie) => (
                    <MovieCard
                      key={recommendedMovie.id}
                      movie={recommendedMovie}
                    />
                  )
                )}

              </div>

            </section>
          )}

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