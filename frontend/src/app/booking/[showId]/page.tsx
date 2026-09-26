"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  Loader2,
  Ticket,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SeatMap from "@/components/booking/SeatMap";

import {
  createBooking,
  getShowSeats,
  releaseSeatHolds,
  reserveSeats,
} from "@/lib/bookings";

import type { ShowSeat } from "@/lib/types";

function BookingSeatPageContent() {
  const params = useParams();
  const router = useRouter();

  const showId = Number(params.showId);

  const [seats, setSeats] = useState<ShowSeat[]>(
    []
  );

  const [selectedSeatIds, setSelectedSeatIds] =
    useState<number[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [reserving, setReserving] =
    useState(false);

  const [creatingBooking, setCreatingBooking] =
    useState(false);

  const [error, setError] = useState("");

  const [secondsLeft, setSecondsLeft] =
    useState<number | null>(null);

  const [showStartTime, setShowStartTime] =
    useState("");

  const [ticketPrice, setTicketPrice] =
    useState(0);

  /*
   * Seats that currently belong to the user's
   * temporary reservation.
   *
   * This is intentionally kept in a ref so that
   * changing React selection state does NOT
   * accidentally trigger cleanup.
   */
  const heldSeatIdsRef =
    useRef<number[]>([]);

  const countdownRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  const refreshRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  /*
   * When true, we're intentionally navigating
   * somewhere else and must not release seats
   * during component cleanup.
   */
  const intentionalNavigationRef =
    useRef(false);

  /*
   * Prevent multiple expiry handlers from firing.
   */
  const expiryHandledRef = useRef(false);

  /*
   * Load current seat availability.
   */
  const loadSeats = useCallback(async () => {
    if (!showId || Number.isNaN(showId)) {
      setError("Invalid show.");
      setLoading(false);
      return;
    }

    try {
      const data = await getShowSeats(showId);

      setSeats(data.seats);

      setShowStartTime(data.start_time);

      setTicketPrice(
        Number(data.ticket_price)
      );
    } catch (err: any) {
      console.error(
        "Failed to load show seats:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load seats for this show."
      );
    } finally {
      setLoading(false);
    }
  }, [showId]);

  /*
   * Initial load.
   */
  useEffect(() => {
    loadSeats();
  }, [loadSeats]);

  /*
   * Refresh seat availability every 5 seconds.
   *
   * This allows temporary reservations from
   * other users to appear automatically.
   */
  useEffect(() => {
    refreshRef.current = setInterval(() => {
      loadSeats();
    }, 5000);

    return () => {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
        refreshRef.current = null;
      }
    };
  }, [loadSeats]);

  /*
   * Selected seats currently visible in the UI.
   */
  const selectedSeats = useMemo(() => {
    return seats.filter((seat) =>
      selectedSeatIds.includes(seat.id)
    );
  }, [seats, selectedSeatIds]);

  /*
   * Total amount.
   */
  const totalAmount = useMemo(() => {
    return selectedSeats.reduce(
      (total, seat) =>
        total + Number(seat.price),
      0
    );
  }, [selectedSeats]);

  /*
   * Synchronize the countdown with the backend's
   * remaining_seconds value.
   */
  useEffect(() => {
    if (
      heldSeatIdsRef.current.length === 0
    ) {
      setSecondsLeft(null);

      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }

      return;
    }

    const updateCountdown = () => {
      const heldSeats = seats.filter(
        (seat) =>
          heldSeatIdsRef.current.includes(
            seat.id
          ) &&
          seat.reservation_status ===
            "MY_RESERVATION"
      );

      if (heldSeats.length === 0) {
        setSecondsLeft(null);
        return;
      }

      const remaining = Math.min(
        ...heldSeats.map(
          (seat) =>
            seat.remaining_seconds ?? 120
        )
      );

      const safeRemaining = Math.max(
        0,
        remaining
      );

      setSecondsLeft(safeRemaining);

      if (
        safeRemaining <= 0 &&
        !expiryHandledRef.current
      ) {
        expiryHandledRef.current = true;

        void handleHoldExpired();
      }
    };

    updateCountdown();

    if (!countdownRef.current) {
      countdownRef.current = setInterval(
        updateCountdown,
        1000
      );
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [seats]);

  /*
   * Release a single deselected seat.
   *
   * We do this separately so that if the user selects
   * A1 + A2 and then removes A2, A2 becomes available
   * immediately instead of remaining held for 2 minutes.
   */
  async function releaseSingleSeat(
    seatId: number
  ) {
    try {
      await releaseSeatHolds(
        showId,
        [seatId]
      );

      heldSeatIdsRef.current =
        heldSeatIdsRef.current.filter(
          (id) => id !== seatId
        );

      await loadSeats();
    } catch (err) {
      console.error(
        "Failed to release seat:",
        err
      );
    }
  }

  /*
   * Select or deselect a seat.
   */
  async function handleSeatClick(
    seat: ShowSeat
  ) {
    setError("");

    const alreadySelected =
      selectedSeatIds.includes(seat.id);

    /*
     * Deselect.
     */
    if (alreadySelected) {
      setSelectedSeatIds((current) =>
        current.filter(
          (id) => id !== seat.id
        )
      );

      await releaseSingleSeat(seat.id);

      return;
    }

    /*
     * Only genuinely available seats can
     * be newly selected.
     */
    if (
      seat.reservation_status !==
      "AVAILABLE"
    ) {
      return;
    }

    const nextSelection = [
      ...selectedSeatIds,
      seat.id,
    ];

    setReserving(true);
    setError("");

    try {
      /*
       * Atomically reserve the complete selection.
       */
      await reserveSeats(
        showId,
        nextSelection
      );

      heldSeatIdsRef.current =
        nextSelection;

      expiryHandledRef.current = false;

      setSelectedSeatIds(
        nextSelection
      );

      await loadSeats();
    } catch (err: any) {
      console.error(
        "Seat reservation failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "One or more selected seats are no longer available."
      );

      await loadSeats();
    } finally {
      setReserving(false);
    }
  }

  /*
   * Handle expired temporary reservation.
   */
  async function handleHoldExpired() {
    const heldIds =
      heldSeatIdsRef.current;

    if (heldIds.length === 0) {
      return;
    }

    heldSeatIdsRef.current = [];

    setSelectedSeatIds([]);

    setSecondsLeft(null);

    try {
      await releaseSeatHolds(
        showId,
        heldIds
      );
    } catch (err) {
      /*
       * Backend expiry remains authoritative.
       */
      console.error(
        "Seat hold release failed:",
        err
      );
    }

    await loadSeats();

    setError(
      "Your 2-minute seat reservation expired. Please select your seats again."
    );

    expiryHandledRef.current = false;
  }

  /*
   * Create the pending booking.
   *
   * At this point the backend converts the
   * user's temporary holds into BOOKED seats.
   */
  async function handleContinue() {
    if (
      selectedSeatIds.length === 0
    ) {
      setError(
        "Please select at least one seat."
      );

      return;
    }

    if (
      secondsLeft !== null &&
      secondsLeft <= 0
    ) {
      await handleHoldExpired();
      return;
    }

    setCreatingBooking(true);
    setError("");

    try {
      const booking =
        await createBooking(
          showId,
          selectedSeatIds
        );

      /*
       * Booking has now taken ownership of
       * the selected seats.
       *
       * Do NOT release them when leaving this page.
       */
      intentionalNavigationRef.current =
        true;

      heldSeatIdsRef.current = [];

      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }

      router.push(
        `/bookings/${booking.booking_id}`
      );
    } catch (err: any) {
      console.error(
        "Booking creation failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to create your booking. Please try again."
      );

      await loadSeats();
    } finally {
      setCreatingBooking(false);
    }
  }

  /*
   * Back button.
   *
   * Since the user is abandoning the seat selection,
   * explicitly release their temporary holds.
   */
  async function handleBack() {
    intentionalNavigationRef.current =
      true;

    const heldIds =
      heldSeatIdsRef.current;

    heldSeatIdsRef.current = [];

    if (heldIds.length > 0) {
      try {
        await releaseSeatHolds(
          showId,
          heldIds
        );
      } catch (err) {
        console.error(
          "Failed to release seats:",
          err
        );
      }
    }

    router.back();
  }

  /*
   * If the user leaves the page through normal
   * navigation/browser back, release temporary holds.
   *
   * We intentionally do NOT depend on selectedSeatIds.
   */
  useEffect(() => {
    return () => {
      if (
        intentionalNavigationRef.current
      ) {
        return;
      }

      const heldIds =
        heldSeatIdsRef.current;

      if (
        heldIds.length === 0 ||
        !showId
      ) {
        return;
      }

      /*
       * Best effort cleanup.
       *
       * Backend expiration protects against
       * abandoned holds.
       */
      void releaseSeatHolds(
        showId,
        heldIds
      );
    };
  }, [showId]);

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-black px-5 py-20 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
          <Loader2
            size={20}
            className="animate-spin text-red-500"
          />

          <span className="text-sm text-zinc-500">
            Loading seats...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <section className="border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="mt-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500">
                Select Seats
              </p>

              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Choose your seats
              </h1>

              <p className="mt-3 text-sm text-zinc-500">
                Select your seats and complete
                payment within 2 minutes.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Ticket size={17} />

              {selectedSeatIds.length}{" "}
              {selectedSeatIds.length === 1
                ? "seat"
                : "seats"}{" "}
              selected
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Seat map */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-8">
            <SeatMap
              seats={seats}
              selectedSeatIds={
                selectedSeatIds
              }
              onSeatClick={
                handleSeatClick
              }
            />
          </div>

          {/* Summary */}
          <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <Ticket size={19} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Booking Summary
                </h2>

                <p className="text-xs text-zinc-600">
                  Review your selection
                </p>
              </div>
            </div>

            <div className="my-6 h-px bg-white/10" />

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">
                  Seats
                </span>

                <span>
                  {selectedSeats.length}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">
                  Price per seat
                </span>

                <span>
                  ₹{ticketPrice.toFixed(2)}
                </span>
              </div>

              {selectedSeats.length >
                0 && (
                <div>
                  <p className="mb-2 text-xs text-zinc-600">
                    Selected
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map(
                      (seat) => (
                        <span
                          key={seat.id}
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300"
                        >
                          {
                            seat.seat_label
                          }
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="my-6 h-px bg-white/10" />

            {/* Reservation countdown */}
            {secondsLeft !== null &&
              secondsLeft > 0 && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Clock3 size={17} />

                    <span className="text-sm font-semibold">
                      Seats reserved
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-500">
                    Complete your booking
                    within
                  </p>

                  <p className="mt-1 text-2xl font-bold tabular-nums text-yellow-400">
                    {Math.floor(
                      secondsLeft / 60
                    )
                      .toString()
                      .padStart(2, "0")}
                    :
                    {(secondsLeft % 60)
                      .toString()
                      .padStart(2, "0")}
                  </p>
                </div>
              )}

            {/* Show information */}
            {showStartTime && (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-600">
                  Show starts
                </p>

                <p className="mt-1 text-sm text-zinc-300">
                  {new Date(
                    showStartTime
                  ).toLocaleString(
                    "en-IN",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )}
                </p>
              </div>
            )}

            {/* Total */}
            <div className="mt-6 flex items-end justify-between">
              <span className="text-sm text-zinc-500">
                Total
              </span>

              <span className="text-2xl font-bold">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Continue */}
            <button
              type="button"
              disabled={
                reserving ||
                creatingBooking ||
                selectedSeatIds.length ===
                  0 ||
                secondsLeft === 0
              }
              onClick={
                handleContinue
              }
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-4 font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creatingBooking ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Creating booking...
                </>
              ) : reserving ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Reserving...
                </>
              ) : (
                "Continue to Payment"
              )}
            </button>

            <p className="mt-4 text-center text-[11px] leading-5 text-zinc-700">
              Seats are temporarily reserved
              while you complete checkout.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default function BookingSeatPage() {
  return (
    <ProtectedRoute>
      <BookingSeatPageContent />
    </ProtectedRoute>
  );
}