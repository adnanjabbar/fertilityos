import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { City } from "country-state-city";

const MAX_CITIES = 150;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
