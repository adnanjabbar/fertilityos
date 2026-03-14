import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";

const KEY_PREFIX = "fo_";
const SECRET_BYTES = 32;
const PREFIX_DISPLAY_LENGTH = 8;

function generateKey(): { plain: string; hash: string; prefix: string } {
  const secret = randomBytes(SECRET_BYTES).toString("hex");
  const plain = `${KEY_PREFIX}${secret}`;
  const hash = createHash("sha256").update(plain).digest("hex");
  const prefix = plain.slice(0, PREFIX_DISPLAY_LENGTH);
  return { plain, hash, prefix };
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  expiresInDays: z.number().int().min(0).optional(),
});

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
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.tenantId, session.user.tenantId))
    .orderBy(desc(apiKeys.createdAt));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.roleSlug !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, expiresInDays } = parsed.data;
  const { plain, hash, prefix } = generateKey();
  const expiresAt =
    expiresInDays != null && expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

  const [created] = await db
    .insert(apiKeys)
    .values({
      tenantId: session.user.tenantId,
      name: name.trim(),
      keyHash: hash,
      keyPrefix: prefix,
      expiresAt,
    })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    });

  if (!created) {
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ...created,
      key: plain,
      message:
        "Copy the key now. It will not be shown again.",
    },
    { status: 201 }
  );
}
