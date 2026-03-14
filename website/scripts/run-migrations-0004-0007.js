/**
 * Run only migrations 0004–0007 (appointments, clinical_notes, ivf_cycles, invoices).
 * Use when 0000–0003 are already applied.
 * From website/: node scripts/run-migrations-0004-0007.js
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
  "0004_appointments.sql",
  "0005_clinical_notes.sql",
  "0006_ivf_cycles.sql",
  "0007_invoices.sql",
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
    console.log("Migrations 0004–0007 finished successfully.");
  } catch (e) {
    console.error("Migration failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
