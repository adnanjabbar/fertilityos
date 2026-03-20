import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { MODULE_SLUGS } from "@/db/schema";
import { logPlatformAdminChange } from "@/lib/platform-admin-audit";

const updateModulesSchema = z.object({
  enabledModules: z.array(z.string()).optional().nullable(),
});

/**
 * PATCH /api/app/super/tenants/[tenantId]/modules
 * Super admin only. Set enabled modules for a tenant. Pass [] or null for "all enabled".
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.roleSlug !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tenantId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateModulesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [tenant] = await db
    .select({ id: tenants.id, enabledModules: tenants.enabledModules })
    .from(tenants)
    .where(and(eq(tenants.id, tenantId), ne(tenants.slug, "system")))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const previousModules = tenant.enabledModules;

  const raw = parsed.data.enabledModules;
  const valid =
    raw == null || raw.length === 0
      ? null
      : raw.filter((s) => MODULE_SLUGS.includes(s as (typeof MODULE_SLUGS)[number]));
  const value =
    valid == null || valid.length === 0 ? null : JSON.stringify(valid);

  await db
    .update(tenants)
    .set({ enabledModules: value, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));

  if (previousModules !== value) {
    const safeParse = (s: string | null) => {
      if (!s) return null;
      try {
        return JSON.parse(s) as unknown;
      } catch {
        return { invalidJson: true, raw: s };
      }
    };
    await logPlatformAdminChange({
      tenantId,
      actorUserId: session.user.id,
      eventType: "tenant_modules_changed",
      previousState: {
        enabledModules: previousModules,
        enabledModulesList: safeParse(previousModules),
      },
      newState: {
        enabledModules: value,
        enabledModulesList: safeParse(value),
      },
      request,
    });
  }

  return NextResponse.json({ ok: true, enabledModules: value });
}
