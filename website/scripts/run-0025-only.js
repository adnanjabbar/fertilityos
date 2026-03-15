/**
 * Run only migration 0025 (tenant_integrations, trial_signups). Use when the DB already has 0000–0024 applied.
 * Usage: from website/, node scripts/run-0025-only.js
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

const sql = readFileSync(
  join(__dirname, "..", "db", "migrations", "0025_tenant_integrations_and_trial_signups.sql"),
  "utf8"
);

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: process.env.DATABASE_SSL_NO_VERIFY === "true" ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await client.connect();
    await client.query(sql);
    console.log("Ran: 0025_tenant_integrations_and_trial_signups.sql");
  } catch (e) {
    console.error("Migration failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}
main();
