import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getApprovedLocalesFromDb,
  setApprovedLocalesInDb,
} from "@/lib/platform-settings";
import { getApprovedLocales, KNOWN_LOCALE_CODES, type AppLocale } from "@/lib/i18n-config";
import { revalidatePath } from "next/cache";

const patchBody = z.object({
  approvedLocales: z.array(z.string().min(2).max(5)),
});

/**
 * GET /api/app/super/platform-settings — current effective approved locales + DB override if any.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "super_admin") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  const fromDb = await getApprovedLocalesFromDb();
  const envFallback = getApprovedLocales();
  const effective = fromDb ?? envFallback;

  return NextResponse.json({
    approvedLocales: effective,
    storedInDatabase: fromDb != null,
    knownLocales: [...KNOWN_LOCALE_CODES],
  });
}

/**
 * PATCH /api/app/super/platform-settings — set which known locales are live (overrides env for visitors).
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "super_admin") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const codes = parsed.data.approvedLocales.map((s) => s.toLowerCase());
  const valid = codes.filter((c): c is AppLocale =>
    KNOWN_LOCALE_CODES.includes(c as AppLocale)
  );
  if (valid.length === 0) {
    return NextResponse.json(
      { error: "No valid locale codes. Use only locales that exist in the codebase." },
      { status: 400 }
    );
  }

  try {
    await setApprovedLocalesInDb(valid);
    revalidatePath("/", "layout");
    return NextResponse.json({
      success: true,
      approvedLocales: valid,
    });
  } catch (e) {
    console.error("platform-settings PATCH:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 500 }
    );
  }
}
