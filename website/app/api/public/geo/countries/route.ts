import { NextResponse } from "next/server";
import { Country } from "country-state-city";
import { getClientIp } from "@/lib/audit";
import { rateLimitPublicGeo } from "@/lib/rate-limit";

/**
 * Public read-only country list (flags, ISO2, dial codes) for registration and marketing.
 * Authenticated app routes use `/api/app/geo/countries` when a tenant session exists.
 */
export async function GET(request: Request) {
  const ip = getClientIp(request) ?? "unknown";
  if (!rateLimitPublicGeo(`ip:${ip}`).allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const list = Country.getAllCountries().map((c) => ({
    code: c.isoCode,
    name: c.name,
    flag: c.flag ?? undefined,
    phonecode: c.phonecode ?? undefined,
  }));

  return NextResponse.json(list);
}
