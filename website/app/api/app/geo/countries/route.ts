import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Country } from "country-state-city";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = Country.getAllCountries().map((c) => ({
    code: c.isoCode,
    name: c.name,
    flag: c.flag ?? undefined,
    phonecode: c.phonecode ?? undefined,
  }));

  return NextResponse.json(list);
}
