/**
 * Count ICD-11 entities in the database. Usage: from website/, node scripts/count-icd11.js
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
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    const countRes = await client.query("SELECT COUNT(*) AS total FROM icd11_entities");
    const total = parseInt(countRes.rows[0].total, 10);
    const sampleRes = await client.query(
      "SELECT code, title FROM icd11_entities ORDER BY code LIMIT 5"
    );
    console.log("ICD-11 records in database:", total);
    console.log("Sample codes:", sampleRes.rows.map((r) => r.code + " " + r.title).join(" | "));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}
main();
