import { NextResponse } from "next/server";
import { City } from "country-state-city";
import { getClientIp } from "@/lib/audit";
import { rateLimitPublicGeo } from "@/lib/rate-limit";

const MAX_CITIES = 150;

export async function GET(request: Request) {
  const ip = getClientIp(request) ?? "unknown";
  if (!rateLimitPublicGeo(`ip:${ip}`).allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.trim().toUpperCase();
  const state = searchParams.get("state")?.trim();
  const q = searchParams.get("q")?.trim().toLowerCase();

  if (!country || !state) {
    return NextResponse.json({ error: "Missing country or state" }, { status: 400 });
  }

  let list = City.getCitiesOfState(country, state).map((c) => ({ name: c.name }));

  if (q) {
    list = list.filter((c) => c.name.toLowerCase().includes(q)).slice(0, MAX_CITIES);
  } else {
    list = list.slice(0, MAX_CITIES);
  }

  return NextResponse.json(list);
}
