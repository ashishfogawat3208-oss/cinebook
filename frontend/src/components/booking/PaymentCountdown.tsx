"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Clock3,
} from "lucide-react";

interface PaymentCountdownProps {
  expiresAt?: string | null;
  onExpired?: () => void;
}

export default function PaymentCountdown({
  expiresAt,
  onExpired,
}: PaymentCountdownProps) {
  const calculateRemaining =
    () => {
      if (!expiresAt) {
        return 0;
      }

      const expiry =
        new Date(expiresAt).getTime();

      const now = Date.now();

      return Math.max(
        0,
        Math.floor(
          (expiry - now) / 1000
        )
      );
    };

  const [secondsLeft, setSecondsLeft] =
    useState(calculateRemaining);

  const [
    expiredHandled,
    setExpiredHandled,
  ] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const update = () => {
      const remaining =
        calculateRemaining();

      setSecondsLeft(remaining);

      if (
        remaining <= 0 &&
        !expiredHandled
      ) {
        setExpiredHandled(true);

        onExpired?.();
      }
    };

    update();

    const interval =
      window.setInterval(
        update,
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    expiresAt,
    expiredHandled,
    onExpired,
  ]);

  const minutes = Math.floor(
    secondsLeft / 60
  );

  const seconds =
    secondsLeft % 60;

  const formattedTime =
    `${minutes
      .toString()
      .padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

  const isExpired =
    secondsLeft <= 0;

  const isUrgent =
    secondsLeft > 0 &&
    secondsLeft <= 30;

  const message = useMemo(() => {
    if (isExpired) {
      return "Payment window expired";
    }

    if (isUrgent) {
      return "Complete payment now";
    }

    return "Complete payment before the timer ends";
  }, [isExpired, isUrgent]);

  return (
    <div
      className={[
        "rounded-2xl border p-5 transition",
        isExpired
          ? "border-red-500/30 bg-red-500/5"
          : isUrgent
            ? "border-yellow-500/30 bg-yellow-500/5"
            : "border-white/10 bg-white/[0.03]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={[
              "flex h-10 w-10 items-center justify-center rounded-xl",
              isExpired
                ? "bg-red-500/10 text-red-400"
                : isUrgent
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-white/5 text-zinc-400",
            ].join(" ")}
          >
            {isExpired ? (
              <AlertTriangle size={18} />
            ) : (
              <Clock3 size={18} />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold">
              {message}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Your selected seats are held
              temporarily.
            </p>
          </div>
        </div>

        <div
          className={[
            "font-mono text-2xl font-bold tabular-nums",
            isExpired
              ? "text-red-400"
              : isUrgent
                ? "text-yellow-400"
                : "text-white",
          ].join(" ")}
        >
          {formattedTime}
        </div>
      </div>

      {!isExpired && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            className={[
              "h-full rounded-full transition-all duration-1000",
              isUrgent
                ? "bg-yellow-500"
                : "bg-red-500",
            ].join(" ")}
            style={{
              width: `${Math.min(
                100,
                (secondsLeft /
                  120) *
                  100
              )}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}