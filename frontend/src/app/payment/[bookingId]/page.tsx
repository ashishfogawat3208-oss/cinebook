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
  createRazorpayOrder,
  getBooking,
  verifyRazorpayPayment,
} from "@/lib/bookings";

import type { Booking } from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;

  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };

  notes?: {
    booking_id?: string;
  };

  theme?: {
    color?: string;
  };

  modal?: {
    ondismiss?: () => void;
  };

  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

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

  const rawBookingId = params.bookingId;

  const bookingId = Array.isArray(rawBookingId)
    ? rawBookingId[0]
    : String(rawBookingId ?? "");

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [paying, setPaying] =
    useState(false);

  const [expired, setExpired] =
    useState(false);

  const [error, setError] =
    useState("");

  const [razorpayLoaded, setRazorpayLoaded] =
    useState(false);

  /*
   * ==========================================================
   * LOAD RAZORPAY
   * ==========================================================
   */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const existingScript =
      document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

    if (existingScript) {
      const handleLoad = () => {
        setRazorpayLoaded(
          Boolean(window.Razorpay)
        );
      };

      existingScript.addEventListener(
        "load",
        handleLoad
      );

      return () => {
        existingScript.removeEventListener(
          "load",
          handleLoad
        );
      };
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => {
      setRazorpayLoaded(
        Boolean(window.Razorpay)
      );
    };

    script.onerror = () => {
      setError(
        "Unable to load Razorpay checkout. Please refresh and try again."
      );
    };

    document.body.appendChild(script);
  }, []);

  /*
   * ==========================================================
   * LOAD BOOKING
   * ==========================================================
   */

  const loadBooking = useCallback(
    async () => {
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

        const data =
          await getBooking(bookingId);

        setBooking(data);

        /*
         * If backend already says the booking is
         * expired, immediately put the UI into
         * the expired state.
         */
        if (data.status === "EXPIRED") {
          setExpired(true);
        }

        if (
          data.status === "CONFIRMED" ||
          data.status === "FAILED" ||
          data.status === "CANCELLED"
        ) {
          setExpired(false);
        }
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
    },
    [bookingId]
  );

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  /*
   * ==========================================================
   * PAYMENT EXPIRY
   * ==========================================================
   *
   * IMPORTANT:
   *
   * Do NOT call loadBooking() here.
   *
   * Calling the API every time the countdown reaches
   * zero caused the previous refresh loop.
   */

  const handleExpired = useCallback(() => {
    setExpired(true);
    setPaying(false);

    setError(
      "Your payment window has expired. Please select the seats again."
    );
  }, []);

  /*
   * ==========================================================
   * RAZORPAY PAYMENT
   * ==========================================================
   */

  const handlePayment = async () => {
    if (!booking) {
      return;
    }

    /*
     * Never allow payment after local expiry.
     */
    if (expired) {
      setError(
        "This booking has expired. Please select the seats again."
      );
      return;
    }

    if (booking.status !== "PENDING") {
      setError(
        "This booking is no longer available for payment."
      );
      return;
    }

    if (!razorpayLoaded) {
      setError(
        "Razorpay checkout is still loading. Please try again."
      );
      return;
    }

    if (!window.Razorpay) {
      setError(
        "Razorpay checkout is unavailable. Please refresh and try again."
      );
      return;
    }

    try {
      setPaying(true);
      setError("");

      /*
       * Create Razorpay order on the backend.
       */
      const order =
        await createRazorpayOrder(
          booking.booking_id
        );

      /*
       * Double-check that the booking has not
       * expired while creating the order.
       */
      if (expired) {
        setPaying(false);
        setError(
          "Your payment window has expired. Please select the seats again."
        );
        return;
      }

      const options: RazorpayOptions = {
        key: order.key_id,

        amount: order.amount,

        currency: order.currency,

        name: "CineBook",

        description:
          "Movie ticket booking",

        order_id: order.order_id,

        prefill: {
          name: "CineBook User",
        },

        notes: {
          booking_id:
            booking.booking_id,
        },

        theme: {
          color: "#dc2626",
        },

        modal: {
          ondismiss: () => {
            setPaying(false);

            setError(
              "Payment window closed. Your booking is still reserved while the timer is active."
            );
          },
        },

        handler: async (
          razorpayResponse
        ) => {
          try {
            setError("");

            const verification =
              await verifyRazorpayPayment(
                booking.booking_id,
                razorpayResponse.razorpay_order_id,
                razorpayResponse.razorpay_payment_id,
                razorpayResponse.razorpay_signature
              );

            if (
              verification.payment_status ===
                "SUCCESS" &&
              verification.booking_status ===
                "CONFIRMED"
            ) {
              router.push(
                `/booking-confirmation/${booking.booking_id}`
              );

              return;
            }

            setError(
              "Payment verification could not be completed. Please check your booking."
            );
          } catch (err: any) {
            console.error(
              "Payment verification failed:",
              err
            );

            setError(
              err?.response?.data?.detail ||
                "Payment verification failed. Please try again."
            );
          } finally {
            setPaying(false);
          }
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.open();
    } catch (err: any) {
      console.error(
        "Unable to start Razorpay:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to start payment. Please try again."
      );

      setPaying(false);
    }
  };

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <div className="flex min-h-[75vh] items-center justify-center px-5">
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

  /*
   * ==========================================================
   * BOOKING NOT FOUND
   * ==========================================================
   */

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

  /*
   * ==========================================================
   * EXPIRED
   * ==========================================================
   */

  if (
    expired ||
    booking.status === "EXPIRED"
  ) {
    return (
      <BookingStatusPage
        booking={booking}
        title="Booking expired"
        message={
          error ||
          "Your payment window expired. Please select the seats again."
        }
        icon="expired"
      />
    );
  }

  /*
   * ==========================================================
   * OTHER NON-PENDING STATES
   * ==========================================================
   */

  if (booking.status !== "PENDING") {
    return (
      <BookingStatusPage
        booking={booking}
        title={
          booking.status === "CONFIRMED"
            ? "Booking confirmed"
            : booking.status === "FAILED"
            ? "Payment failed"
            : "Booking unavailable"
        }
        message={
          error ||
          (booking.status ===
          "CONFIRMED"
            ? "This booking has already been successfully paid."
            : booking.status ===
              "FAILED"
            ? "The payment could not be completed."
            : `This booking currently has status ${booking.status}.`)
        }
        icon={
          booking.status ===
          "CONFIRMED"
            ? "confirmed"
            : "error"
        }
      />
    );
  }

  /*
   * ==========================================================
   * PAYMENT PAGE
   * ==========================================================
   */

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
          <PaymentSummary
            booking={booking}
          />

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                <CreditCard size={19} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Secure Payment
                </h2>

                <p className="text-xs text-zinc-600">
                  Powered by Razorpay
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
              disabled={
                paying ||
                expired
              }
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
                  <CreditCard size={18} />

                  Pay ₹
                  {Number(
                    booking.total_amount
                  ).toFixed(2)}
                </>
              )}
            </button>

            <p className="mt-4 text-center text-[11px] leading-5 text-zinc-700">
              Secure payment powered by Razorpay.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/*
 * ==========================================================
 * BOOKING STATUS PAGE
 * ==========================================================
 */

function BookingStatusPage({
  booking,
  title,
  message,
  icon,
}: {
  booking: Booking;
  title: string;
  message: string;
  icon: "confirmed" | "expired" | "error";
}) {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="flex min-h-[80vh] items-center justify-center px-5">
        <div className="max-w-lg text-center">
          {icon === "confirmed" ? (
            <CheckCircle2
              size={52}
              className="mx-auto text-green-500"
            />
          ) : icon === "expired" ? (
            <XCircle
              size={52}
              className="mx-auto text-amber-500"
            />
          ) : (
            <AlertCircle
              size={52}
              className="mx-auto text-red-500"
            />
          )}

          <h1 className="mt-6 text-3xl font-bold">
            {title}
          </h1>

          <p className="mt-4 text-sm leading-7 text-zinc-500">
            {message}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {booking.status ===
              "CONFIRMED" && (
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
              Select Seats Again
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}