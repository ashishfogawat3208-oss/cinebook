"use client";

import type { UserProfile } from "@/lib/types";

interface ProfileHeaderProps {
  profile: UserProfile;
}

export default function ProfileHeader({
  profile,
}: ProfileHeaderProps) {
  const initials =
    `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`
      .toUpperCase() || profile.username[0]?.toUpperCase();

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold text-white shadow-lg shadow-purple-500/20">
          {initials}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-purple-300">
            Your account
          </p>

          <h1 className="mt-1 truncate text-3xl font-bold text-white">
            {profile.first_name || profile.last_name
              ? `${profile.first_name} ${profile.last_name}`.trim()
              : profile.username}
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            @{profile.username}
          </p>
        </div>
      </div>
    </section>
  );
}