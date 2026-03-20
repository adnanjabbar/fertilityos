import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { db } from "@/db";
import { platformPromotionCodes, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deactivateStripePromotionCode, isStripeSecretConfigured } from "@/lib/stripe";
import { logPlatformAdminChange } from "@/lib/platform-admin-audit";
import { SYSTEM_TENANT_SLUG } from "@/lib/super-admin-queries";
import { rateLimitSuperApi } from "@/lib/rate-limit";

function requireSuperAdmin(session: Session | null) {
  if (!session?.user) {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.roleSlug !== "super_admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Super admin only" }, { status: 403 }) };
  }
  return { ok: true as const, session };
}

/**
 * PATCH /api/app/super/promotion-codes/[id] — deactivate (marketing stop).
 */
export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(await auth());
  if (!guard.ok) return guard.res;
  const { session } = guard;

  if (!rateLimitSuperApi(session.user.id, "promotion-code-deactivate", 60).allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  if (body.active !== false) {
    return NextResponse.json({ error: "Only { active: false } is supported." }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(platformPromotionCodes)
    .where(eq(platformPromotionCodes.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!row.active) {
    return NextResponse.json({ success: true, message: "Already inactive" });
  }

  if (await isStripeSecretConfigured()) {
    await deactivateStripePromotionCode(row.stripePromotionCodeId);
  }

  await db
    .update(platformPromotionCodes)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(platformPromotionCodes.id, id));

  const [systemTenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, SYSTEM_TENANT_SLUG))
    .limit(1);

  if (systemTenant) {
    await logPlatformAdminChange({
      tenantId: systemTenant.id,
      actorUserId: session.user.id,
      eventType: "platform_promotion_code_deactivated",
      previousState: { code: row.code, active: true },
      newState: { code: row.code, active: false },
      request,
    });
  }

  return NextResponse.json({ success: true });
}
