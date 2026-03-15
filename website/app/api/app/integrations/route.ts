import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenantIntegrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const PATCH_BODY = z.object({
  twilioAccountSid: z.string().trim().optional(),
  twilioAuthToken: z.string().trim().optional(),
  twilioPhoneNumber: z.string().trim().max(32).optional(),
  dailyApiKey: z.string().trim().optional(),
});

/**
 * GET /api/app/integrations
 * Returns tenant integration status (no secrets). Tenants use their own Twilio and Daily.co accounts.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db
    .select({
      twilioAccountSid: tenantIntegrations.twilioAccountSid,
      twilioPhoneNumber: tenantIntegrations.twilioPhoneNumber,
      dailyApiKey: tenantIntegrations.dailyApiKey,
    })
    .from(tenantIntegrations)
    .where(eq(tenantIntegrations.tenantId, session.user.tenantId))
    .limit(1);

  return NextResponse.json({
    twilioConfigured: !!(row?.twilioAccountSid && row?.twilioPhoneNumber),
    twilioPhoneNumber: row?.twilioPhoneNumber ? `••••${row.twilioPhoneNumber.slice(-4)}` : null,
    dailyConfigured: !!row?.dailyApiKey,
  });
}

/**
 * PATCH /api/app/integrations
 * Set tenant-owned Twilio and Daily.co credentials. Admin only. No platform keys — clinics add their own.
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = PATCH_BODY.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload: Partial<typeof tenantIntegrations.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.data.twilioAccountSid !== undefined) payload.twilioAccountSid = parsed.data.twilioAccountSid || null;
  if (parsed.data.twilioAuthToken !== undefined) payload.twilioAuthToken = parsed.data.twilioAuthToken || null;
  if (parsed.data.twilioPhoneNumber !== undefined) payload.twilioPhoneNumber = parsed.data.twilioPhoneNumber || null;
  if (parsed.data.dailyApiKey !== undefined) payload.dailyApiKey = parsed.data.dailyApiKey || null;

  const [existing] = await db
    .select({ tenantId: tenantIntegrations.tenantId })
    .from(tenantIntegrations)
    .where(eq(tenantIntegrations.tenantId, session.user.tenantId))
    .limit(1);

  if (existing) {
    await db
      .update(tenantIntegrations)
      .set(payload)
      .where(eq(tenantIntegrations.tenantId, session.user.tenantId));
  } else {
    await db.insert(tenantIntegrations).values({
      tenantId: session.user.tenantId,
      ...payload,
    });
  }

  return NextResponse.json({ ok: true });
}
