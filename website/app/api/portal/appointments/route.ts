import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.patientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db
    .select({
      id: appointments.id,
      title: appointments.title,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      type: appointments.type,
      status: appointments.status,
    })
    .from(appointments)
    .where(eq(appointments.patientId, session.user.patientId))
    .orderBy(desc(appointments.startAt))
    .limit(100);

  return NextResponse.json(
    list.map((a) => ({
      id: a.id,
      title: a.title,
      startAt: a.startAt,
      endAt: a.endAt,
      type: a.type,
      status: a.status,
    }))
  );
}
