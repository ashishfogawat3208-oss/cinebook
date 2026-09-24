"use client";

import { useEffect, useState } from "react";

import type { UserProfile } from "@/lib/types";
import {
  updateProfile,
  type UpdateProfilePayload,
} from "@/lib/profile";

interface ProfileFormProps {
  profile: UserProfile;
  onUpdated: (profile: UserProfile) => void;
}

export default function ProfileForm({
  profile,
  onUpdated,
}: ProfileFormProps) {
  const [form, setForm] = useState<UpdateProfilePayload>({
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    email: profile.email ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      email: profile.email ?? "",
    });
  }, [profile]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
    setError("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updated = await updateProfile(form);

      onUpdated(updated);
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      const detail =
        err?.response?.data?.email?.[0] ||
        err?.response?.data?.detail ||
        "Unable to update your profile.";

      setError(detail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-purple-300">
          Account settings
        </p>

        <h2 className="mt-1 text-2xl font-bold text-white">
          Edit profile
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Update your personal information.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="first_name"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              First name
            </label>

            <input
              id="first_name"
              name="first_name"
              type="text"
              value={form.first_name}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-purple-500"
              placeholder="First name"
            />
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Last name
            </label>

            <input
              id="last_name"
              name="last_name"
              type="text"
              value={form.last_name}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-purple-500"
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Email
          </label>

          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-purple-500"
            placeholder="you@example.com"
          />
        </div>

        {message && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </section>
  );
}