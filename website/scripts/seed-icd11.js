/**
 * Seed ICD-11 entities from subset JSON (fertility/reproductive health codes).
 * Run migrations first (including 0021_icd11_and_patient_diagnoses.sql). Then from website/:
 *   node scripts/seed-icd11.js
 *
 * To load a full WHO ICD-11 export, use the same JSON shape in a file and pass path:
 *   node scripts/seed-icd11.js path/to/icd11-full.json
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

const defaultPath = join(__dirname, "..", "db", "seed-data", "icd11-subset.json");

async function main() {
  const dataPath = process.argv[2] || defaultPath;
  let data;
  try {
    data = JSON.parse(readFileSync(dataPath, "utf8"));
  } catch (e) {
    console.error("Failed to read or parse JSON:", dataPath, e.message);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error("JSON must be an array of { code, title, description, ... }");
    process.exit(1);
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    let inserted = 0;
    let skipped = 0;

    for (const row of data) {
      const code = row.code?.trim();
      const title = row.title?.trim();
      if (!code || !title) {
        console.warn("Skipping row with missing code or title:", row);
        skipped++;
        continue;
      }

      const res = await client.query(
        `INSERT INTO icd11_entities (
          code, title, description, parent_code,
          chapter_code, chapter_title, section_code, section_title
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (code) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          parent_code = EXCLUDED.parent_code,
          chapter_code = EXCLUDED.chapter_code,
          chapter_title = EXCLUDED.chapter_title,
          section_code = EXCLUDED.section_code,
          section_title = EXCLUDED.section_title,
          updated_at = now()`,
        [
          code,
          title,
          row.description?.trim() || null,
          row.parentCode?.trim() || null,
          row.chapterCode?.trim() || null,
          row.chapterTitle?.trim() || null,
          row.sectionCode?.trim() || null,
          row.sectionTitle?.trim() || null,
        ]
      );
      if (res.rowCount === 1) inserted++;
    }

    console.log("ICD-11 seed done. Rows processed:", data.length, "Inserted/updated:", inserted, "Skipped:", skipped);
  } catch (e) {
    console.error("Seed failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
