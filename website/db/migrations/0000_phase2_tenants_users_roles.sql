-- Phase 2: Tenants, Users, Roles
-- Run this against your PostgreSQL database (Neon, Supabase, or DO Managed DB).

CREATE TYPE "role_slug" AS ENUM (
  'admin', 'doctor', 'nurse', 'embryologist', 'lab_tech', 'reception', 'radiologist', 'staff'
);

CREATE TABLE IF NOT EXISTS "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "slug" varchar(64) NOT NULL UNIQUE,
  "address" text,
  "city" varchar(128),
  "state" varchar(128),
  "country" varchar(2) NOT NULL,
  "postal_code" varchar(32),
  "specialty" varchar(255),
  "license_info" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "email" varchar(255) NOT NULL,
  "password_hash" text NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "role_slug" "role_slug" NOT NULL DEFAULT 'staff',
  "email_verified_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_tenant_email_idx" ON "users" ("tenant_id", "email");

CREATE TABLE IF NOT EXISTS "roles" (
  "slug" varchar(32) PRIMARY KEY NOT NULL,
  "name" varchar(128) NOT NULL,
  "description" text
);

INSERT INTO "roles" ("slug", "name", "description") VALUES
  ('admin', 'Administrator', 'Full access to all modules, users, and billing'),
  ('doctor', 'Doctor / Fertility Specialist', 'Patient records, appointments, clinical notes, IVF cycles'),
  ('nurse', 'Nurse', 'Patient records, appointments, basic notes'),
  ('embryologist', 'Embryologist', 'IVF lab module, embryo records'),
  ('lab_tech', 'Lab Technician', 'IVF lab (limited), lab results'),
  ('reception', 'Reception', 'Appointments, patient registration, invoices'),
  ('radiologist', 'Radiologist', 'Upload and view imaging reports'),
  ('staff', 'Staff', 'Custom permissions as set by admin')
ON CONFLICT ("slug") DO NOTHING;
