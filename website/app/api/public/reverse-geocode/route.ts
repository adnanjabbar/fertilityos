import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  lat: z.string().regex(/^-?\d+(\.\d+)?$/),
  lon: z.string().regex(/^-?\d+(\.\d+)?$/),
});

/**
 * GET /api/public/reverse-geocode?lat=&lon=
 * Proxies OpenStreetMap Nominatim (identifying User-Agent required by their policy).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    lat: searchParams.get("lat") ?? "",
    lon: searchParams.get("lon") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 });
  }

  const { lat, lon } = parsed.data;
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FertilityOS/1.0 (https://thefertilityos.com)",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 502 }
      );
    }
    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const a = data.address ?? {};
    return NextResponse.json({
      displayName: data.display_name ?? "",
      road: a.road ?? a.pedestrian ?? "",
      city:
        a.city ??
        a.town ??
        a.village ??
        a.municipality ??
        a.hamlet ??
        "",
      state: a.state ?? a.region ?? a.province ?? "",
      countryCode: (a.country_code ?? "").toUpperCase(),
      postcode: a.postcode ?? "",
    });
  } catch (e) {
    console.error("reverse-geocode:", e);
    return NextResponse.json({ error: "Reverse geocode failed" }, { status: 500 });
  }
}
