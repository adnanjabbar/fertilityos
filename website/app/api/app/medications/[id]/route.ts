import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { medications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const MEDICATION_FORMS = [
  "tablet",
  "capsule",
  "injection",
  "suppository",
  "pessary",
  "syrup",
  "cream",
  "gel",
  "drops",
  "inhaler",
  "other",
] as const;

const updateMedicationSchema = z.object({
  brandName: z.string().min(1).max(255).optional(),
  genericName: z.string().min(1).max(255).optional(),
  dosage: z.string().min(1).max(128).optional(),
  form: z.enum(MEDICATION_FORMS).optional(),
  frequencyOptions: z.array(z.string()).optional(),
  instructionsCheckboxes: z
    .object({
      pregnancy_safe: z.boolean().optional(),
      lactation_safe: z.boolean().optional(),
      addiction_risk: z.boolean().optional(),
      dependency_risk: z.boolean().optional(),
      drug_interaction_risk: z.boolean().optional(),
      cautions: z.boolean().optional(),
    })
    .optional(),
  instructionsExtended: z.string().optional().nullable(),
  pharmaceuticalCompany: z.string().max(255).optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [med] = await db
    .select()
    .from(medications)
    .where(
      and(
        eq(medications.id, id),
        eq(medications.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!med) {
    return NextResponse.json({ error: "Medication not found" }, { status: 404 });
  }

  return NextResponse.json(med);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateMedicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updateValues: Partial<typeof medications.$inferInsert> = { updatedAt: new Date() };
  if (data.brandName !== undefined) updateValues.brandName = data.brandName.trim();
  if (data.genericName !== undefined) updateValues.genericName = data.genericName.trim();
  if (data.dosage !== undefined) updateValues.dosage = data.dosage.trim();
  if (data.form !== undefined) updateValues.form = data.form;
  if (data.frequencyOptions !== undefined) updateValues.frequencyOptions = data.frequencyOptions;
  if (data.instructionsCheckboxes !== undefined)
    updateValues.instructionsCheckboxes = data.instructionsCheckboxes;
  if (data.instructionsExtended !== undefined)
    updateValues.instructionsExtended = data.instructionsExtended?.trim() || null;
  if (data.pharmaceuticalCompany !== undefined)
    updateValues.pharmaceuticalCompany = data.pharmaceuticalCompany?.trim() || null;

  const [updated] = await db
    .update(medications)
    .set(updateValues)
    .where(
      and(
        eq(medications.id, id),
        eq(medications.tenantId, session.user.tenantId)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Medication not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(medications)
    .where(
      and(
        eq(medications.id, id),
        eq(medications.tenantId, session.user.tenantId)
      )
    )
    .returning({ id: medications.id });

  if (!deleted) {
    return NextResponse.json({ error: "Medication not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
