import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { tenants, users, userSessions } from "@/db/schema";
import { and, eq, inArray, like, or } from "drizzle-orm";

const DEMO_EMAIL = "thefertilityos@gmail.com";
const DEMO_PASSWORD = "demo";
const DEMO_TENANT_SLUG = "demo-clinic";
const DEMO_TENANT_NAME = "Demo Clinic";

function getSecretFromRequest(request: Request): string | null {
  const secret = process.env.SEED_DEMO_SECRET;
  if (!secret) return null;
  const url = new URL(request.url);
  const provided = url.searchParams.get("secret") ?? request.headers.get("x-seed-secret");
  return provided === secret ? secret : null;
}

async function runSeed() {
  const [existingTenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, DEMO_TENANT_SLUG))
    .limit(1);

  let tenantId: string;
  if (!existingTenant) {
    const [inserted] = await db
      .insert(tenants)
      .values({ name: DEMO_TENANT_NAME, slug: DEMO_TENANT_SLUG, country: "US" })
      .returning({ id: tenants.id });
    if (!inserted) throw new Error("Failed to create tenant");
    tenantId = inserted.id;
  } else {
    tenantId = existingTenant.id;
  }

  const oldDemoUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenantId),
        or(
          eq(users.email, "demo"),
          eq(users.email, "demo@thefertilityos.com"),
          eq(users.email, DEMO_EMAIL),
          like(users.email, "demo@%")
        )
      )
    );
  if (oldDemoUsers.length > 0) {
    const ids = oldDemoUsers.map((u) => u.id);
    await db.delete(userSessions).where(inArray(userSessions.userId, ids));
    await db.delete(users).where(inArray(users.id, ids));
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  await db.insert(users).values({
    tenantId,
    email: DEMO_EMAIL,
    passwordHash,
    fullName: "Demo User",
    roleSlug: "admin",
  });
}

/**
 * GET /api/admin/seed-demo?secret=YOUR_SECRET
 * Run the demo seed by opening this URL in your browser. No terminal or PuTTY needed.
 */
export async function GET(request: Request) {
  if (!process.env.SEED_DEMO_SECRET) {
    return new NextResponse(
      "<!DOCTYPE html><html><body><h1>Seed not configured</h1><p>Set SEED_DEMO_SECRET in your app environment.</p></body></html>",
      { status: 404, headers: { "Content-Type": "text/html" } }
    );
  }
  const valid = getSecretFromRequest(request);
  if (!valid) {
    return new NextResponse(
      "<!DOCTYPE html><html><body><h1>Forbidden</h1><p>Wrong or missing secret. Use: ?secret=YOUR_SEED_DEMO_SECRET</p></body></html>",
      { status: 403, headers: { "Content-Type": "text/html" } }
    );
  }
  try {
    await runSeed();
    const base = request.headers.get("x-forwarded-proto") && request.headers.get("host")
      ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}`
      : "https://www.thefertilityos.com";
    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Demo ready</title></head><body style="font-family:sans-serif;max-width:480px;margin:3rem auto;padding:1rem;"><h1>Demo account ready</h1><p>You can now sign in with:</p><p><strong>Email:</strong> thefertilityos@gmail.com<br><strong>Password:</strong> demo</p><p><a href="${base}/login" style="display:inline-block;background:#2563eb;color:white;padding:0.5rem 1rem;text-decoration:none;border-radius:0.5rem;">Go to Sign in</a></p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (e) {
    console.error("seed-demo error:", e);
    return new NextResponse(
      `<!DOCTYPE html><html><body><h1>Error</h1><p>${e instanceof Error ? e.message : "Seed failed"}</p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}

/**
 * POST /api/admin/seed-demo?secret=YOUR_SEED_DEMO_SECRET
 */
export async function POST(request: Request) {
  if (!process.env.SEED_DEMO_SECRET) {
    return NextResponse.json({ error: "Seed not configured" }, { status: 404 });
  }
  if (!getSecretFromRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await runSeed();
    return NextResponse.json({
      success: true,
      message: "Demo account ready. Login: thefertilityos@gmail.com / demo",
    });
  } catch (e) {
    console.error("seed-demo error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Seed failed" },
      { status: 500 }
    );
  }
}
