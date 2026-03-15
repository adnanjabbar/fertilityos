import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { medications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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

const createMedicationSchema = z.object({
  brandName: z.string().min(1).max(255),
  genericName: z.string().min(1).max(255),
  dosage: z.string().min(1).max(128),
  form: z.enum(MEDICATION_FORMS),
  frequencyOptions: z.array(z.string()).default([]),
  instructionsCheckboxes: z
    .object({
      pregnancy_safe: z.boolean().optional(),
      lactation_safe: z.boolean().optional(),
      addiction_risk: z.boolean().optional(),
      dependency_risk: z.boolean().optional(),
      drug_interaction_risk: z.boolean().optional(),
      cautions: z.boolean().optional(),
    })
    .default({}),
  instructionsExtended: z.string().optional().nullable(),
  pharmaceuticalCompany: z.string().max(255).optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db
    .select()
    .from(medications)
    .where(eq(medications.tenantId, session.user.tenantId))
    .orderBy(desc(medications.updatedAt));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createMedicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [created] = await db
    .insert(medications)
    .values({
      tenantId: session.user.tenantId,
      brandName: data.brandName.trim(),
      genericName: data.genericName.trim(),
      dosage: data.dosage.trim(),
      form: data.form,
      frequencyOptions: data.frequencyOptions,
      instructionsCheckboxes: data.instructionsCheckboxes,
      instructionsExtended: data.instructionsExtended?.trim() || null,
      pharmaceuticalCompany: data.pharmaceuticalCompany?.trim() || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
