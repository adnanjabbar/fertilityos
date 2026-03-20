import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { db } from "@/db";
import { platformPromotionCodes, tenants } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createStripeCouponAndPromotionCode, isStripeSecretConfigured } from "@/lib/stripe";
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

const createSchema = z
  .object({
    code: z
      .string()
      .min(3)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens, underscores only"),
    percentOff: z.number().int().min(1).max(100).optional(),
    amountOffCents: z.number().int().positive().optional(),
    currency: z.string().length(3).optional(),
    duration: z.enum(["once", "repeating", "forever"]),
    durationInMonths: z.number().int().min(1).max(36).optional(),
    maxRedemptions: z.number().int().min(1).optional(),
    expiresAt: z.string().datetime().optional().nullable(),
    internalNote: z.string().max(500).optional(),
  })
  .refine(
    (d) =>
      (d.percentOff != null && d.amountOffCents == null) ||
      (d.percentOff == null && d.amountOffCents != null),
    { message: "Provide exactly one of percentOff or amountOffCents" }
  )
  .refine(
    (d) =>
      d.duration !== "repeating" ||
      d.durationInMonths == null ||
      (d.durationInMonths >= 1 && d.durationInMonths <= 36),
    { message: "durationInMonths must be between 1 and 36 when provided" }
  );

/**
 * GET /api/app/super/promotion-codes
 */
export async function GET() {
  const session = await auth();
  const guard = requireSuperAdmin(session);
  if (!guard.ok) return guard.res;

  const rows = await db
    .select({
      id: platformPromotionCodes.id,
      code: platformPromotionCodes.code,
      active: platformPromotionCodes.active,
      percentOff: platformPromotionCodes.percentOff,
      amountOffCents: platformPromotionCodes.amountOffCents,
      currency: platformPromotionCodes.currency,
      duration: platformPromotionCodes.duration,
      durationInMonths: platformPromotionCodes.durationInMonths,
      maxRedemptions: platformPromotionCodes.maxRedemptions,
      expiresAt: platformPromotionCodes.expiresAt,
      internalNote: platformPromotionCodes.internalNote,
      stripePromotionCodeId: platformPromotionCodes.stripePromotionCodeId,
      createdAt: platformPromotionCodes.createdAt,
    })
    .from(platformPromotionCodes)
    .orderBy(desc(platformPromotionCodes.createdAt));

  return NextResponse.json({
    codes: rows.map((r) => ({
      ...r,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

/**
 * POST /api/app/super/promotion-codes
 */
export async function POST(request: Request) {
  const guard = requireSuperAdmin(await auth());
  if (!guard.ok) return guard.res;
  const { session } = guard;

  if (!rateLimitSuperApi(session.user.id, "promotion-code-create", 40).allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  if (!(await isStripeSecretConfigured())) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Set STRIPE_SECRET_KEY (env) or add keys under Super Admin → Payment gateways.",
      },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const codeUpper = d.code.toUpperCase();
  const expiresAt = d.expiresAt ? new Date(d.expiresAt) : null;

  const stripeResult = await createStripeCouponAndPromotionCode({
    code: codeUpper,
    percentOff: d.percentOff,
    amountOffCents: d.amountOffCents,
    currency: d.currency,
    duration: d.duration,
    durationInMonths: d.duration === "repeating" ? d.durationInMonths ?? 3 : undefined,
    maxRedemptions: d.maxRedemptions,
    expiresAt,
  });

  if (!stripeResult) {
    return NextResponse.json(
      { error: "Could not create Stripe coupon. Check discount fields and Stripe dashboard." },
      { status: 502 }
    );
  }

  const [systemTenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, SYSTEM_TENANT_SLUG))
    .limit(1);

  if (!systemTenant) {
    return NextResponse.json({ error: "System tenant missing" }, { status: 500 });
  }

  try {
    const [inserted] = await db
      .insert(platformPromotionCodes)
      .values({
        code: codeUpper,
        stripeCouponId: stripeResult.couponId,
        stripePromotionCodeId: stripeResult.promotionCodeId,
        active: true,
        percentOff: d.percentOff ?? null,
        amountOffCents: d.amountOffCents ?? null,
        currency: d.currency?.toLowerCase() ?? (d.amountOffCents != null ? "usd" : null),
        duration: d.duration,
        durationInMonths: d.duration === "repeating" ? (d.durationInMonths ?? 3) : null,
        maxRedemptions: d.maxRedemptions ?? null,
        expiresAt,
        internalNote: d.internalNote?.trim() || null,
        createdByUserId: session.user.id,
        updatedAt: new Date(),
      })
      .returning({ id: platformPromotionCodes.id });

    await logPlatformAdminChange({
      tenantId: systemTenant.id,
      actorUserId: session.user.id,
      eventType: "platform_promotion_code_created",
      previousState: null,
      newState: {
        code: codeUpper,
        percentOff: d.percentOff ?? null,
        amountOffCents: d.amountOffCents ?? null,
        duration: d.duration,
        stripePromotionCodeId: stripeResult.promotionCodeId,
      },
      request,
    });

    return NextResponse.json({ success: true, id: inserted?.id }, { status: 201 });
  } catch (e) {
    console.error("promotion-codes insert error:", e);
    return NextResponse.json(
      { error: "Code may already exist or database error. Check Stripe for duplicate codes." },
      { status: 409 }
    );
  }
}
