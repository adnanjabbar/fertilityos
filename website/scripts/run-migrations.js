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
];

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const dir = join(__dirname, "..", "db", "migrations");
  try {
    await client.connect();
    for (const file of migrations) {
      const path = join(dir, file);
      const sql = readFileSync(path, "utf8");
      await client.query(sql);
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
