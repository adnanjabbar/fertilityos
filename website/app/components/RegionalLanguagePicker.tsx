"use client";

import { useMemo, useState, useTransition } from "react";
import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Country } from "country-state-city";
import {
  COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALE_DISPLAY,
  type AppLocale,
} from "@/lib/i18n-config";
import {
  COUNTRIES_BY_CONTINENT,
  CONTINENT_KEYS,
  type ContinentKey,
} from "@/lib/language-picker-data";
import type { Locale } from "@/i18n/request";
import { useApprovedLocales } from "@/app/components/useApprovedLocales";

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export default function RegionalLanguagePicker({
  className = "",
  variant = "button",
}: {
  className?: string;
  /** `button` = navbar style; `link` = text link */
  variant?: "button" | "link";
}) {
  const t = useTranslations("landing.languagePicker");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const approved = useApprovedLocales();

  const [continent, setContinent] = useState<ContinentKey>("americas");

  const countryCards = useMemo(() => {
    const countryRows = COUNTRIES_BY_CONTINENT[continent] ?? [];
    return countryRows
      .map((row) => {
        const c = Country.getCountryByCode(row.iso);
        if (!c) return null;
        const langs = [...new Set(row.languages)].filter((l) => approved.includes(l));
        if (langs.length === 0) return null;
        return {
          iso: row.iso,
          name: c.name,
          flag: c.flag,
          currency: c.currency || "USD",
          languages: langs,
        };
      })
      .filter(Boolean) as {
      iso: string;
      name: string;
      flag: string;
      currency: string;
      languages: AppLocale[];
    }[];
  }, [continent, approved]);

  const applyLocale = (loc: AppLocale) => {
    setLocaleCookie(loc);
    setOpen(false);
    startTransition(() => router.refresh());
  };

  return (
    <>
      {variant === "link" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`text-sm font-medium text-slate-600 hover:text-blue-700 ${className}`}
        >
          {t("trigger")}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={isPending}
          className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-800 disabled:opacity-60 ${className}`}
          aria-label={t("openAria")}
        >
          <Globe className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{t("trigger")}</span>
        </button>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lang-picker-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-slate-100 shrink-0 bg-gradient-to-r from-slate-50 to-blue-50/40">
              <h2 id="lang-picker-title" className="text-xl font-extrabold text-slate-900 tracking-tight">
                {t("title")}
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">{t("subtitle")}</p>
            </div>

            <div className="flex flex-1 min-h-0 min-h-[320px]">
              <nav
                className="hidden sm:flex w-44 shrink-0 flex-col gap-1 p-3 border-r border-slate-100 bg-slate-50/50 overflow-y-auto"
                aria-label={t("continent")}
              >
                {CONTINENT_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setContinent(key)}
                    className={`text-left px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      continent === key
                        ? "bg-blue-700 text-white shadow-md"
                        : "text-slate-700 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    {t(`continents.${key}`)}
                  </button>
                ))}
              </nav>

              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <div className="sm:hidden p-3 border-b border-slate-100 bg-white">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t("continent")}
                  </label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium"
                    value={continent}
                    onChange={(e) => setContinent(e.target.value as ContinentKey)}
                  >
                    {CONTINENT_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {t(`continents.${key}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {countryCards
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((c) => (
                        <div
                          key={c.iso}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300/80 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-2xl leading-none" aria-hidden>
                              {c.flag}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 leading-tight">{c.name}</p>
                              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                {t("defaultCurrency")}: {c.currency}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {c.languages.map((lang) => (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => applyLocale(lang)}
                                disabled={isPending}
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-slate-50 to-blue-50/60 border border-slate-200 text-slate-800 hover:border-blue-400 hover:from-blue-50 hover:to-teal-50 disabled:opacity-60 transition-all"
                              >
                                <span>{LOCALE_DISPLAY[lang]}</span>
                                <span className="text-slate-400 font-normal">|</span>
                                <span className="tabular-nums text-teal-700">{c.currency}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                  {countryCards.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-12">{t("noCountriesForLocale")}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/90 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t("quick")}</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {approved.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => applyLocale(loc)}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors disabled:opacity-60"
                    >
                      {LOCALE_DISPLAY[loc]}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-white self-end sm:self-center"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
