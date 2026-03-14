import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const list = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      roleSlug: users.roleSlug,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.tenantId, session.user.tenantId))
    .orderBy(desc(users.createdAt));

  return NextResponse.json(list);
}
