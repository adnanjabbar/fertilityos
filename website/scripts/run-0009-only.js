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

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const dir = join(__dirname, "..", "db", "migrations");
const sql = readFileSync(join(dir, "0009_tenant_subscriptions.sql"), "utf8");

client
  .connect()
  .then(() => client.query(sql))
  .then(() => {
    console.log("Ran: 0009_tenant_subscriptions.sql");
    return client.end();
  })
  .catch((e) => {
    console.error("Migration failed:", e.message);
    process.exit(1);
  });
