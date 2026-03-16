import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { State } from "country-state-city";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
