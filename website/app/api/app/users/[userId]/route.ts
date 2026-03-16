import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const VALID_ROLES = [
  "admin",
  "doctor",
  "nurse",
  "embryologist",
  "lab_tech",
  "pathologist",
  "reception",
  "radiologist",
  "staff",
] as const;

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { userId } = await params;
  let body: { roleSlug?: string };
  try {
    body = await _request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const roleSlug = typeof body.roleSlug === "string" ? body.roleSlug.trim() : undefined;
  if (!roleSlug || !VALID_ROLES.includes(roleSlug as (typeof VALID_ROLES)[number])) {
    return NextResponse.json(
      { error: "roleSlug must be one of: " + VALID_ROLES.join(", ") },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(users)
    .set({ roleSlug: roleSlug as (typeof VALID_ROLES)[number], updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.tenantId, session.user.tenantId)))
    .returning({ id: users.id, email: users.email, roleSlug: users.roleSlug });

  if (!updated) {
    return NextResponse.json({ error: "User not found or access denied" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
