"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

interface PaymentCountdownProps {
  expiresAt: string | null | undefined;
  onExpired: () => void;
}

export default function PaymentCountdown({
  expiresAt,
  onExpired,
}: PaymentCountdownProps) {
  const calculateRemaining = () => {
    if (!expiresAt) {
      return 0;
    }

    const expires = new Date(expiresAt).getTime();
    const now = Date.now();

    return Math.max(
      0,
      Math.floor((expires - now) / 1000)
    );
  };

  const [remaining, setRemaining] = useState(
    calculateRemaining
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      const next = calculateRemaining();

      setRemaining(next);

      if (next <= 0) {
        window.clearInterval(interval);
        onExpired();
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const urgent = remaining <= 120;

  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
        urgent
          ? "border-red-500/30 bg-red-500/10 text-red-400"
          : "border-yellow-500/20 bg-yellow-500/5 text-yellow-500"
      }`}
    >
      <Clock3 size={17} />

      <span>
        Complete payment within{" "}
        <span className="font-bold tabular-nums">
          {String(minutes).padStart(2, "0")}:
          {String(seconds).padStart(2, "0")}
        </span>
      </span>
    </div>
  );
}