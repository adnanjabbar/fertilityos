import { eq } from "drizzle-orm";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import {
  getApprovedLocales,
  KNOWN_LOCALE_CODES,
  type AppLocale,
} from "@/lib/i18n-config";

export const PLATFORM_SETTING_APPROVED_LOCALES = "approved_locales" as const;

function normalizeApprovedFromJson(value: unknown): AppLocale[] | null {
  if (!Array.isArray(value)) return null;
  const list = value
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const filtered = KNOWN_LOCALE_CODES.filter((l) => list.includes(l));
  return filtered.length > 0 ? filtered : null;
}

/** Returns locales from DB if a row exists and is non-empty; otherwise null (caller uses env fallback). */
export async function getApprovedLocalesFromDb(): Promise<AppLocale[] | null> {
  try {
    const rows = await db
      .select({ value: platformSettings.value })
      .from(platformSettings)
      .where(eq(platformSettings.settingKey, PLATFORM_SETTING_APPROVED_LOCALES))
      .limit(1);
    return normalizeApprovedFromJson(rows[0]?.value);
  } catch {
    return null;
  }
}

/**
 * Locales offered on the site: DB (super admin) wins when set; else `NEXT_PUBLIC_APPROVED_LOCALES` / all known.
 */
export async function resolveApprovedLocales(): Promise<AppLocale[]> {
  const fromDb = await getApprovedLocalesFromDb();
  if (fromDb && fromDb.length > 0) return fromDb;
  return getApprovedLocales();
}

export async function setApprovedLocalesInDb(locales: AppLocale[]): Promise<void> {
  const unique = [...new Set(locales)].filter((l) =>
    KNOWN_LOCALE_CODES.includes(l)
  ) as AppLocale[];
  if (unique.length === 0) {
    throw new Error("At least one valid locale is required");
  }
  await db
    .insert(platformSettings)
    .values({
      settingKey: PLATFORM_SETTING_APPROVED_LOCALES,
      value: unique,
    })
    .onConflictDoUpdate({
      target: [platformSettings.settingKey],
      set: {
        value: unique,
        updatedAt: new Date(),
      },
    });
}
