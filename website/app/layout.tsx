import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import Providers from "./components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "FertilityOS — The Operating System for Fertility Care",
  description:
    "FertilityOS is the world's first comprehensive SaaS platform built specifically for fertility clinics and reproductive health centers. Manage patients, IVF cycles, lab workflows, scheduling, billing, and your entire team — in one place.",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: { width: "device-width", initialScale: 1, maximumScale: 5 },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <Providers>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}

