import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD", "CHF", "JPY", "INR"] as const;
const REMINDER_CHANNELS = ["email", "sms", "both"] as const;
const patchSchema = z.object({
  defaultCurrency: z.enum(SUPPORTED_CURRENCIES).optional(),
  reminderChannel: z.enum(REMINDER_CHANNELS).optional(),
});

/**
 * GET /api/app/settings
 * Returns tenant settings including defaultCurrency. Authenticated app user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [tenant] = await db
    .select({ defaultCurrency: tenants.defaultCurrency, reminderChannel: tenants.reminderChannel })
    .from(tenants)
    .where(eq(tenants.id, session.user.tenantId))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({
    defaultCurrency: tenant.defaultCurrency ?? "USD",
    reminderChannel: tenant.reminderChannel ?? "email",
  });
}

/**
 * PATCH /api/app/settings
 * Update tenant settings (e.g. defaultCurrency). Admin only.
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

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

  const updatePayload: Partial<{ defaultCurrency: string; reminderChannel: "email" | "sms" | "both"; updatedAt: Date }> = {
    updatedAt: new Date(),
  };
  if (parsed.data.defaultCurrency !== undefined) updatePayload.defaultCurrency = parsed.data.defaultCurrency;
  if (parsed.data.reminderChannel !== undefined) updatePayload.reminderChannel = parsed.data.reminderChannel;

  const [updated] = await db
    .update(tenants)
    .set(updatePayload)
    .where(eq(tenants.id, session.user.tenantId))
    .returning({ defaultCurrency: tenants.defaultCurrency, reminderChannel: tenants.reminderChannel });

  if (!updated) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({
    defaultCurrency: updated.defaultCurrency ?? "USD",
    reminderChannel: updated.reminderChannel ?? "email",
  });
}
