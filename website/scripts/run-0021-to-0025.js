/**
 * Run migrations 0021 through 0025 only. Use when the DB already has 0000–0020 applied.
 * Usage: from website/, node scripts/run-0021-to-0025.js
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

const FILES = [
  "0021_icd11_and_patient_diagnoses.sql",
  "0022_formulary_prescriptions.sql",
  "0023_mr_number_and_print_jobs.sql",
  "0024_letterhead_prescription_portal_2fa.sql",
  "0025_tenant_integrations_and_trial_signups.sql",
];

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: process.env.DATABASE_SSL_NO_VERIFY === "true" ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await client.connect();
    const dir = join(__dirname, "..", "db", "migrations");
    for (const file of FILES) {
      const sql = readFileSync(join(dir, file), "utf8");
      await client.query(sql);
      console.log("Ran:", file);
    }
    console.log("Migrations 0021–0025 finished.");
  } catch (e) {
    console.error("Migration failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}
main();
