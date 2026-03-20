import { NextResponse } from "next/server";
import { State } from "country-state-city";
import { getClientIp } from "@/lib/audit";
import { rateLimitPublicGeo } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const ip = getClientIp(request) ?? "unknown";
  if (!rateLimitPublicGeo(`ip:${ip}`).allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.trim().toUpperCase();
  if (!country) {
    return NextResponse.json({ error: "Missing country code" }, { status: 400 });
  }

  const list = State.getStatesOfCountry(country).map((s) => ({
    code: s.isoCode,
    name: s.name,
  }));

  return NextResponse.json(list);
}
