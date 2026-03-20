/**
 * Single source for which locale JSON files exist in the repo vs which are enabled in production.
 * Add new languages: 1) add `xx.json` under messages/, 2) extend KNOWN_LOCALE_CODES, 3) deploy with APPROVED_LOCALES when ready.
 */

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
export const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year (seconds)

/**
 * Locales that have a `messages/{code}.json` file (merged on top of `en`).
 * To add e.g. German: create `messages/de.json`, append `"de"` here, add `de: "Deutsch"` to LOCALE_DISPLAY,
 * extend `locale` keys in other message files if needed, and add `de` to relevant rows in `language-picker-data.ts`.
 */
export const KNOWN_LOCALE_CODES = ["en", "es", "ar", "fr"] as const;
export type AppLocale = (typeof KNOWN_LOCALE_CODES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

/** Native-language labels for the switcher and region picker (single source of truth). */
export const LOCALE_DISPLAY: Record<AppLocale, string> = {
  en: "English",
  es: "Español",
  ar: "العربية",
  fr: "Français",
};

/**
 * Locales actually offered to users (cookie + picker + switcher).
 * Set `NEXT_PUBLIC_APPROVED_LOCALES=en,es` to ship only English + Spanish while `ar.json` is reviewed.
 */
export function getApprovedLocales(): AppLocale[] {
  const raw = process.env.NEXT_PUBLIC_APPROVED_LOCALES?.trim();
  if (!raw) {
    return [...KNOWN_LOCALE_CODES];
  }
  const want = new Set(raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
  const picked = KNOWN_LOCALE_CODES.filter((l) => want.has(l));
  return picked.length > 0 ? picked : [DEFAULT_LOCALE];
}

export function isApprovedLocale(code: string): code is AppLocale {
  return (
    KNOWN_LOCALE_CODES.includes(code as AppLocale) &&
    getApprovedLocales().includes(code as AppLocale)
  );
}
