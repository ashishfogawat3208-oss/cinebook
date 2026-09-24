"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { verifyTicket } from "@/lib/bookings";
import type { TicketVerification } from "@/lib/types";

export default function TicketVerificationPage() {
  const params = useParams();

  const verificationCode =
    String(params.verificationCode);

  const [
    verification,
    setVerification,
  ] = useState<TicketVerification | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (
      !verificationCode ||
      verificationCode === "undefined"
    ) {
      setError(
        "Invalid verification code."
      );

      setLoading(false);

      return;
    }

    let active = true;

    async function verify() {
      try {
        setLoading(true);
        setError("");

        const result =
          await verifyTicket(
            verificationCode
          );

        if (!active) {
          return;
        }

        setVerification(result);
      } catch (err) {
        if (!active) {
          return;
        }

        console.error(
          "Ticket verification failed:",
          err
        );

        setError(
          "This ticket could not be verified."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [verificationCode]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl animate-pulse rounded-3xl bg-white/5 p-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/10" />

          <div className="mx-auto mt-6 h-8 w-64 rounded bg-white/10" />

          <div className="mx-auto mt-3 h-4 w-80 max-w-full rounded bg-white/5" />

          <div className="mt-8 space-y-3">
            <div className="h-12 rounded bg-white/5" />
            <div className="h-12 rounded bg-white/5" />
            <div className="h-12 rounded bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !verification) {
    return (
      <main className="min-h-screen bg-black px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <div className="text-5xl">
            ❌
          </div>

          <h1 className="mt-5 text-2xl font-bold text-white">
            Ticket verification failed
          </h1>

          <p className="mt-3 text-sm text-red-200">
            {error ||
              "This ticket could not be verified."}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const isValid = verification.valid;

  return (
    <main className="min-h-screen bg-black px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div
          className={`rounded-3xl border p-8 shadow-2xl ${
            isValid
              ? "border-green-500/20 bg-green-500/10"
              : "border-red-500/20 bg-red-500/10"
          }`}
        >
          <div className="text-center">
            <div className="text-6xl">
              {isValid ? "✓" : "✕"}
            </div>

            <h1 className="mt-5 text-3xl font-black text-white">
              {isValid
                ? "Ticket Verified"
                : "Ticket Invalid"}
            </h1>

            <p className="mt-2 text-sm text-gray-300">
              {isValid
                ? "This ticket is associated with a confirmed booking."
                : "This ticket is not currently valid."}
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="grid grid-cols-1 divide-y divide-white/10">
              <div className="flex justify-between gap-4 p-4">
                <span className="text-sm text-gray-500">
                  Movie
                </span>

                <span className="text-right text-sm font-semibold text-white">
                  {verification.movie}
                </span>
              </div>

              <div className="flex justify-between gap-4 p-4">
                <span className="text-sm text-gray-500">
                  Theater
                </span>

                <span className="text-right text-sm font-semibold text-white">
                  {verification.theater}
                </span>
              </div>

              <div className="flex justify-between gap-4 p-4">
                <span className="text-sm text-gray-500">
                  City
                </span>

                <span className="text-right text-sm font-semibold text-white">
                  {verification.city}
                </span>
              </div>

              <div className="flex justify-between gap-4 p-4">
                <span className="text-sm text-gray-500">
                  Screen
                </span>

                <span className="text-right text-sm font-semibold text-white">
                  {verification.screen}
                </span>
              </div>

              <div className="flex justify-between gap-4 p-4">
                <span className="text-sm text-gray-500">
                  Show
                </span>

                <span className="text-right text-sm font-semibold text-white">
                  {new Date(
                    verification.show_time
                  ).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between gap-4 p-4">
                <span className="text-sm text-gray-500">
                  Seats
                </span>

                <span className="text-right text-sm font-semibold text-white">
                  {verification.seats.join(
                    ", "
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4 p-4">
                <span className="text-sm text-gray-500">
                  Amount
                </span>

                <span className="text-right text-sm font-semibold text-white">
                  ₹
                  {verification.total_amount}
                </span>
              </div>

              <div className="flex justify-between gap-4 p-4">
                <span className="text-sm text-gray-500">
                  Ticket
                </span>

                <span className="break-all text-right text-xs font-medium text-gray-300">
                  {verification.ticket_number}
                </span>
              </div>

              <div className="flex justify-between gap-4 p-4">
                <span className="text-sm text-gray-500">
                  Booking
                </span>

                <span className="break-all text-right text-xs font-medium text-gray-300">
                  {verification.booking_id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}