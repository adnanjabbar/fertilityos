import { NextResponse } from "next/server";
import { db } from "@/db";
import { invitations, tenants } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const [inv] = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      roleSlug: invitations.roleSlug,
      expiresAt: invitations.expiresAt,
      tenantName: tenants.name,
    })
    .from(invitations)
    .innerJoin(tenants, eq(invitations.tenantId, tenants.id))
    .where(
      and(eq(invitations.token, token), isNull(invitations.acceptedAt))
    )
    .limit(1);

  if (!inv) {
    return NextResponse.json(
      { error: "Invitation not found or already used." },
      { status: 404 }
    );
  }

  if (new Date() > inv.expiresAt) {
    return NextResponse.json(
      { error: "This invitation has expired." },
      { status: 410 }
    );
  }

  return NextResponse.json({
    email: inv.email,
    roleSlug: inv.roleSlug,
    tenantName: inv.tenantName,
    expiresAt: inv.expiresAt,
  });
}
