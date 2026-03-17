import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { userSessions } from "@/db/schema";
import { and, eq, isNull, ne } from "drizzle-orm";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenSessionId = (session as any).token?.sessionId as string | undefined;
  if (!tokenSessionId) {
    return NextResponse.json({ error: "No current session found" }, { status: 400 });
  }

  const now = new Date();

  await db
    .update(userSessions)
    .set({ revokedAt: now })
    .where(
      and(
        eq(userSessions.userId, session.user.id),
        eq(userSessions.tenantId, session.user.tenantId),
        ne(userSessions.sessionId, tokenSessionId),
        isNull(userSessions.revokedAt)
      )
    );

  await logAudit({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "auth.session_revoke_others",
    entityType: "user",
    entityId: session.user.id,
    details: { keepSessionId: tokenSessionId },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}

