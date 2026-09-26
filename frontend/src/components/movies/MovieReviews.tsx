"use client";

import {
  Flag,
  Loader2,
  Pencil,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";

import {
  createMovieReview,
  deleteMovieReview,
  getMovieReviews,
  reportMovieReview,
  updateMovieReview,
  type MovieReview,
} from "@/lib/reviews";

interface MovieReviewsProps {
  movieId: number;
}

function formatReviewDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function StarDisplay({
  rating,
  size = 18,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-zinc-700"
          }
        />
      ))}
    </div>
  );
}

function RatingSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active =
          star <= (hovered || value);

        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="rounded-md p-1 transition hover:scale-110"
            aria-label={`Rate ${star} out of 5`}
          >
            <Star
              size={28}
              className={
                active
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-zinc-700 hover:text-yellow-400"
              }
            />
          </button>
        );
      })}
    </div>
  );
}

export default function MovieReviews({
  movieId,
}: MovieReviewsProps) {
  const { user, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState<MovieReview[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [editingReviewId, setEditingReviewId] =
    useState<number | null>(null);

  const [reportingReviewId, setReportingReviewId] =
    useState<number | null>(null);

  const [reportReason, setReportReason] =
    useState("");

  const [deletingReviewId, setDeletingReviewId] =
    useState<number | null>(null);

  async function loadReviews() {
    try {
      setLoading(true);
      setError("");

      const data = await getMovieReviews(movieId);

      setReviews(data);
    } catch (err: any) {
      console.error("Failed to load reviews:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load reviews."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [movieId]);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return 0;
    }

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating),
      0
    );

    return total / reviews.length;
  }, [reviews]);

  const ratingBreakdown = useMemo(() => {
    return [5, 4, 3, 2, 1].map((ratingValue) => {
      const count = reviews.filter(
        (review) =>
          Number(review.rating) === ratingValue
      ).length;

      return {
        rating: ratingValue,
        count,
        percentage: reviews.length
          ? (count / reviews.length) * 100
          : 0,
      };
    });
  }, [reviews]);

  const currentUserReview = useMemo(() => {
    if (!user) {
      return null;
    }

    return (
      reviews.find(
        (review) => review.user === user.id
      ) || null
    );
  }, [reviews, user]);

  async function handleSubmitReview(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!isAuthenticated) {
      setError(
        "Please log in to submit a review."
      );
      return;
    }

    if (rating < 1 || rating > 5) {
      setError(
        "Please select a rating from 1 to 5 stars."
      );
      return;
    }

    if (!reviewText.trim()) {
      setError("Please write a review.");
      return;
    }

    try {
      setSubmitting(true);

      await createMovieReview(movieId, {
        rating,
        review_text: reviewText.trim(),
      });

      setRating(0);
      setReviewText("");

      setSuccess(
        "Your review has been submitted successfully."
      );

      await loadReviews();
    } catch (err: any) {
      console.error(
        "Failed to create review:",
        err
      );

      const data = err?.response?.data;

      if (typeof data?.detail === "string") {
        setError(data.detail);
      } else if (
        typeof data === "object" &&
        data !== null
      ) {
        const firstError = Object.values(data)
          .flat()
          .find(
            (value) =>
              typeof value === "string"
          );

        setError(
          typeof firstError === "string"
            ? firstError
            : "Unable to submit your review."
        );
      } else {
        setError("Unable to submit your review.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(review: MovieReview) {
    setEditingReviewId(review.id);
    setRating(review.rating);
    setReviewText(review.review_text);
    setError("");
    setSuccess("");
  }

  function cancelEditing() {
    setEditingReviewId(null);
    setRating(0);
    setReviewText("");
  }

  async function handleUpdateReview(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingReviewId) {
      return;
    }

    setError("");
    setSuccess("");

    if (rating < 1 || rating > 5) {
      setError(
        "Please select a rating from 1 to 5 stars."
      );
      return;
    }

    if (!reviewText.trim()) {
      setError("Please write a review.");
      return;
    }

    try {
      setSubmitting(true);

      await updateMovieReview(
        editingReviewId,
        {
          rating,
          review_text: reviewText.trim(),
        }
      );

      cancelEditing();

      setSuccess(
        "Your review has been updated."
      );

      await loadReviews();
    } catch (err: any) {
      console.error(
        "Failed to update review:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to update your review."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteReview(
    reviewId: number
  ) {
    const confirmed = window.confirm(
      "Delete your review?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingReviewId(reviewId);
    setError("");
    setSuccess("");

    try {
      await deleteMovieReview(reviewId);

      if (editingReviewId === reviewId) {
        cancelEditing();
      }

      setSuccess(
        "Your review has been deleted."
      );

      await loadReviews();
    } catch (err: any) {
      console.error(
        "Failed to delete review:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to delete your review."
      );
    } finally {
      setDeletingReviewId(null);
    }
  }

  async function handleReportReview(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!reportingReviewId) {
      return;
    }

    const reason = reportReason.trim();

    if (!reason) {
      setError(
        "Please enter a reason for reporting this review."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await reportMovieReview(
        reportingReviewId,
        {
          reason,
        }
      );

      setReportingReviewId(null);
      setReportReason("");

      setSuccess(
        "Review reported successfully."
      );

      await loadReviews();
    } catch (err: any) {
      console.error(
        "Failed to report review:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to report this review."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-14">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
          Community Reviews
        </p>

        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">
              Ratings & Reviews
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              See what other moviegoers think.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-black text-white">
                {averageRating
                  ? averageRating.toFixed(1)
                  : "—"}
              </p>

              <p className="text-xs text-zinc-500">
                {reviews.length}{" "}
                {reviews.length === 1
                  ? "review"
                  : "reviews"}
              </p>
            </div>

            <StarDisplay
              rating={averageRating}
              size={20}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="h-fit rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-center">
            <p className="text-5xl font-black text-white">
              {averageRating
                ? averageRating.toFixed(1)
                : "0.0"}
            </p>

            <div className="mt-3 flex justify-center">
              <StarDisplay
                rating={averageRating}
                size={18}
              />
            </div>

            <p className="mt-3 text-sm text-zinc-500">
              Based on {reviews.length}{" "}
              {reviews.length === 1
                ? "review"
                : "reviews"}
            </p>
          </div>

          <div className="mt-7 space-y-3">
            {ratingBreakdown.map((item) => (
              <div
                key={item.rating}
                className="flex items-center gap-3"
              >
                <span className="w-4 text-xs text-zinc-500">
                  {item.rating}
                </span>

                <Star
                  size={13}
                  className="fill-yellow-400 text-yellow-400"
                />

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  />
                </div>

                <span className="w-5 text-right text-xs text-zinc-600">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          {isAuthenticated &&
          !currentUserReview &&
          !editingReviewId ? (
            <form
              onSubmit={handleSubmitReview}
              className="mb-7 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Write a review
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    You can review this movie after
                    watching it.
                  </p>
                </div>

                <RatingSelector
                  value={rating}
                  onChange={setRating}
                />
              </div>

              <textarea
                value={reviewText}
                onChange={(event) =>
                  setReviewText(event.target.value)
                }
                placeholder="Share your thoughts about the movie..."
                rows={5}
                maxLength={2000}
                className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-red-500/50"
              />

              <div className="mt-4 flex items-center justify-between gap-4">
                <span className="text-xs text-zinc-600">
                  {reviewText.length}/2000
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Submit Review
                </button>
              </div>
            </form>
          ) : !isAuthenticated ? (
            <div className="mb-7 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-bold text-white">
                Want to share your experience?
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Log in and watch the movie to leave a
                verified review.
              </p>
            </div>
          ) : currentUserReview ? (
            <div className="mb-7 rounded-3xl border border-green-500/10 bg-green-500/5 p-6">
              <p className="text-sm font-semibold text-green-400">
                You have already reviewed this movie.
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                You can edit your existing review below.
              </p>
            </div>
          ) : null}

          {loading ? (
            <div className="flex min-h-48 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <Loader2
                  size={20}
                  className="animate-spin"
                />
                Loading reviews...
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
                <Star
                  size={24}
                  className="text-zinc-600"
                />
              </div>

              <h3 className="mt-5 text-lg font-bold text-white">
                No reviews yet
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Be the first moviegoer to share your
                experience.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const isOwnReview =
                  user?.id === review.user;

                const isEditing =
                  editingReviewId === review.id;

                const isReporting =
                  reportingReviewId === review.id;

                return (
                  <article
                    key={review.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                  >
                    {isEditing ? (
                      <form
                        onSubmit={handleUpdateReview}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="font-bold text-white">
                            Edit your review
                          </h3>

                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <div className="mt-5">
                          <RatingSelector
                            value={rating}
                            onChange={setRating}
                          />
                        </div>

                        <textarea
                          value={reviewText}
                          onChange={(event) =>
                            setReviewText(
                              event.target.value
                            )
                          }
                          rows={5}
                          maxLength={2000}
                          className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-red-500/50"
                        />

                        <div className="mt-4 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                          >
                            {submitting && (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            )}

                            Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                              <UserRound
                                size={18}
                                className="text-zinc-400"
                              />
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-white">
                                  {review.username}
                                </span>

                                {review.is_verified_viewer && (
                                  <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                                    ✓ Verified Viewer
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs text-zinc-600">
                                {formatReviewDate(
                                  review.created_at
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <StarDisplay
                              rating={review.rating}
                              size={15}
                            />

                            <span className="text-sm font-semibold text-white">
                              {review.rating}/5
                            </span>
                          </div>
                        </div>

                        {review.review_text && (
                          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-zinc-400">
                            {review.review_text}
                          </p>
                        )}

                        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
                          {isOwnReview && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  startEditing(review)
                                }
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-white/5 hover:text-white"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteReview(
                                    review.id
                                  )
                                }
                                disabled={
                                  deletingReviewId ===
                                  review.id
                                }
                                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                              >
                                {deletingReviewId ===
                                review.id ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={14}
                                  />
                                )}
                                Delete
                              </button>
                            </>
                          )}

                          {!isOwnReview && (
                            <button
                              type="button"
                              onClick={() => {
                                setReportingReviewId(
                                  review.id
                                );
                                setReportReason("");
                                setError("");
                              }}
                              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-white/5 hover:text-zinc-300"
                            >
                              <Flag size={14} />
                              Report
                            </button>
                          )}
                        </div>

                        {isReporting && (
                          <form
                            onSubmit={
                              handleReportReview
                            }
                            className="mt-4 rounded-2xl border border-yellow-500/10 bg-yellow-500/5 p-4"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-white">
                                Report this review
                              </p>

                              <button
                                type="button"
                                onClick={() => {
                                  setReportingReviewId(
                                    null
                                  );
                                  setReportReason("");
                                }}
                                className="text-zinc-600 hover:text-white"
                              >
                                <X size={17} />
                              </button>
                            </div>

                            <textarea
                              value={reportReason}
                              onChange={(event) =>
                                setReportReason(
                                  event.target.value
                                )
                              }
                              maxLength={500}
                              rows={3}
                              placeholder="Tell us why you are reporting this review..."
                              className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-yellow-500/30"
                            />

                            <button
                              type="submit"
                              disabled={submitting}
                              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2.5 text-xs font-bold text-black transition hover:bg-yellow-400 disabled:opacity-50"
                            >
                              {submitting && (
                                <Loader2
                                  size={14}
                                  className="animate-spin"
                                />
                              )}

                              Submit Report
                            </button>
                          </form>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}