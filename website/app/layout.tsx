import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "FertilityOS — The Operating System for Fertility Care",
  description:
    "FertilityOS is the world's first comprehensive SaaS platform built specifically for fertility clinics and reproductive health centers. Manage patients, IVF cycles, lab workflows, scheduling, billing, and your entire team — in one place.",
  keywords: [
    "fertility clinic software",
    "IVF management system",
    "fertility EMR",
    "embryology software",
    "reproductive health SaaS",
    "fertility center management",
  ],
  openGraph: {
    title: "FertilityOS — The Operating System for Fertility Care",
    description:
      "The world's first SaaS platform built specifically for fertility clinics. Manage every step of patient care, IVF cycles, and clinic operations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

