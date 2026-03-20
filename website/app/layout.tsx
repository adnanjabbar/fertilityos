import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Arabic } from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import RootProviders from "./components/RootProviders";
import "./globals.css";
import type { Locale } from "@/i18n/request";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const notoArabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic" });

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
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const isRtl = locale === "ar";
  const bodyFont = isRtl ? notoArabic.className : inter.className;

  return (
    <html
      lang={locale}
      dir={isRtl ? "rtl" : "ltr"}
      className={`${inter.variable} ${jetbrainsMono.variable} ${notoArabic.variable}`}
    >
      <body className={`antialiased ${bodyFont}`}>
        <RootProviders>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
          </NextIntlClientProvider>
        </RootProviders>
      </body>
    </html>
  );
}

