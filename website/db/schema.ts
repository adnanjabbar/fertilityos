import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

export const roleSlugEnum = pgEnum("role_slug", [
  "admin",
  "doctor",
  "nurse",
  "embryologist",
  "lab_tech",
  "reception",
  "radiologist",
  "staff",
  "super_admin",
]);

export const reminderChannelEnum = pgEnum("reminder_channel", ["email", "sms", "both"]);

export const donorTypeEnum = pgEnum("donor_type", ["egg", "sperm", "embryo"]);

export const medicationFormEnum = pgEnum("medication_form", [
  "tablet",
  "capsule",
  "injection",
  "suppository",
  "pessary",
  "syrup",
  "cream",
  "gel",
  "drops",
  "inhaler",
  "other",
]);

export const prescriptionStatusEnum = pgEnum("prescription_status", [
  "prescribed",
  "dispensed",
  "completed",
  "cancelled",
]);

export const embryoGeneticResultTestTypeEnum = pgEnum("embryo_genetic_result_test_type", [
  "PGT-A",
  "PGT-M",
  "PGT-SR",
  "PGT-HLA",
  "other",
]);

export const embryoGeneticResultResultEnum = pgEnum("embryo_genetic_result_result", [
  "euploid",
  "aneuploid",
  "mosaic",
  "inconclusive",
]);

export const MODULE_SLUGS = [
  "patientManagement",
  "scheduling",
  "emr",
  "ivfLab",
  "billing",
] as const;
export type ModuleSlug = (typeof MODULE_SLUGS)[number];

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 128 }),
  country: varchar("country", { length: 2 }).notNull(),
  postalCode: varchar("postal_code", { length: 32 }),
  specialty: varchar("specialty", { length: 255 }),
  licenseInfo: text("license_info"),
  enabledModules: text("enabled_modules"),
  defaultCurrency: varchar("default_currency", { length: 3 }).notNull().default("USD"),
  reminderChannel: reminderChannelEnum("reminder_channel").notNull().default("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tenantBranding = pgTable("tenant_branding", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  letterheadImageUrl: text("letterhead_image_url"),
  useLetterheadTemplate: boolean("use_letterhead_template").notNull().default(true),
  templateSlug: varchar("template_slug", { length: 64 }),
  marginTopMm: integer("margin_top_mm").notNull().default(20),
  marginBottomMm: integer("margin_bottom_mm").notNull().default(20),
  marginLeftMm: integer("margin_left_mm").notNull().default(20),
  marginRightMm: integer("margin_right_mm").notNull().default(20),
  footerAddress: text("footer_address"),
  footerPhone: varchar("footer_phone", { length: 64 }),
  footerEmail: varchar("footer_email", { length: 255 }),
  footerWebsite: varchar("footer_website", { length: 512 }),
  footerText: text("footer_text"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    roleSlug: roleSlugEnum("role_slug").notNull().default("staff"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_tenant_email_idx").on(table.tenantId, table.email),
  ]
);

export const roles = pgTable("roles", {
  slug: varchar("slug", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
});

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  roleSlug: roleSlugEnum("role_slug").notNull().default("staff"),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  invitedById: uuid("invited_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    mrNumber: varchar("mr_number", { length: 64 }),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 64 }),
    address: text("address"),
    city: varchar("city", { length: 128 }),
    state: varchar("state", { length: 128 }),
    country: varchar("country", { length: 2 }),
    postalCode: varchar("postal_code", { length: 32 }),
    gender: varchar("gender", { length: 32 }),
    notes: text("notes"),
    nationalIdType: varchar("national_id_type", { length: 32 }),
    nationalIdValue: varchar("national_id_value", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("patients_tenant_id_idx").on(table.tenantId),
    uniqueIndex("patients_tenant_mr_number_idx").on(table.tenantId, table.mrNumber),
    index("patients_national_id_idx").on(table.tenantId, table.nationalIdType, table.nationalIdValue),
  ]
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id").references(() => users.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    type: varchar("type", { length: 64 }).notNull().default("consultation"),
    status: varchar("status", { length: 32 }).notNull().default("scheduled"),
    notes: text("notes"),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    reminderSmsSentAt: timestamp("reminder_sms_sent_at", { withTimezone: true }),
    videoRoomId: varchar("video_room_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("appointments_tenant_start_idx").on(table.tenantId, table.startAt),
  ]
);

export const clinicalNotes = pgTable(
  "clinical_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    noteType: varchar("note_type", { length: 32 }).notNull().default("soap"),
    subjective: text("subjective"),
    objective: text("objective"),
    assessment: text("assessment"),
    plan: text("plan"),
    diagnosisCode: varchar("diagnosis_code", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("clinical_notes_tenant_patient_idx").on(table.tenantId, table.patientId),
  ]
);

export const ivfCycles = pgTable(
  "ivf_cycles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    cycleNumber: varchar("cycle_number", { length: 32 }).notNull(),
    cycleType: varchar("cycle_type", { length: 32 }).notNull().default("fresh"),
    status: varchar("status", { length: 32 }).notNull().default("planned"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ivf_cycles_tenant_patient_idx").on(table.tenantId, table.patientId),
  ]
);

export const embryos = pgTable(
  "embryos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => ivfCycles.id, { onDelete: "cascade" }),
    day: varchar("day", { length: 16 }),
    grade: varchar("grade", { length: 64 }),
    status: varchar("status", { length: 32 }).notNull().default("fresh"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("embryos_tenant_cycle_idx").on(table.tenantId, table.cycleId),
  ]
);

export const embryoGeneticResults = pgTable(
  "embryo_genetic_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    embryoId: uuid("embryo_id")
      .notNull()
      .references(() => embryos.id, { onDelete: "cascade" }),
    testType: embryoGeneticResultTestTypeEnum("test_type").notNull(),
    result: embryoGeneticResultResultEnum("result").notNull(),
    resultDate: timestamp("result_date", { withTimezone: true }).notNull(),
    labReference: varchar("lab_reference", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("embryo_genetic_results_embryo_idx").on(table.embryoId),
    index("embryo_genetic_results_tenant_idx").on(table.tenantId),
  ]
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    invoiceNumber: varchar("invoice_number", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("draft"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    totalAmount: varchar("total_amount", { length: 32 }).notNull().default("0"),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("invoices_tenant_number_idx").on(table.tenantId, table.invoiceNumber),
  ]
);

export const invoiceLines = pgTable("invoice_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: varchar("quantity", { length: 32 }).notNull().default("1"),
  unitPrice: varchar("unit_price", { length: 32 }).notNull().default("0"),
  amount: varchar("amount", { length: 32 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tenantSubscriptions = pgTable(
  "tenant_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" })
      .unique(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    status: varchar("status", { length: 32 }).notNull().default("incomplete"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    stripePriceId: varchar("stripe_price_id", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("tenant_subscriptions_tenant_idx").on(table.tenantId)]
);

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    quantity: varchar("quantity", { length: 32 }).notNull().default("0"),
    unit: varchar("unit", { length: 32 }).notNull().default("units"),
    reorderLevel: varchar("reorder_level", { length: 32 }).notNull().default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("inventory_items_tenant_idx").on(table.tenantId)]
);

export const patientPortalTokens = pgTable("patient_portal_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const patientOtpCodes = pgTable(
  "patient_otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    phone: varchar("phone", { length: 64 }).notNull(),
    code: varchar("code", { length: 8 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("patient_otp_codes_patient_expires_idx").on(table.patientId, table.expiresAt)]
);

export const referralCodes = pgTable(
  "referral_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 64 }).notNull(),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    note: text("note"),
    usedCount: varchar("used_count", { length: 32 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("referral_codes_tenant_code_idx").on(table.tenantId, table.code)]
);

export const referralSignups = pgTable("referral_signups", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralCodeId: uuid("referral_code_id")
    .notNull()
    .references(() => referralCodes.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  signedUpAt: timestamp("signed_up_at", { withTimezone: true }).defaultNow().notNull(),
});

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    keyHash: text("key_hash").notNull(),
    keyPrefix: varchar("key_prefix", { length: 16 }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("api_keys_tenant_idx").on(table.tenantId)]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 128 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: uuid("entity_id"),
    details: text("details"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_tenant_created_idx").on(table.tenantId, table.createdAt),
    index("audit_logs_tenant_action_idx").on(table.tenantId, table.action),
    index("audit_logs_tenant_entity_idx").on(table.tenantId, table.entityType),
  ]
);

export const donors = pgTable(
  "donors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    type: donorTypeEnum("type").notNull(),
    donorCode: varchar("donor_code", { length: 64 }).notNull(),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
    bloodType: varchar("blood_type", { length: 16 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("donors_tenant_code_idx").on(table.tenantId, table.donorCode),
  ]
);

export const surrogacyCases = pgTable(
  "surrogacy_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    caseNumber: varchar("case_number", { length: 64 }).notNull(),
    intendedParentPatientId: uuid("intended_parent_patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    surrogateName: varchar("surrogate_name", { length: 255 }).notNull(),
    surrogateContact: text("surrogate_contact"),
    status: varchar("status", { length: 32 }).notNull().default("matching"),
    startDate: timestamp("start_date", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("surrogacy_cases_tenant_case_number_idx").on(table.tenantId, table.caseNumber),
    index("surrogacy_cases_tenant_idx").on(table.tenantId),
  ]
);

// --- Formulary & prescriptions (Phase 7.2) ---

export const medications = pgTable(
  "medications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    brandName: varchar("brand_name", { length: 255 }).notNull(),
    genericName: varchar("generic_name", { length: 255 }).notNull(),
    dosage: varchar("dosage", { length: 128 }).notNull(),
    form: medicationFormEnum("form").notNull(),
    frequencyOptions: jsonb("frequency_options").$type<string[]>().notNull().default([]),
    instructionsCheckboxes: jsonb("instructions_checkboxes").$type<{
      pregnancy_safe?: boolean;
      lactation_safe?: boolean;
      addiction_risk?: boolean;
      dependency_risk?: boolean;
      drug_interaction_risk?: boolean;
      cautions?: boolean;
    }>().notNull().default({}),
    instructionsExtended: text("instructions_extended"),
    pharmaceuticalCompany: varchar("pharmaceutical_company", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("medications_tenant_idx").on(table.tenantId)]
);

export const medicationGroups = pgTable(
  "medication_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("medication_groups_tenant_idx").on(table.tenantId)]
);

export const medicationGroupItems = pgTable("medication_group_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  medicationGroupId: uuid("medication_group_id")
    .notNull()
    .references(() => medicationGroups.id, { onDelete: "cascade" }),
  medicationId: uuid("medication_id")
    .notNull()
    .references(() => medications.id, { onDelete: "cascade" }),
  quantityPerCycle: varchar("quantity_per_cycle", { length: 64 }),
  defaultDurationDays: integer("default_duration_days"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const prescriptions = pgTable(
  "prescriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    prescribedById: uuid("prescribed_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: prescriptionStatusEnum("status").notNull().default("prescribed"),
    prescriptionNumber: varchar("prescription_number", { length: 64 }),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("prescriptions_tenant_idx").on(table.tenantId),
    index("prescriptions_patient_idx").on(table.patientId),
    uniqueIndex("prescriptions_tenant_number_idx").on(table.tenantId, table.prescriptionNumber),
  ]
);

export const prescriptionLines = pgTable("prescription_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  prescriptionId: uuid("prescription_id")
    .notNull()
    .references(() => prescriptions.id, { onDelete: "cascade" }),
  medicationId: uuid("medication_id").references(() => medications.id, { onDelete: "cascade" }),
  medicationGroupId: uuid("medication_group_id").references(() => medicationGroups.id, { onDelete: "cascade" }),
  quantity: varchar("quantity", { length: 64 }).notNull().default("1"),
  durationDays: integer("duration_days"),
  frequency: varchar("frequency", { length: 128 }),
  instructionsOverride: text("instructions_override"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ICD-11 (WHO): full entity detail for search and "Disease Detail" display
export const icd11Entities = pgTable(
  "icd11_entities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 32 }).notNull().unique(),
    title: varchar("title", { length: 512 }).notNull(),
    description: text("description"),
    parentCode: varchar("parent_code", { length: 32 }),
    chapterCode: varchar("chapter_code", { length: 32 }),
    chapterTitle: varchar("chapter_title", { length: 512 }),
    sectionCode: varchar("section_code", { length: 32 }),
    sectionTitle: varchar("section_title", { length: 512 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("icd11_entities_code_idx").on(table.code),
    index("icd11_entities_parent_idx").on(table.parentCode),
    index("icd11_entities_title_search_idx").on(table.title),
  ]
);

// Patient diagnoses: ICD-11 code and/or custom (role-governed)
export const patientDiagnoses = pgTable(
  "patient_diagnoses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    icd11Code: varchar("icd11_code", { length: 32 }),
    customDiagnosis: text("custom_diagnosis"),
    recordedById: uuid("recorded_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
    roleSlugAtRecord: varchar("role_slug_at_record", { length: 32 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("patient_diagnoses_tenant_patient_idx").on(table.tenantId, table.patientId),
    index("patient_diagnoses_icd11_idx").on(table.icd11Code),
  ]
);

// Phase 7.6: Print jobs audit (labels, wrist bands, etc.)
export const printJobs = pgTable(
  "print_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 64 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    printedAt: timestamp("printed_at", { withTimezone: true }).defaultNow().notNull(),
    printedById: uuid("printed_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("print_jobs_tenant_printed_idx").on(table.tenantId, table.printedAt),
  ]
);

// Tenant-owned credentials: Twilio (SMS), Daily.co (video). No platform keys — tenants add their own.
export const tenantIntegrations = pgTable("tenant_integrations", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  twilioPhoneNumber: varchar("twilio_phone_number", { length: 32 }),
  dailyApiKey: text("daily_api_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Trial/waitlist signups: prevent repeat trial abuse (one trial per email/contact).
export const trialSignups = pgTable(
  "trial_signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }),
    clinicName: varchar("clinic_name", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("trial_signups_email_idx").on(table.email)]
);