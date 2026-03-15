import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { tenantBranding } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  letterheadImageUrl: z.string().max(2048).optional().nullable(),
  useLetterheadTemplate: z.boolean().optional(),
  templateSlug: z.string().max(64).optional().nullable(),
  marginTopMm: z.number().int().min(0).max(100).optional(),
  marginBottomMm: z.number().int().min(0).max(100).optional(),
  marginLeftMm: z.number().int().min(0).max(100).optional(),
  marginRightMm: z.number().int().min(0).max(100).optional(),
  footerAddress: z.string().optional().nullable(),
  footerPhone: z.string().max(64).optional().nullable(),
  footerEmail: z.string().max(255).optional().nullable(),
  footerWebsite: z.string().max(512).optional().nullable(),
  footerText: z.string().optional().nullable(),
  logoUrl: z.string().max(2048).optional().nullable(),
});

export type BrandingResponse = {
  letterheadImageUrl: string | null;
  useLetterheadTemplate: boolean;
  templateSlug: string | null;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  footerAddress: string | null;
  footerPhone: string | null;
  footerEmail: string | null;
  footerWebsite: string | null;
  footerText: string | null;
  logoUrl: string | null;
};

const defaults: BrandingResponse = {
  letterheadImageUrl: null,
  useLetterheadTemplate: true,
  templateSlug: "default_modern",
  marginTopMm: 20,
  marginBottomMm: 20,
  marginLeftMm: 20,
  marginRightMm: 20,
  footerAddress: null,
  footerPhone: null,
  footerEmail: null,
  footerWebsite: null,
  footerText: null,
  logoUrl: null,
};

/**
 * GET /api/app/branding
 * Returns tenant branding (letterhead, margins, footer). Authenticated app user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db
    .select()
    .from(tenantBranding)
    .where(eq(tenantBranding.tenantId, session.user.tenantId))
    .limit(1);

  if (!row) {
    return NextResponse.json(defaults);
  }

  return NextResponse.json({
    letterheadImageUrl: row.letterheadImageUrl,
    useLetterheadTemplate: row.useLetterheadTemplate,
    templateSlug: row.templateSlug ?? defaults.templateSlug,
    marginTopMm: row.marginTopMm,
    marginBottomMm: row.marginBottomMm,
    marginLeftMm: row.marginLeftMm,
    marginRightMm: row.marginRightMm,
    footerAddress: row.footerAddress,
    footerPhone: row.footerPhone,
    footerEmail: row.footerEmail,
    footerWebsite: row.footerWebsite,
    footerText: row.footerText,
    logoUrl: row.logoUrl,
  });
}

/**
 * PATCH /api/app/branding
 * Update tenant branding. Admin only.
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

  const tenantId = session.user.tenantId;
  const data = parsed.data;

  const updatePayload: Partial<typeof tenantBranding.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.letterheadImageUrl !== undefined) updatePayload.letterheadImageUrl = data.letterheadImageUrl ?? null;
  if (data.useLetterheadTemplate !== undefined) updatePayload.useLetterheadTemplate = data.useLetterheadTemplate;
  if (data.templateSlug !== undefined) updatePayload.templateSlug = data.templateSlug ?? null;
  if (data.marginTopMm !== undefined) updatePayload.marginTopMm = data.marginTopMm;
  if (data.marginBottomMm !== undefined) updatePayload.marginBottomMm = data.marginBottomMm;
  if (data.marginLeftMm !== undefined) updatePayload.marginLeftMm = data.marginLeftMm;
  if (data.marginRightMm !== undefined) updatePayload.marginRightMm = data.marginRightMm;
  if (data.footerAddress !== undefined) updatePayload.footerAddress = data.footerAddress ?? null;
  if (data.footerPhone !== undefined) updatePayload.footerPhone = data.footerPhone ?? null;
  if (data.footerEmail !== undefined) updatePayload.footerEmail = data.footerEmail && data.footerEmail !== "" ? data.footerEmail : null;
  if (data.footerWebsite !== undefined) updatePayload.footerWebsite = data.footerWebsite && data.footerWebsite !== "" ? data.footerWebsite : null;
  if (data.footerText !== undefined) updatePayload.footerText = data.footerText ?? null;
  if (data.logoUrl !== undefined) updatePayload.logoUrl = data.logoUrl && data.logoUrl !== "" ? data.logoUrl : null;

  const [existing] = await db
    .select()
    .from(tenantBranding)
    .where(eq(tenantBranding.tenantId, tenantId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(tenantBranding)
      .set(updatePayload)
      .where(eq(tenantBranding.tenantId, tenantId))
      .returning();
    if (!updated) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
    return NextResponse.json({
      letterheadImageUrl: updated.letterheadImageUrl,
      useLetterheadTemplate: updated.useLetterheadTemplate,
      templateSlug: updated.templateSlug ?? defaults.templateSlug,
      marginTopMm: updated.marginTopMm,
      marginBottomMm: updated.marginBottomMm,
      marginLeftMm: updated.marginLeftMm,
      marginRightMm: updated.marginRightMm,
      footerAddress: updated.footerAddress,
      footerPhone: updated.footerPhone,
      footerEmail: updated.footerEmail,
      footerWebsite: updated.footerWebsite,
      footerText: updated.footerText,
      logoUrl: updated.logoUrl,
    });
  }

  const [inserted] = await db
    .insert(tenantBranding)
    .values({
      tenantId,
      letterheadImageUrl: updatePayload.letterheadImageUrl ?? null,
      useLetterheadTemplate: updatePayload.useLetterheadTemplate ?? true,
      templateSlug: updatePayload.templateSlug ?? "default_modern",
      marginTopMm: updatePayload.marginTopMm ?? 20,
      marginBottomMm: updatePayload.marginBottomMm ?? 20,
      marginLeftMm: updatePayload.marginLeftMm ?? 20,
      marginRightMm: updatePayload.marginRightMm ?? 20,
      footerAddress: updatePayload.footerAddress ?? null,
      footerPhone: updatePayload.footerPhone ?? null,
      footerEmail: updatePayload.footerEmail ?? null,
      footerWebsite: updatePayload.footerWebsite ?? null,
      footerText: updatePayload.footerText ?? null,
      logoUrl: updatePayload.logoUrl ?? null,
    })
    .returning();

  if (!inserted) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
  return NextResponse.json({
    letterheadImageUrl: inserted.letterheadImageUrl,
    useLetterheadTemplate: inserted.useLetterheadTemplate,
    templateSlug: inserted.templateSlug ?? defaults.templateSlug,
    marginTopMm: inserted.marginTopMm,
    marginBottomMm: inserted.marginBottomMm,
    marginLeftMm: inserted.marginLeftMm,
    marginRightMm: inserted.marginRightMm,
    footerAddress: inserted.footerAddress,
    footerPhone: inserted.footerPhone,
    footerEmail: inserted.footerEmail,
    footerWebsite: inserted.footerWebsite,
    footerText: inserted.footerText,
    logoUrl: inserted.logoUrl,
  });
}
