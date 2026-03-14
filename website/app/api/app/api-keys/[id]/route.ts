import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(apiKeys)
    .where(
      and(
        eq(apiKeys.id, id),
        eq(apiKeys.tenantId, session.user.tenantId)
      )
    )
    .returning({ id: apiKeys.id });

  if (!deleted) {
    return NextResponse.json(
      { error: "API key not found or already revoked" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
