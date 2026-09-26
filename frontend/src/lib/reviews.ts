import api from "@/lib/api";

export interface MovieReview {
  id: number;
  movie: number;
  user: number;
  username: string;
  rating: number;
  review_text: string;
  is_verified_viewer: boolean;
  is_reported: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewPayload {
  rating: number;
  review_text: string;
}

export interface ReportReviewPayload {
  reason: string;
}

/**
 * Get all visible reviews for a movie.
 */
export async function getMovieReviews(
  movieId: number
): Promise<MovieReview[]> {
  const response = await api.get<MovieReview[]>(
    `/movies/${movieId}/reviews/`
  );

  return response.data;
}

/**
 * Create a review.
 *
 * Backend verifies:
 * - user is authenticated
 * - user booked the movie
 * - show has already finished
 * - user has not already reviewed the movie
 */
export async function createMovieReview(
  movieId: number,
  payload: CreateReviewPayload
): Promise<MovieReview> {
  const response = await api.post<MovieReview>(
    `/movies/${movieId}/reviews/`,
    payload
  );

  return response.data;
}

/**
 * Update your own review.
 */
export async function updateMovieReview(
  reviewId: number,
  payload: CreateReviewPayload
): Promise<MovieReview> {
  const response = await api.put<MovieReview>(
    `/movies/reviews/${reviewId}/`,
    payload
  );

  return response.data;
}

/**
 * Delete your own review.
 */
export async function deleteMovieReview(
  reviewId: number
): Promise<void> {
  await api.delete(
    `/movies/reviews/${reviewId}/`
  );
}

/**
 * Report a review.
 */
export async function reportMovieReview(
  reviewId: number,
  payload: ReportReviewPayload
): Promise<void> {
  await api.post(
    `/movies/reviews/${reviewId}/report/`,
    payload
  );
}