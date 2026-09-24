import type { Metadata } from "next";

import "./globals.css";

import { AuthProvider } from "@/components/auth/AuthProvider";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "CineBook",
  description:
    "Discover movies, explore theaters, choose your seats and book movie tickets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}