import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { icd11Entities } from "@/db/schema";
import { ilike, or, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const pattern = `%${q}%`;
  const list = await db
    .select({
      id: icd11Entities.id,
      code: icd11Entities.code,
      title: icd11Entities.title,
      description: icd11Entities.description,
      parentCode: icd11Entities.parentCode,
      chapterCode: icd11Entities.chapterCode,
      chapterTitle: icd11Entities.chapterTitle,
      sectionCode: icd11Entities.sectionCode,
      sectionTitle: icd11Entities.sectionTitle,
    })
    .from(icd11Entities)
    .where(
      or(
        ilike(icd11Entities.code, pattern),
        ilike(icd11Entities.title, pattern)
      )
    )
    .orderBy(icd11Entities.code)
    .limit(limit);

  return NextResponse.json(list);
}
