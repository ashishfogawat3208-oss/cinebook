"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Film, Loader2 } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await register(
        username.trim(),
        email.trim(),
        password,
        passwordConfirm
      );

      router.push("/movies");
      router.refresh();
    } catch (err: any) {
      const responseData = err?.response?.data;

      if (responseData?.username) {
        setError(responseData.username[0]);
      } else if (responseData?.email) {
        setError(responseData.email[0]);
      } else if (responseData?.password) {
        setError(responseData.password[0]);
      } else if (responseData?.password_confirm) {
        setError(responseData.password_confirm[0]);
      } else if (responseData?.detail) {
        setError(responseData.detail);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left */}
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(229,9,20,0.3),transparent_35%),linear-gradient(135deg,#100303,#050505_65%)]" />

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
                Welcome to CineBook
              </p>

              <h1 className="text-6xl font-bold leading-tight">
                Your next
                <br />
                cinematic
                <br />
                adventure.
              </h1>

              <p className="mt-6 max-w-md text-lg leading-8 text-zinc-400">
                Create your account and make discovering and booking movies
                effortless.
              </p>
            </div>

            <p className="text-sm text-zinc-500">
              © {new Date().getFullYear()} CineBook
            </p>
          </div>
        </section>

        {/* Form */}
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
              <h2 className="text-4xl font-bold">Create account</h2>

              <p className="mt-3 text-zinc-400">
                Start your cinema journey with CineBook.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Choose a username"
                  autoComplete="username"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/60 focus:bg-white/[0.07]"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
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
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/60 focus:bg-white/[0.07]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 transition hover:text-white"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
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

              <div>
                <label
                  htmlFor="password-confirm"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="password-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordConfirm}
                    onChange={(event) =>
                      setPasswordConfirm(event.target.value)
                    }
                    placeholder="Enter your password again"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-12 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/60 focus:bg-white/[0.07]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 transition hover:text-white"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
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
                    <Loader2 size={18} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-red-500 transition hover:text-red-400"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}