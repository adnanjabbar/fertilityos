import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { medicationGroups } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db
    .select()
    .from(medicationGroups)
    .where(eq(medicationGroups.tenantId, session.user.tenantId))
    .orderBy(desc(medicationGroups.updatedAt));

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

  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [created] = await db
    .insert(medicationGroups)
    .values({
      tenantId: session.user.tenantId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
