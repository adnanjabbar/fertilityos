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

export const reminderChannelEnum = pgEnum("reminder_channel", ["email", "sms", "both", "whatsapp"]);

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
  "labManagement",
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
    defaultLocationId: uuid("default_location_id").references(() => locations.id, { onDelete: "set null" }),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash"),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    roleSlug: roleSlugEnum("role_slug").notNull().default("staff"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    phone: varchar("phone", { length: 64 }),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
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

// Multi-location: physical locations per tenant (Phase 8.4)
export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address"),
    city: varchar("city", { length: 128 }),
    state: varchar("state", { length: 128 }),
    country: varchar("country", { length: 2 }),
    postalCode: varchar("postal_code", { length: 32 }),
    timezone: varchar("timezone", { length: 64 }),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("locations_tenant_idx").on(table.tenantId)]
);

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    preferredLocationId: uuid("preferred_location_id").references(() => locations.id, { onDelete: "set null" }),
    mrNumber: varchar("mr_number", { length: 64 }),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 64 }),
    address: text("address"),
    city: varchar("city", { length: 128 }),
    state: varchar("state", { length: 128 }),
    country: varchar("country", { length: 128 }),
    postalCode: varchar("postal_code", { length: 32 }),
    gender: varchar("gender", { length: 32 }),
    genderIdentity: varchar("gender_identity", { length: 64 }),
    relationshipStatus: varchar("relationship_status", { length: 32 }),
    coupleType: varchar("couple_type", { length: 32 }),
    spouseFirstName: varchar("spouse_first_name", { length: 255 }),
    spouseLastName: varchar("spouse_last_name", { length: 255 }),
    spouseDateOfBirth: timestamp("spouse_date_of_birth", { withTimezone: true }),
    spouseEmail: varchar("spouse_email", { length: 255 }),
    spousePhone: varchar("spouse_phone", { length: 64 }),
    notes: text("notes"),
    nationalIdType: varchar("national_id_type", { length: 32 }),
    nationalIdValue: varchar("national_id_value", { length: 255 }),
    phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
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
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
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
    reminderWhatsappSentAt: timestamp("reminder_whatsapp_sent_at", { withTimezone: true }),
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

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    context: varchar("context", { length: 32 }).notNull(),
    phone: varchar("phone", { length: 64 }).notNull(),
    code: varchar("code", { length: 8 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("otp_codes_phone_context_expires_idx").on(table.phone, table.context, table.expiresAt)]
);

export const emailVerificationCodes = pgTable(
  "email_verification_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    code: varchar("code", { length: 8 }).notNull(),
    context: varchar("context", { length: 32 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("email_verification_codes_email_context_expires_idx").on(table.email, table.context, table.expiresAt)]
);

export const verifiedEmails = pgTable(
  "verified_emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    context: varchar("context", { length: 32 }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).defaultNow().notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("verified_emails_email_context_idx").on(table.email, table.context)]
);

export const userAccounts = pgTable(
  "user_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_accounts_provider_account_idx").on(table.provider, table.providerAccountId),
    index("user_accounts_user_id_idx").on(table.userId),
  ]
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

// WhatsApp provider slug for tenant_integrations
export const whatsappProviderEnum = pgEnum("whatsapp_provider", ["twilio_whatsapp", "meta_cloud_api"]);

// Email sending: platform (Resend + FertilityOS footer) vs custom_domain (tenant SMTP, no platform footer).
export const emailSendingModeEnum = pgEnum("email_sending_mode", ["platform", "custom_domain"]);

// Newsletter/campaign status.
export const emailCampaignStatusEnum = pgEnum("email_campaign_status", ["draft", "scheduled", "sent"]);

// Tenant-owned credentials: Twilio (SMS), Daily.co (video), WhatsApp (tenant-owned), optional custom SMTP. No platform keys — tenants add their own.
export const tenantIntegrations = pgTable("tenant_integrations", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  twilioPhoneNumber: varchar("twilio_phone_number", { length: 32 }),
  dailyApiKey: text("daily_api_key"),
  whatsappProvider: whatsappProviderEnum("whatsapp_provider"),
  whatsappPhoneNumberId: text("whatsapp_phone_number_id"),
  whatsappAccessToken: text("whatsapp_access_token"),
  whatsappFromNumber: varchar("whatsapp_from_number", { length: 32 }),
  whatsappTemplateNamespace: text("whatsapp_template_namespace"),
  emailSendingMode: emailSendingModeEnum("email_sending_mode").default("platform"),
  customSmtpHost: text("custom_smtp_host"),
  customSmtpPort: integer("custom_smtp_port"),
  customSmtpUser: text("custom_smtp_user"),
  customSmtpPassword: text("custom_smtp_password"),
  customSmtpFromEmail: varchar("custom_smtp_from_email", { length: 255 }),
  customSmtpSecure: boolean("custom_smtp_secure").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Newsletter / email campaigns (Phase 8.2). recipientFilter: e.g. "all" or JSON for segments.
export const emailCampaigns = pgTable(
  "email_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 512 }).notNull(),
    bodyHtml: text("body_html").notNull(),
    bodyText: text("body_text").notNull(),
    status: emailCampaignStatusEnum("status").notNull().default("draft"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    recipientFilter: text("recipient_filter").notNull().default("all"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("email_campaigns_tenant_status_idx").on(table.tenantId, table.status),
    index("email_campaigns_scheduled_at_idx").on(table.scheduledAt),
  ]
);

// Optional: per-recipient send log (campaignId, patientId, sentAt, provider).
export const emailSendLog = pgTable(
  "email_send_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => emailCampaigns.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
    provider: varchar("provider", { length: 32 }).notNull(), // 'resend' | 'smtp'
  },
  (table) => [
    index("email_send_log_campaign_idx").on(table.campaignId),
    index("email_send_log_patient_idx").on(table.patientId),
  ]
);

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

// --- LIS/LIMS lab integration (Phase 8.3) ---

export const labConnectorTypeEnum = pgEnum("lab_connector_type", ["lis", "lims"]);

export const labConnectors = pgTable(
  "lab_connectors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    type: labConnectorTypeEnum("type").notNull(),
    provider: varchar("provider", { length: 64 }).notNull(), // e.g. hl7_fhir, custom_api, file_import
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("lab_connectors_tenant_idx").on(table.tenantId)]
);

export const labOrders = pgTable(
  "lab_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    cycleId: uuid("cycle_id").references(() => ivfCycles.id, { onDelete: "set null" }),
    specimenId: uuid("specimen_id"), // optional FK when specimens table exists
    connectorId: uuid("connector_id").references(() => labConnectors.id, { onDelete: "set null" }),
    externalId: varchar("external_id", { length: 255 }),
    orderCode: varchar("order_code", { length: 128 }),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    requestedAt: timestamp("requested_at", { withTimezone: true }),
    resultAt: timestamp("result_at", { withTimezone: true }),
    resultPayload: jsonb("result_payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("lab_orders_tenant_idx").on(table.tenantId),
    index("lab_orders_patient_idx").on(table.patientId),
    index("lab_orders_cycle_idx").on(table.cycleId),
    index("lab_orders_connector_external_idx").on(table.connectorId, table.externalId),
  ]
);

export const labResultMappings = pgTable(
  "lab_result_mappings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    connectorId: uuid("connector_id")
      .notNull()
      .references(() => labConnectors.id, { onDelete: "cascade" }),
    externalCode: varchar("external_code", { length: 128 }).notNull(),
    internalCode: varchar("internal_code", { length: 128 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("lab_result_mappings_connector_idx").on(table.connectorId),
    uniqueIndex("lab_result_mappings_connector_external_idx").on(table.connectorId, table.externalCode),
  ]
);

// --- Native LIS (Lab Information Management System) ---

export const labSpecimens = pgTable(
  "lab_specimens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    specimenType: varchar("specimen_type", { length: 64 }).notNull(),
    collectedAt: timestamp("collected_at", { withTimezone: true }),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("lab_specimens_tenant_idx").on(table.tenantId),
    index("lab_specimens_patient_idx").on(table.patientId),
  ]
);

export const labTests = pgTable(
  "lab_tests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 64 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 128 }),
    unit: varchar("unit", { length: 32 }),
    referenceRangeLow: varchar("reference_range_low", { length: 64 }),
    referenceRangeHigh: varchar("reference_range_high", { length: 64 }),
    referenceRangeMaleLow: varchar("reference_range_male_low", { length: 64 }),
    referenceRangeMaleHigh: varchar("reference_range_male_high", { length: 64 }),
    referenceRangeFemaleLow: varchar("reference_range_female_low", { length: 64 }),
    referenceRangeFemaleHigh: varchar("reference_range_female_high", { length: 64 }),
    referenceRangeText: text("reference_range_text"),
    isPanel: boolean("is_panel").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("lab_tests_tenant_code_idx").on(table.tenantId, table.code),
    index("lab_tests_tenant_idx").on(table.tenantId),
  ]
);

export const labReportDocuments = pgTable(
  "lab_report_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    labName: varchar("lab_name", { length: 255 }),
    labLocation: varchar("lab_location", { length: 255 }),
    mrNumberOnReport: varchar("mr_number_on_report", { length: 64 }),
    fileKey: varchar("file_key", { length: 512 }),
    notes: text("notes"),
    reportedAt: timestamp("reported_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("lab_report_documents_tenant_idx").on(table.tenantId),
    index("lab_report_documents_patient_idx").on(table.patientId),
  ]
);

export const labPanels = pgTable(
  "lab_panels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    panelTestId: uuid("panel_test_id")
      .notNull()
      .references(() => labTests.id, { onDelete: "cascade" }),
    memberTestId: uuid("member_test_id")
      .notNull()
      .references(() => labTests.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("lab_panels_tenant_idx").on(table.tenantId),
    index("lab_panels_panel_idx").on(table.panelTestId),
  ]
);

export const labOrderItems = pgTable(
  "lab_order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => labOrders.id, { onDelete: "cascade" }),
    testId: uuid("test_id")
      .notNull()
      .references(() => labTests.id, { onDelete: "restrict" }),
    specimenId: uuid("specimen_id").references(() => labSpecimens.id, { onDelete: "set null" }),
    status: varchar("status", { length: 32 }).notNull().default("pending"),
    resultValue: varchar("result_value", { length: 255 }),
    resultUnit: varchar("result_unit", { length: 32 }),
    referenceRange: varchar("reference_range", { length: 128 }),
    resultAt: timestamp("result_at", { withTimezone: true }),
    performedBy: uuid("performed_by").references(() => users.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("lab_order_items_tenant_idx").on(table.tenantId),
    index("lab_order_items_order_idx").on(table.orderId),
    index("lab_order_items_test_idx").on(table.testId),
  ]
);