import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { appointments, tenantIntegrations } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const DAILY_API_URL = "https://api.daily.co/v1/rooms";

function sanitizeRoomName(id: string): string {
  return `fertilityos-${id.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80)}`;
}

/**
 * POST /api/app/appointments/[id]/video-room
 * Create or get a Daily.co video room for this appointment. Returns { url }.
 * Uses the clinic's own Daily.co API key (Settings → Integrations). No platform key.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [appointment] = await db
    .select({ id: appointments.id, videoRoomId: appointments.videoRoomId })
    .from(appointments)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.tenantId, session.user.tenantId)
      )
    )
    .limit(1);

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  if (appointment.videoRoomId) {
    return NextResponse.json({ url: appointment.videoRoomId });
  }

  const [integration] = await db
    .select({ dailyApiKey: tenantIntegrations.dailyApiKey })
    .from(tenantIntegrations)
    .where(eq(tenantIntegrations.tenantId, session.user.tenantId))
    .limit(1);

  const dailyApiKey = integration?.dailyApiKey?.trim();
  if (!dailyApiKey) {
    return NextResponse.json(
      { error: "Video calls are not configured. Add your Daily.co API key in Settings → Integrations." },
      { status: 503 }
    );
  }

  const roomName = sanitizeRoomName(id);
  const res = await fetch(DAILY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${dailyApiKey}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "private",
      properties: {
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[video-room] Daily API error:", res.status, err);
    return NextResponse.json(
      { error: "Failed to create video room" },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { url?: string };
  const url = data?.url;
  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Invalid response from video provider" },
      { status: 502 }
    );
  }

  await db
    .update(appointments)
    .set({ videoRoomId: url, updatedAt: new Date() })
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.tenantId, session.user.tenantId)
      )
    );

  return NextResponse.json({ url });
}
