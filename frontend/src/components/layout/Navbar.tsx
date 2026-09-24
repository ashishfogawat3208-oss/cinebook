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
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-lg font-bold text-white">
            M
          </div>

          <span className="text-lg font-bold tracking-tight text-white">
            MovieBooking
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
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* User */}
              <Link
                href="/profile"
                className="hidden items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-white/5 sm:flex"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
                  {(user.first_name?.[0] ||
                    user.username?.[0] ||
                    "U").toUpperCase()}
                </div>

                <span className="max-w-[120px] truncate text-sm font-medium text-white">
                  {user.first_name || user.username}
                </span>
              </Link>

              {/* Logout */}
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="border-t border-white/5 md:hidden">
        <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2">
          <Link
            href="/"
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive("/")
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            Home
          </Link>

          <Link
            href="/movies"
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive("/movies")
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            Movies
          </Link>

          <Link
            href="/bookings"
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive("/bookings")
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            My Bookings
          </Link>

          <Link
            href="/profile"
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              isActive("/profile")
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}