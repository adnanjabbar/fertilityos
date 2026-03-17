import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { userSessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: userSessions.id,
      sessionId: userSessions.sessionId,
      userAgent: userSessions.userAgent,
      ipAddress: userSessions.ipAddress,
      createdAt: userSessions.createdAt,
      lastUsedAt: userSessions.lastUsedAt,
      revokedAt: userSessions.revokedAt,
    })
    .from(userSessions)
    .where(
      and(
        eq(userSessions.userId, session.user.id),
        eq(userSessions.tenantId, session.user.tenantId)
      )
    )
    .orderBy(userSessions.createdAt);

  const currentSessionId = (session as any).token?.sessionId ?? null;

  return NextResponse.json({
    sessions: rows.map((row) => ({
      ...row,
      isCurrent: currentSessionId ? row.sessionId === currentSessionId : false,
    })),
  });
}

