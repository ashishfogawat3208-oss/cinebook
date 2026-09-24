"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Film, Loader2 } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError(
        "Please enter your username and password."
      );
      return;
    }

    try {
      setLoading(true);

      await login(
        username.trim(),
        password
      );

      // After every successful login,
      // send the user to the Home page.
      router.replace("/");
      router.refresh();
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Login failed. Please check your credentials.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left side */}
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(229,9,20,0.35),transparent_35%),linear-gradient(135deg,#100303,#050505_60%)]" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12">
            <Link
              href="/"
              className="flex items-center gap-3 text-xl font-bold"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600">
                <Film size={20} />
              </span>

              CineBook
            </Link>

            <div className="max-w-xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-red-500">
                Your cinema experience
              </p>

              <h1 className="text-6xl font-bold leading-tight">
                Movies.
                <br />
                Seats.
                <br />
                Memories.
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-zinc-400">
                Discover your next movie, find the perfect showtime and
                reserve your seats in seconds.
              </p>
            </div>

            <p className="text-sm text-zinc-500">
              © {new Date().getFullYear()} CineBook
            </p>
          </div>
        </section>

        {/* Right side */}
        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <Link
                href="/"
                className="flex items-center gap-3 text-xl font-bold"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600">
                  <Film size={20} />
                </span>

                CineBook
              </Link>
            </div>

            <div className="mb-8">
              <h2 className="text-4xl font-bold">
                Welcome back
              </h2>

              <p className="mt-3 text-zinc-400">
                Sign in to continue to CineBook.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Username
                </label>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/60 focus:bg-white/[0.07]"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/60 focus:bg-white/[0.07]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 transition hover:text-white"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-zinc-500">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-red-500 transition hover:text-red-400"
              >
                Create one
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}