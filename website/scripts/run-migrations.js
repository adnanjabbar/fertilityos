/**
 * Run FertilityOS SQL migrations once against the database in DATABASE_URL.
 * Usage: set DATABASE_URL in website/.env, then from website/: node scripts/run-migrations.js
 */

const { readFileSync } = require("fs");
const { join } = require("path");
const { Client } = require("pg");

function loadEnv() {
  try {
    const path = join(__dirname, "..", ".env");
    const content = readFileSync(path, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch (_) {}
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Add it to website/.env and run again.");
  process.exit(1);
}

const migrations = [
  "0000_phase2_tenants_users_roles.sql",
  "0001_invitations.sql",
  "0002_patients.sql",
  "0003_super_admin.sql",
  "0004_appointments.sql",
  "0005_clinical_notes.sql",
  "0006_ivf_cycles.sql",
  "0007_invoices.sql",
  "0008_appointment_reminder_sent.sql",
  "0009_tenant_subscriptions.sql",
  "0010_tenant_enabled_modules.sql",
  "0011_inventory_items.sql",
  "0012_patient_portal_and_video.sql",
  "0013_api_keys.sql",
  "0014_referral_codes.sql",
  "0015_tenant_default_currency.sql",
  "0016_donors.sql",
  "0017_audit_logs.sql",
  "0018_surrogacy_cases.sql",
  "0019_embryo_genetic_results.sql",
  "0020_reminder_channel_and_sms.sql",
  "0021_icd11_and_patient_diagnoses.sql",
  "0022_formulary_prescriptions.sql",
  "0023_mr_number_and_print_jobs.sql",
  "0024_letterhead_prescription_portal_2fa.sql",
  "0025_tenant_integrations_and_trial_signups.sql",
  "0026_email_campaigns_and_tenant_email_settings.sql",
  "0027_whatsapp_integration.sql",
  "0028_lab_connectors.sql",
  "0029_locations_multi_location.sql",
  "0030_native_lis.sql",
  "0031_lab_catalog_patient_spouse_reports.sql",
  "0032_patients_country_length.sql",
  "0033_otp_verification_sso.sql",
  "0034_verified_emails.sql",
];

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const dir = join(__dirname, "..", "db", "migrations");
  try {
    await client.connect();
    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        filename varchar(255) PRIMARY KEY,
        applied_at timestamptz DEFAULT now() NOT NULL
      )
    `);
    const { rows: applied } = await client.query(
      "SELECT filename FROM _schema_migrations"
    );
    const appliedSet = new Set(applied.map((r) => r.filename));
    for (const file of migrations) {
      if (appliedSet.has(file)) {
        console.log("Skip (already applied):", file);
        continue;
      }
      const path = join(dir, file);
      const sql = readFileSync(path, "utf8");
      await client.query(sql);
      await client.query(
        "INSERT INTO _schema_migrations (filename) VALUES ($1)",
        [file]
      );
      console.log("Ran:", file);
    }
    console.log("Migrations finished successfully.");
  } catch (e) {
    console.error("Migration failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
