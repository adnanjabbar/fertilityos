import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import enMessages from "../messages/en.json";
import {
  DEFAULT_LOCALE,
  KNOWN_LOCALE_CODES,
  LOCALE_COOKIE_NAME,
  type AppLocale,
} from "@/lib/i18n-config";
import { resolveApprovedLocales } from "@/lib/platform-settings";

/** All locale codes that have message files (may exceed `NEXT_PUBLIC_APPROVED_LOCALES`). */
export const locales = KNOWN_LOCALE_CODES;
export const defaultLocale = DEFAULT_LOCALE;
export type Locale = AppLocale;

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/** Deep-merge locale overrides onto English (arrays and scalars from override replace). */
function deepMerge(base: unknown, override: unknown): unknown {
  if (override === undefined) return base;
  if (Array.isArray(override)) return override;
  if (!isPlainObject(base) || !isPlainObject(override)) return override;
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(override)) {
    const b = base[k];
    const o = override[k];
    if (o === undefined) continue;
    out[k] = deepMerge(b, o);
  }
  return out;
}

export default getRequestConfig(async () => {
  const approvedLocales = await resolveApprovedLocales();
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale: Locale =
    localeCookie &&
    KNOWN_LOCALE_CODES.includes(localeCookie as AppLocale) &&
    approvedLocales.includes(localeCookie as AppLocale)
      ? (localeCookie as Locale)
      : defaultLocale;

  let messages: typeof enMessages = enMessages;
  if (locale !== "en") {
    const loc = (await import(`../messages/${locale}.json`)).default;
    messages = deepMerge(enMessages, loc) as typeof enMessages;
  }

  return {
    locale,
    messages,
  };
});
