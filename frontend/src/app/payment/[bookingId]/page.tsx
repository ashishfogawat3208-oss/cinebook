"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";

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

  const bookingId = String(params.bookingId);

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [paying, setPaying] =
    useState(false);

  const [error, setError] =
    useState("");

  const [razorpayLoaded, setRazorpayLoaded] =
    useState(false);

  /*
   * ==========================================================
   * LOAD RAZORPAY SCRIPT
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

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  /*
   * ==========================================================
   * LOAD BOOKING
   * ==========================================================
   */

  const loadBooking = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getBooking(bookingId);

        setBooking(data);
      } catch (err: any) {
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
   */

  const handleExpired = useCallback(() => {
    setError(
      "Your payment window has expired. Please create a new booking."
    );

    loadBooking();
  }, [loadBooking]);

  /*
   * ==========================================================
   * OPEN RAZORPAY
   * ==========================================================
   */

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

    if (!razorpayLoaded) {
      setError(
        "Razorpay checkout is still loading. Please try again."
      );
      return;
    }

    if (!window.Razorpay) {
      setError(
        "Razorpay checkout is unavailable. Please refresh the page."
      );
      return;
    }

    try {
      setPaying(true);
      setError("");

      /*
       * Step 1:
       * Ask Django to create/reuse a Razorpay order.
       */

      const order =
        await createRazorpayOrder(
          booking.booking_id
        );

      /*
       * Step 2:
       * Configure Razorpay Checkout.
       */

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
          /*
           * Closing Razorpay does NOT fail
           * the booking.
           *
           * The user can retry while the
           * booking timer is active.
           */
          ondismiss: () => {
            setPaying(false);

            setError(
              "Payment window closed. Your booking is still reserved while the timer is active."
            );
          },
        },

        /*
         * Step 3:
         * Razorpay returns payment information.
         */
        handler: async (
          razorpayResponse
        ) => {
          try {
            setError("");

            /*
             * Step 4:
             * Send Razorpay response to Django.
             *
             * Django verifies the signature
             * server-side.
             */

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
              "Payment was received but booking confirmation could not be completed. Please refresh your booking."
            );

            await loadBooking();
          } catch (
            verificationError: any
          ) {
            setError(
              verificationError?.response?.data
                ?.detail ||
                "Payment verification failed. Please contact support if money was deducted."
            );

            await loadBooking();
          } finally {
            setPaying(false);
          }
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.open();
    } catch (err: any) {
      setPaying(false);

      setError(
        err?.response?.data?.detail ||
          "Unable to start payment. Please try again."
      );

      await loadBooking();
    }
  };

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   *
   * IMPORTANT:
   * Navbar is NOT rendered here.
   * Root layout already renders it.
   */

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
            <XCircle
              size={52}
              className="mx-auto text-red-500"
            />

            <h1 className="mt-6 text-2xl font-bold">
              Booking unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              {error ||
                "We couldn't find this booking."}
            </p>

            <Link
              href="/movies"
              className="mt-7 inline-flex rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold transition hover:bg-red-700"
            >
              Browse Movies
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ==========================================================
   * ALREADY CONFIRMED / EXPIRED / FAILED
   * ==========================================================
   */

  if (booking.status !== "PENDING") {
    return (
      <BookingStatusPage
        booking={booking}
        error={error}
      />
    );
  }

  /*
   * ==========================================================
   * PAYMENT UI
   * ==========================================================
   */

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <Link
            href="/movies"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to movies
          </Link>

          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
            Complete your booking
          </h1>

          <p className="mt-3 text-sm text-zinc-500">
            Your selected seats are temporarily
            reserved.
          </p>
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

              <span>
                Your payment is processed through
                Razorpay. CineBook confirms the
                booking only after server-side
                payment verification.
              </span>
            </div>

            <button
              type="button"
              disabled={
                paying ||
                !razorpayLoaded
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
                  Opening secure checkout...
                </>
              ) : !razorpayLoaded ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Loading payment...
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
              Do not refresh the page while payment
              is being processed.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/*
 * ============================================================
 * BOOKING STATUS PAGE
 * ============================================================
 */

function BookingStatusPage({
  booking,
  error,
}: {
  booking: Booking;
  error: string;
}) {
  const isConfirmed =
    booking.status === "CONFIRMED";

  const isFailed =
    booking.status === "FAILED";

  const isExpired =
    booking.status === "EXPIRED";

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
              ? "Booking confirmed"
              : isExpired
              ? "Booking expired"
              : isFailed
              ? "Payment failed"
              : "Booking is no longer payable"}
          </h1>

          <p className="mt-4 text-sm leading-7 text-zinc-500">
            {error ||
              (isConfirmed
                ? "This booking has already been successfully paid."
                : isExpired
                ? "Your payment window expired. Please select the seats again."
                : isFailed
                ? "The payment could not be completed."
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