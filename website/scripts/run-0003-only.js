/**
 * Run only 0003_super_admin.sql (for when 0000 and 0001 are already applied).
 */
const { readFileSync } = require("fs");
const { join } = require("path");
const { Client } = require("pg");

function loadEnv() {
  try {
    const content = readFileSync(join(__dirname, "..", ".env"), "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch (_) {}
}
loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in .env");
  process.exit(1);
}

const sql = readFileSync(
  join(__dirname, "..", "db", "migrations", "0003_super_admin.sql"),
  "utf8"
);

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  await client.query(sql);
  console.log("Ran: 0003_super_admin.sql");
  await client.end();
}

main().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
