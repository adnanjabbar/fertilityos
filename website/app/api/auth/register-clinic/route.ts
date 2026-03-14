import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const registerSchema = z.object({
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
  }),
  admin: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    fullName: z.string().min(1, "Full name is required").max(255),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const { clinic, admin } = parsed.data;
    const slug = clinic.slug.toLowerCase().replace(/\s+/g, "-");

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
      })
      .returning({ id: tenants.id, slug: tenants.slug });

    if (!newTenant) {
      return NextResponse.json(
        { error: "Failed to create clinic" },
        { status: 500 }
      );
    }

    const email = admin.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(admin.password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        tenantId: newTenant.id,
        email,
        passwordHash,
        fullName: admin.fullName.trim(),
        roleSlug: "admin",
      })
      .returning({ id: users.id, email: users.email });

    if (!newUser) {
      return NextResponse.json(
        { error: "Failed to create admin account" },
        { status: 500 }
      );
    }

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
