import { NextResponse } from "next/server";
import { resolveApprovedLocales } from "@/lib/platform-settings";
import { LOCALE_DISPLAY } from "@/lib/i18n-config";

/**
 * GET /api/public/site-config
 * Approved UI locales (DB + env). Used by language switcher / mega menu after hydration.
 */
export async function GET() {
  try {
    const approvedLocales = await resolveApprovedLocales();
    const localeLabels = Object.fromEntries(
      approvedLocales.map((l) => [l, LOCALE_DISPLAY[l]])
    ) as Record<string, string>;
    return NextResponse.json({ approvedLocales, localeLabels });
  } catch (e) {
    console.error("site-config error:", e);
    return NextResponse.json(
      { error: "Failed to load site configuration" },
      { status: 500 }
    );
  }
}
