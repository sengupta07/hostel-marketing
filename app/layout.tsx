import "./globals.css";
import { Inter } from "next/font/google";
import type React from "react";
import { Metadata } from "next";
import ClientProviders from "./client-providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hostel Marketing Management",
  description:
    "A one step solution for managing hostel marketing tasks, bills, and budget cycles with role-based access control.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
