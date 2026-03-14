/**
 * Run only Phase 5 migrations (0013 api_keys, 0014 referral_codes).
 * Use when the DB already has 0000-0012 applied and full run-migrations.js fails.
 * From website/: node scripts/run-0013-0014-only.js
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

const pending = ["0013_api_keys.sql", "0014_referral_codes.sql"];

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const dir = join(__dirname, "..", "db", "migrations");
  try {
    await client.connect();
    for (const file of pending) {
      const path = join(dir, file);
      const sql = readFileSync(path, "utf8");
      await client.query(sql);
      console.log("Ran:", file);
    }
    console.log("Pending migrations (0013, 0014) finished successfully.");
  } catch (e) {
    console.error("Migration failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
