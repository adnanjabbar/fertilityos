"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import type { Locale } from "@/i18n/request";

const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

type LanguageSwitcherProps = {
  variant?: "dropdown" | "buttons";
  className?: string;
};

export default function LanguageSwitcher({
  variant = "dropdown",
  className = "",
}: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("locale");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    setLocaleCookie(newLocale);
    startTransition(() => {
      router.refresh();
    });
  };

  const locales: { value: Locale; label: string }[] = [
    { value: "en", label: t("en") },
    { value: "es", label: t("es") },
  ];

  if (variant === "buttons") {
    return (
      <div
        className={`flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 ${className}`}
        role="group"
        aria-label="Language"
      >
        {locales.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => switchLocale(value)}
            disabled={isPending}
            className={`rounded-md px-2.5 py-1 text-sm font-medium transition-colors ${
              locale === value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            } ${isPending ? "opacity-70" : ""}`}
            aria-pressed={locale === value}
            aria-label={`Switch to ${label}`}
          >
            {value.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value as Locale)}
        disabled={isPending}
        className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-70"
        aria-label="Select language"
      >
        {locales.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
        ▼
      </span>
    </div>
  );
}
