"use client";

import { useEffect, useState } from "react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/components/auth/AuthProvider";

import { getProfile } from "@/lib/profile";
import type { UserProfile } from "@/lib/types";

import ProfileHeader from "@/components/profile/ProfileHeader";
import AccountStats from "@/components/profile/AccountStats";
import ProfileForm from "@/components/profile/ProfileForm";
import RecommendedSection from "@/components/movies/RecommendedSection";

function ProfilePageContent() {
  const { refreshUser } = useAuth();

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const data =
          await getProfile();

        if (active) {
          setProfile(data);
        }
      } catch (err) {
        console.error(
          "Failed to load profile:",
          err
        );

        if (active) {
          setError(
            "Unable to load your profile."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleProfileUpdated(
    updatedProfile: UserProfile
  ) {
    setProfile(updatedProfile);

    // Keep Navbar/auth state synchronized
    // with the updated profile.
    await refreshUser();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-40 animate-pulse rounded-3xl bg-white/5" />

          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl bg-white/5"
                />
              )
            )}
          </div>

          <div className="h-96 animate-pulse rounded-3xl bg-white/5" />
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-black px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <h1 className="text-2xl font-bold text-white">
            Profile unavailable
          </h1>

          <p className="mt-3 text-sm text-red-200">
            {error ||
              "We couldn't load your profile."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <ProfileHeader profile={profile} />

        <AccountStats profile={profile} />

        <ProfileForm
          profile={profile}
          onUpdated={handleProfileUpdated}
        />

        <RecommendedSection />
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}