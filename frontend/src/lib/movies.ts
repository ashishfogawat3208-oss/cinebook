import api from "@/lib/api";

import type {
  City,
  Genre,
  Language,
  Movie,
  PaginatedResponse,
  Theater,
  Show,
} from "@/lib/types";

export interface MovieFilters {
  search?: string;
  genre?: string;
  language?: string;
  city?: string;
  theater?: string;
  release_date?: string;
  release_from?: string;
  release_to?: string;
  min_rating?: string;
  max_rating?: string;
  show_date?: string;
  show_time?: string;
  min_price?: string;
  max_price?: string;
  sort?: string;
  page?: number;
  page_size?: number;
}

export async function getMovies(
  filters: MovieFilters = {}
): Promise<PaginatedResponse<Movie>> {
  const response =
    await api.get<PaginatedResponse<Movie>>(
      "/movies/",
      {
        params: cleanParams(filters),
      }
    );

  return response.data;
}

export async function getMovie(
  movieId: number
): Promise<Movie> {
  const response =
    await api.get<Movie>(
      `/movies/${movieId}/`
    );

  return response.data;
}

export async function getRecommendedMovies(): Promise<Movie[]> {
  const response = await api.get<
    Movie[] | PaginatedResponse<Movie>
  >("/movies/recommended/");

  return extractResults(response.data);
}

export async function getMovieGenres(): Promise<Genre[]> {
  const response = await api.get<
    Genre[] | PaginatedResponse<Genre>
  >("/movies/genres/");

  return extractResults(response.data);
}

export async function getMovieLanguages(): Promise<Language[]> {
  const response = await api.get<
    Language[] | PaginatedResponse<Language>
  >("/movies/languages/");

  return extractResults(response.data);
}

export async function getCities(): Promise<City[]> {
  const response = await api.get<
    City[] | PaginatedResponse<City>
  >("/theaters/cities/");

  return extractResults(response.data);
}

export async function getTheaters(
  cityId?: string
): Promise<Theater[]> {
  const response = await api.get<
    Theater[] | PaginatedResponse<Theater>
  >("/theaters/theaters/", {
    params: cityId
      ? { city: cityId }
      : undefined,
  });

  return extractResults(response.data);
}

export interface ShowFilters {
  city?: string;
  theater?: string;
  date?: string;
  timeFrom?: string;
  timeTo?: string;
  minPrice?: string;
  maxPrice?: string;
}

export async function getMovieShows(
  movieId: number,
  filters: ShowFilters = {}
): Promise<Show[]> {
  const response = await api.get<
    Show[] | PaginatedResponse<Show>
  >(
    `/theaters/movies/${movieId}/shows/`,
    {
      params: cleanParams({
        city: filters.city,
        theater: filters.theater,
        date: filters.date,
        time_from: filters.timeFrom,
        time_to: filters.timeTo,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
      }),
    }
  );

  return extractResults(response.data);
}

export async function getShow(
  showId: number
): Promise<Show> {
  const response =
    await api.get<Show>(
      `/theaters/shows/${showId}/`
    );

  return response.data;
}

export async function createMovieView(
  movieId: number
): Promise<void> {
  await api.post(
    "/movies/views/",
    {
      movie_id: movieId,
    }
  );
}

function extractResults<T>(
  data: T[] | PaginatedResponse<T>
): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray(data.results)
  ) {
    return data.results;
  }

  return [];
}

function cleanParams<T extends object>(
  filters: T
): Record<string, string | number> {
  const params: Record<
    string,
    string | number
  > = {};

  Object.entries(filters).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        params[key] =
          value as string | number;
      }
    }
  );

  return params;
}