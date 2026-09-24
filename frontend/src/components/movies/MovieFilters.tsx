"use client";

import type {
  City,
  Genre,
  Language,
  Theater,
} from "@/lib/types";

export interface MovieFilterValues {
  search: string;
  genre: string;
  language: string;
  city: string;
  theater: string;
  release_from: string;
  release_to: string;
  min_rating: string;
  max_rating: string;
  show_date: string;
  show_time: string;
  min_price: string;
  max_price: string;
  sort: string;
}

interface MovieFiltersProps {
  filters: MovieFilterValues;
  genres: Genre[];
  languages: Language[];
  cities: City[];
  theaters: Theater[];
  onChange: (
    key: keyof MovieFilterValues,
    value: string
  ) => void;
  onReset: () => void;
}

export default function MovieFilters({
  filters,
  genres,
  languages,
  cities,
  theaters,
  onChange,
  onReset,
}: MovieFiltersProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-purple-300">
            Find your movie
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            Filters & Search
          </h2>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
        >
          Reset filters
        </button>
      </div>

      <div className="space-y-5">
        {/* Search */}
        <div>
          <label
            htmlFor="movie-search"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Search movies
          </label>

          <input
            id="movie-search"
            type="search"
            value={filters.search}
            onChange={(event) =>
              onChange(
                "search",
                event.target.value
              )
            }
            placeholder="Search by movie title..."
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-purple-500"
          />
        </div>

        {/* Basic filters */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="movie-genre"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Genre
            </label>

            <select
              id="movie-genre"
              value={filters.genre}
              onChange={(event) =>
                onChange(
                  "genre",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-purple-500"
            >
              <option value="">
                All genres
              </option>

              {genres.map((genre) => (
                <option
                  key={genre.id}
                  value={genre.id}
                >
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="movie-language"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Language
            </label>

            <select
              id="movie-language"
              value={filters.language}
              onChange={(event) =>
                onChange(
                  "language",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-purple-500"
            >
              <option value="">
                All languages
              </option>

              {languages.map((language) => (
                <option
                  key={language.id}
                  value={language.id}
                >
                  {language.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="movie-city"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              City
            </label>

            <select
              id="movie-city"
              value={filters.city}
              onChange={(event) =>
                onChange(
                  "city",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-purple-500"
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
              htmlFor="movie-theater"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Theater
            </label>

            <select
              id="movie-theater"
              value={filters.theater}
              onChange={(event) =>
                onChange(
                  "theater",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-purple-500"
            >
              <option value="">
                All theaters
              </option>

              {theaters.map((theater) => (
                <option
                  key={theater.id}
                  value={theater.id}
                >
                  {theater.name}
                  {theater.city_name
                    ? ` — ${theater.city_name}`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Release date */}
        <div>
          <p className="mb-3 text-sm font-medium text-gray-300">
            Release date
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="release-from"
                className="mb-2 block text-xs text-gray-500"
              >
                From
              </label>

              <input
                id="release-from"
                type="date"
                value={filters.release_from}
                onChange={(event) =>
                  onChange(
                    "release_from",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label
                htmlFor="release-to"
                className="mb-2 block text-xs text-gray-500"
              >
                To
              </label>

              <input
                id="release-to"
                type="date"
                value={filters.release_to}
                onChange={(event) =>
                  onChange(
                    "release_to",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Rating + price */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium text-gray-300">
              Rating
            </p>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={filters.min_rating}
                onChange={(event) =>
                  onChange(
                    "min_rating",
                    event.target.value
                  )
                }
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-purple-500"
              >
                <option value="">
                  Min rating
                </option>
                <option value="5">5+</option>
                <option value="4">4+</option>
                <option value="3">3+</option>
                <option value="2">2+</option>
                <option value="1">1+</option>
              </select>

              <select
                value={filters.max_rating}
                onChange={(event) =>
                  onChange(
                    "max_rating",
                    event.target.value
                  )
                }
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-purple-500"
              >
                <option value="">
                  Max rating
                </option>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
              </select>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-gray-300">
              Ticket price
            </p>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                value={filters.min_price}
                onChange={(event) =>
                  onChange(
                    "min_price",
                    event.target.value
                  )
                }
                placeholder="Min ₹"
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-500"
              />

              <input
                type="number"
                min="0"
                value={filters.max_price}
                onChange={(event) =>
                  onChange(
                    "max_price",
                    event.target.value
                  )
                }
                placeholder="Max ₹"
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Show filters */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="show-date"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Show date
            </label>

            <input
              id="show-date"
              type="date"
              value={filters.show_date}
              onChange={(event) =>
                onChange(
                  "show_date",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label
              htmlFor="show-time"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Show time
            </label>

            <select
              id="show-time"
              value={filters.show_time}
              onChange={(event) =>
                onChange(
                  "show_time",
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-purple-500"
            >
              <option value="">
                Any time
              </option>
              <option value="morning">
                Morning
              </option>
              <option value="afternoon">
                Afternoon
              </option>
              <option value="evening">
                Evening
              </option>
              <option value="night">
                Night
              </option>
            </select>
          </div>
        </div>

        {/* Sorting */}
        <div>
          <label
            htmlFor="movie-sort"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Sort by
          </label>

          <select
            id="movie-sort"
            value={filters.sort}
            onChange={(event) =>
              onChange(
                "sort",
                event.target.value
              )
            }
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-purple-500 sm:max-w-md"
          >
            <option value="popularity">
              Popularity
            </option>

            <option value="newest">
              Newest releases
            </option>

            <option value="oldest">
              Oldest releases
            </option>

            <option value="rating">
              Highest rated
            </option>

            <option value="price_low">
              Lowest ticket price
            </option>

            <option value="price_high">
              Highest ticket price
            </option>

            <option value="title">
              Title A-Z
            </option>
          </select>
        </div>
      </div>
    </section>
  );
}