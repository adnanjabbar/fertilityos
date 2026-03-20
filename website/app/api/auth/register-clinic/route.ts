import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { tenants, users, referralCodes, referralSignups } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { consumeVerifiedEmail } from "@/lib/email-verification";
import { validateStaffPassword } from "@/lib/password-policy";
import { getClientIp, logAudit } from "@/lib/audit";
import { rateLimitRegister } from "@/lib/rate-limit";

const registerSchema = z.object({
  ref: z.string().max(64).optional(),
  tenantSlug: z.string().max(64).optional(),
  clinic: z.object({
    name: z.string().min(1, "Clinic name is required").max(255),
    slug: z
      .string()
      .min(1, "Slug is required")
      .max(64)
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    address: z.string().max(500).optional(),
    city: z.string().max(128).optional(),
    state: z.string().max(128).optional(),
    country: z.string().length(2, "Country must be 2-letter code").toUpperCase(),
    postalCode: z.string().max(32).optional(),
    specialty: z.string().max(255).optional(),
    licenseInfo: z.string().optional(),
    /** Optional GPS pin (decimal degrees as string). */
    latitude: z.string().max(32).optional(),
    longitude: z.string().max(32).optional(),
  }),
  admin: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
    fullName: z.string().min(1, "Full name is required").max(255),
    phone: z.string().max(64).optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request) ?? "unknown";
    if (!rateLimitRegister(ip).allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts from this network. Try again in an hour." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const { clinic, admin, ref: refCode, tenantSlug } = parsed.data;
    const email = admin.email.trim().toLowerCase();

    const passwordValidation = validateStaffPassword(admin.password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    const emailVerified = await consumeVerifiedEmail({
      email,
      context: "clinic_register",
    });
    if (!emailVerified) {
      return NextResponse.json(
        { error: "Email not verified. Please complete email verification first." },
        { status: 400 }
      );
    }

    const slug = clinic.slug.toLowerCase().replace(/\s+/g, "-");

    let referralCodeId: string | null = null;
    if (refCode?.trim()) {
      const code = refCode.trim().toUpperCase();
      if (tenantSlug?.trim()) {
        const [tenantRow] = await db
          .select({ id: tenants.id })
          .from(tenants)
          .where(eq(tenants.slug, tenantSlug.trim().toLowerCase()))
          .limit(1);
        if (tenantRow) {
          const [refRow] = await db
            .select({ id: referralCodes.id, usedCount: referralCodes.usedCount })
            .from(referralCodes)
            .where(and(eq(referralCodes.tenantId, tenantRow.id), eq(referralCodes.code, code)))
            .limit(1);
          if (refRow) {
            referralCodeId = refRow.id;
            const nextCount = String(parseInt(refRow.usedCount || "0", 10) + 1);
            await db
              .update(referralCodes)
              .set({ usedCount: nextCount })
              .where(eq(referralCodes.id, refRow.id));
          }
        }
      } else {
        const [refRow] = await db
          .select({ id: referralCodes.id, usedCount: referralCodes.usedCount })
          .from(referralCodes)
          .where(eq(referralCodes.code, code))
          .limit(1);
        if (refRow) {
          referralCodeId = refRow.id;
          const nextCount = String(parseInt(refRow.usedCount || "0", 10) + 1);
          await db
            .update(referralCodes)
            .set({ usedCount: nextCount })
            .where(eq(referralCodes.id, refRow.id));
        }
      }
    }

    const [existingTenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (existingTenant) {
      return NextResponse.json(
        { error: "A clinic with this slug already exists. Choose another." },
        { status: 409 }
      );
    }

    const [newTenant] = await db
      .insert(tenants)
      .values({
        name: clinic.name,
        slug,
        address: clinic.address ?? null,
        city: clinic.city ?? null,
        state: clinic.state ?? null,
        country: clinic.country,
        postalCode: clinic.postalCode ?? null,
        specialty: clinic.specialty ?? null,
        licenseInfo: clinic.licenseInfo ?? null,
        latitude: clinic.latitude?.trim() || null,
        longitude: clinic.longitude?.trim() || null,
      })
      .returning({ id: tenants.id, slug: tenants.slug });

    if (!newTenant) {
      return NextResponse.json(
        { error: "Failed to create clinic" },
        { status: 500 }
      );
    }

    const passwordHash = await bcrypt.hash(admin.password, 12);
    const adminPhone = admin.phone?.trim().replace(/\s/g, "") || null;

    const [newUser] = await db
      .insert(users)
      .values({
        tenantId: newTenant.id,
        email,
        passwordHash,
        fullName: admin.fullName.trim(),
        roleSlug: "admin",
        emailVerifiedAt: new Date(),
        phone: adminPhone,
        phoneVerifiedAt: adminPhone ? new Date() : null,
      })
      .returning({ id: users.id, email: users.email });

    if (!newUser) {
      return NextResponse.json(
        { error: "Failed to create admin account" },
        { status: 500 }
      );
    }

    if (referralCodeId) {
      await db.insert(referralSignups).values({
        referralCodeId,
        email: admin.email.trim().toLowerCase(),
      });
    }

    await logAudit({
      tenantId: newTenant.id,
      userId: newUser.id,
      action: "clinic_self_registered",
      entityType: "tenant",
      entityId: newTenant.id,
      details: { slug: newTenant.slug, country: clinic.country },
      ipAddress: ip,
    });

    return NextResponse.json(
      {
        success: true,
        tenantId: newTenant.id,
        userId: newUser.id,
        slug: newTenant.slug,
        message: "Clinic and admin account created. You can now sign in.",
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("register-clinic error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
