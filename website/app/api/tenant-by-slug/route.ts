import { NextResponse } from "next/server";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/tenant-by-slug?slug=demo-clinic
 * Returns tenant id, name, slug when visiting a subdomain (e.g. demo-clinic.thefertilityos.com).
 * Used by the app to show clinic name or pre-fill context. Public read.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim().toLowerCase();
  if (!slug || slug.length > 64) {
    return NextResponse.json({ error: "Missing or invalid slug" }, { status: 400 });
  }

  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}
