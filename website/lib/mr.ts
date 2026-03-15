import { db } from "@/db";
import { patients, tenants } from "@/db/schema";
import { and, eq, like, desc } from "drizzle-orm";

/**
 * Generate next MR number for a tenant: PREFIX-YY-NNNN (e.g. CLINIC-25-0001).
 * Prefix is derived from tenant slug (alphanumeric, max 8 chars) or "MR".
 */
export async function generateNextMrNumber(tenantId: string): Promise<string> {
  const [tenant] = await db
    .select({ slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  let prefix = "MR";
  if (tenant?.slug?.trim()) {
    const cleaned = tenant.slug.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (cleaned.length > 0) {
      prefix = cleaned.length > 8 ? cleaned.slice(0, 8) : cleaned;
    }
  }

  const yy = new Date().getFullYear().toString().slice(-2);
  const prefixPattern = `${prefix}-${yy}-`;

  const [last] = await db
    .select({ mrNumber: patients.mrNumber })
    .from(patients)
    .where(
      and(
        eq(patients.tenantId, tenantId),
        like(patients.mrNumber, `${prefixPattern}%`)
      )
    )
    .orderBy(desc(patients.mrNumber))
    .limit(1);

  let nextSeq = 1;
  if (last?.mrNumber) {
    const match = last.mrNumber.match(new RegExp(`^${prefixPattern.replace(/-/g, "\\-")}(\\d+)$`));
    if (match) nextSeq = parseInt(match[1], 10) + 1;
  }

  return `${prefix}-${yy}-${String(nextSeq).padStart(4, "0")}`;
}
