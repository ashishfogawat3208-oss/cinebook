"use client";

import type { UserProfile } from "@/lib/types";

interface AccountStatsProps {
  profile: UserProfile;
}

export default function AccountStats({
  profile,
}: AccountStatsProps) {
  const joinedDate = new Date(
    profile.date_joined
  ).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm text-gray-400">
          Total bookings
        </p>

        <p className="mt-2 text-3xl font-bold text-white">
          {profile.booking_count}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm text-gray-400">
          Username
        </p>

        <p className="mt-2 truncate text-lg font-semibold text-white">
          @{profile.username}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm text-gray-400">
          Member since
        </p>

        <p className="mt-2 text-lg font-semibold text-white">
          {joinedDate}
        </p>
      </div>
    </div>
  );
}