"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PaymentCountdown from "@/components/booking/PaymentCountdown";
import PaymentSummary from "@/components/booking/PaymentSummary";

import {
  getBooking,
  makeMockPayment,
} from "@/lib/bookings";

import type { Booking } from "@/lib/types";

export default function PaymentPage() {
  return (
    <ProtectedRoute>
      <PaymentPageContent />
    </ProtectedRoute>
  );
}

function PaymentPageContent() {
  const params = useParams();
  const router = useRouter();

  /*
   * The route folder is:
   *
   * app/payment/[bookingId]/page.tsx
   *
   * Therefore Next.js normally provides:
   *
   * params.bookingId
   *
   * We also support params.bookingid temporarily so
   * an old HMR route/cache does not break the booking.
   */
  const rawBookingId =
    params.bookingId ?? params.bookingid;

  const bookingId = Array.isArray(rawBookingId)
    ? rawBookingId[0]
    : String(rawBookingId ?? "");

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const loadBooking = useCallback(async () => {
    if (
      !bookingId ||
      bookingId === "undefined" ||
      bookingId === "null"
    ) {
      setBooking(null);
      setError("Invalid booking ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getBooking(bookingId);

      setBooking(data);
    } catch (err: any) {
      console.error(
        "Failed to load booking:",
        err
      );

      setBooking(null);

      setError(
        err?.response?.data?.detail ||
          "Unable to load this booking."
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleExpired = useCallback(() => {
    setError(
      "Your payment window has expired. Please create a new booking."
    );
  }, []);

  const handlePayment = async () => {
    if (!booking) {
      return;
    }

    if (booking.status !== "PENDING") {
      setError(
        "This booking is no longer available for payment."
      );

      return;
    }

    try {
      setPaying(true);
      setError("");

      const response = await makeMockPayment(
        booking.booking_id,
        true
      );

      if (
        response.payment_status === "SUCCESS" &&
        response.booking_status === "CONFIRMED"
      ) {
        router.push(
          `/booking-confirmation/${booking.booking_id}`
        );

        return;
      }

      setError(
        "Payment was not completed. Please try again."
      );
    } catch (err: any) {
      console.error(
        "Payment failed:",
        err
      );

      const message =
        err?.response?.data?.detail ||
        "Payment failed. Please try again.";

      setError(message);

      await loadBooking();
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">

        <div className="flex min-h-[75vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-zinc-500">
            <Loader2
              size={32}
              className="animate-spin text-red-500"
            />

            <p className="text-sm">
              Loading payment details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">

        <div className="flex min-h-[75vh] items-center justify-center px-5">
          <div className="max-w-md text-center">
            <AlertCircle
              size={42}
              className="mx-auto mb-5 text-red-500"
            />

            <h1 className="text-2xl font-bold">
              Booking unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {error}
            </p>

            <button
              type="button"
              onClick={loadBooking}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (booking.status !== "PENDING") {
    return (
      <BookingStatusPage
        booking={booking}
        error={error}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(229,9,20,0.12),transparent_45%)]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <Link
            href="/movies"
            className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to movies
          </Link>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              Secure checkout
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Complete your booking
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              Your selected seats are temporarily reserved.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        <PaymentCountdown
          expiresAt={booking.expires_at}
          onExpired={handleExpired}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <PaymentSummary booking={booking} />

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                <CreditCard size={19} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Payment
                </h2>

                <p className="text-xs text-zinc-600">
                  Secure mock payment
                </p>
              </div>
            </div>

            <div className="my-6 h-px bg-white/10" />

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">
                  Amount payable
                </span>

                <span className="text-xl font-bold">
                  ₹
                  {Number(
                    booking.total_amount
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 text-xs leading-5 text-zinc-600">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-green-500"
              />

              Your seats remain reserved only while the
              payment window is active.
            </div>

            <button
              type="button"
              disabled={paying}
              onClick={handlePayment}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-4 font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {paying ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Processing payment...
                </>
              ) : (
                <>
                  Pay ₹
                  {Number(
                    booking.total_amount
                  ).toFixed(2)}
                </>
              )}
            </button>

            <p className="mt-4 text-center text-[11px] leading-5 text-zinc-700">
              This development environment currently uses
              a mock payment processor.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function BookingStatusPage({
  booking,
  error,
}: {
  booking: Booking;
  error: string;
}) {
  const isConfirmed =
    booking.status === "CONFIRMED";

  return (
    <main className="min-h-screen bg-[#050505] text-white">

      <div className="mx-auto flex min-h-[75vh] max-w-2xl items-center justify-center px-5 py-16">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center sm:p-12">
          {isConfirmed ? (
            <CheckCircle2
              size={56}
              className="mx-auto text-green-500"
            />
          ) : (
            <XCircle
              size={56}
              className="mx-auto text-red-500"
            />
          )}

          <h1 className="mt-6 text-3xl font-bold">
            {isConfirmed
              ? "Booking already confirmed"
              : "Booking is no longer payable"}
          </h1>

          <p className="mt-4 text-sm leading-7 text-zinc-500">
            {error ||
              (isConfirmed
                ? "This booking has already been successfully paid."
                : `This booking currently has status ${booking.status}.`)}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {isConfirmed && (
              <Link
                href={`/booking-confirmation/${booking.booking_id}`}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
              >
                View Booking
              </Link>
            )}

            <Link
              href="/movies"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
            >
              Browse Movies
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}