/**
 * Seed the Super Admin user (platform owner dashboard).
 * Login: super@fertilityos.com / superadmin (or set SUPER_ADMIN_PASSWORD in .env)
 *
 * Run migrations first (including 0003_super_admin.sql). Then from website/:
 *   node scripts/seed-super-admin.js
 */

const { readFileSync } = require("fs");
const { join } = require("path");
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

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

const SUPER_EMAIL = "super@fertilityos.com";
const SUPER_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "superadmin";
const SYSTEM_TENANT_SLUG = "system";

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const tenantRes = await client.query(
      "SELECT id FROM tenants WHERE slug = $1 LIMIT 1",
      [SYSTEM_TENANT_SLUG]
    );
    if (tenantRes.rows.length === 0) {
      console.error("System tenant not found. Run migrations first (including 0003_super_admin.sql).");
      process.exit(1);
    }
    const tenantId = tenantRes.rows[0].id;

    const userRes = await client.query(
      "SELECT id FROM users WHERE tenant_id = $1 AND email = $2 LIMIT 1",
      [tenantId, SUPER_EMAIL]
    );
    const passwordHash = await bcrypt.hash(SUPER_PASSWORD, 12);
    if (userRes.rows.length === 0) {
      await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, full_name, role_slug)
         VALUES ($1, $2, $3, $4, 'super_admin')`,
        [tenantId, SUPER_EMAIL, passwordHash, "Super Administrator"]
      );
      console.log("Created super admin:", SUPER_EMAIL);
    } else {
      await client.query(
        "UPDATE users SET password_hash = $1, full_name = $2 WHERE tenant_id = $3 AND email = $4",
        [passwordHash, "Super Administrator", tenantId, SUPER_EMAIL]
      );
      console.log("Updated super admin password:", SUPER_EMAIL);
    }

    console.log("\nSuper admin login: " + SUPER_EMAIL + " / " + SUPER_PASSWORD);
    console.log("Dashboard: /app/super");
  } catch (e) {
    console.error("Seed failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
