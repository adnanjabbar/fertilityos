-- ICD-11 entities (WHO) and patient diagnoses (Phase 7.3)
-- icd11_entities: full detail for search and "ICD-11 Disease Detail" display
CREATE TABLE IF NOT EXISTS "icd11_entities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(32) NOT NULL,
  "title" varchar(512) NOT NULL,
  "description" text,
  "parent_code" varchar(32),
  "chapter_code" varchar(32),
  "chapter_title" varchar(512),
  "section_code" varchar(32),
  "section_title" varchar(512),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "icd11_entities_code_idx" ON "icd11_entities" ("code");
CREATE INDEX IF NOT EXISTS "icd11_entities_parent_idx" ON "icd11_entities" ("parent_code");
CREATE INDEX IF NOT EXISTS "icd11_entities_title_search_idx" ON "icd11_entities" ("title");

-- patient_diagnoses: ICD-11 and/or custom (custom only for roles permitted by clinic)
CREATE TABLE IF NOT EXISTS "patient_diagnoses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "icd11_code" varchar(32),
  "custom_diagnosis" text,
  "recorded_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "recorded_at" timestamptz DEFAULT now() NOT NULL,
  "role_slug_at_record" varchar(32),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "patient_diagnoses_tenant_patient_idx" ON "patient_diagnoses" ("tenant_id", "patient_id");
CREATE INDEX IF NOT EXISTS "patient_diagnoses_icd11_idx" ON "patient_diagnoses" ("icd11_code");
