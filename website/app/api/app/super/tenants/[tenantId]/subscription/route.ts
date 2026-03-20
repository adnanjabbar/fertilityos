import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants, tenantSubscriptions } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { logPlatformAdminChange } from "@/lib/platform-admin-audit";

const patchSchema = z.object({
  billingPlan: z.enum(["free", "basic", "pro", "enterprise"]),
  status: z
    .string()
    .min(1)
    .max(32)
    .optional()
    .describe("Stripe-style status e.g. active, trialing, past_due, canceled, incomplete"),
  notes: z.string().max(2000).optional().nullable(),
});

type RouteContext = { params: Promise<{ tenantId: string }> };

/**
 * PATCH /api/app/super/tenants/[tenantId]/subscription
 * Super admin: set billing tier (free/basic/pro/enterprise) and optionally subscription status.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.roleSlug !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tenantId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(and(eq(tenants.id, tenantId), ne(tenants.slug, "system")))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const [existing] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  const prevPlan = existing?.billingPlan ?? "free";
  const prevStatus = existing?.status ?? "incomplete";
  const nextPlan = parsed.data.billingPlan;
  const nextStatus = parsed.data.status ?? prevStatus;
  const notes = parsed.data.notes ?? null;

  const now = new Date();

  if (existing) {
    await db
      .update(tenantSubscriptions)
      .set({
        billingPlan: nextPlan,
        status: nextStatus,
        updatedAt: now,
      })
      .where(eq(tenantSubscriptions.tenantId, tenantId));
  } else {
    await db.insert(tenantSubscriptions).values({
      tenantId,
      billingPlan: nextPlan,
      status: nextStatus,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (prevPlan !== nextPlan) {
    await logPlatformAdminChange({
      tenantId,
      actorUserId: session.user.id,
      eventType: "subscription_billing_plan_changed",
      previousState: { billingPlan: prevPlan },
      newState: { billingPlan: nextPlan },
      request,
      notes,
    });
  }

  if (prevStatus !== nextStatus) {
    await logPlatformAdminChange({
      tenantId,
      actorUserId: session.user.id,
      eventType: "subscription_status_changed",
      previousState: { status: prevStatus },
      newState: { status: nextStatus },
      request,
      notes: prevPlan === nextPlan ? notes : null,
    });
  }

  const [updated] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  return NextResponse.json({
    ok: true,
    subscription: updated
      ? {
          billingPlan: updated.billingPlan,
          status: updated.status,
          stripeSubscriptionId: updated.stripeSubscriptionId,
          currentPeriodEnd: updated.currentPeriodEnd?.toISOString() ?? null,
        }
      : null,
  });
}
