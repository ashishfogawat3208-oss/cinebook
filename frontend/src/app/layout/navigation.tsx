"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";

export default function Navbar() {
  const pathname = usePathname();

  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-black text-white">
            M
          </div>

          <span className="text-lg font-bold tracking-tight text-white">
            Movie<span className="text-purple-400">Booking</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive("/")
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            Home
          </Link>

          <Link
            href="/movies"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive("/movies")
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            Movies
          </Link>

          {user && (
            <Link
              href="/bookings"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                isActive("/bookings")
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              My Bookings
            </Link>
          )}

          {user && (
            <Link
              href="/profile"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                isActive("/profile")
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Profile
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="max-w-32 truncate text-sm font-medium text-white">
                  {user.username}
                </p>

                <p className="text-xs text-gray-500">
                  Account
                </p>
              </div>

              <Link
                href="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white transition hover:bg-white/20"
                title="Profile"
              >
                {user.username?.[0]?.toUpperCase() || "U"}
              </Link>

              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="border-t border-white/5 md:hidden">
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          <Link
            href="/"
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
              isActive("/")
                ? "bg-white/10 text-white"
                : "text-gray-400"
            }`}
          >
            Home
          </Link>

          <Link
            href="/movies"
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
              isActive("/movies")
                ? "bg-white/10 text-white"
                : "text-gray-400"
            }`}
          >
            Movies
          </Link>

          {user && (
            <>
              <Link
                href="/bookings"
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  isActive("/bookings")
                    ? "bg-white/10 text-white"
                    : "text-gray-400"
                }`}
              >
                Bookings
              </Link>

              <Link
                href="/profile"
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  isActive("/profile")
                    ? "bg-white/10 text-white"
                    : "text-gray-400"
                }`}
              >
                Profile
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}