/**
 * Seed full WHO ICD-11 for Mortality and Morbidity Statistics (MMS) into icd11_entities.
 * Uses the WHO LinearizationMiniOutput-MMS-en.txt (tab-separated) from
 * https://icd.who.int/dev11/Downloads/Download?fileName=LinearizationMiniOutput-MMS-en.zip
 *
 * Run from website/: node scripts/seed-icd11-full.js
 * Optional: node scripts/seed-icd11-full.js /path/to/LinearizationMiniOutput-MMS-en.txt
 */

const { createReadStream } = require("fs");
const { createInterface } = require("readline");
const { join } = require("path");
const { Client } = require("pg");

function loadEnv() {
  try {
    const path = join(__dirname, "..", ".env");
    const content = require("fs").readFileSync(path, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch (_) {}
}
loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Add it to website/.env");
  process.exit(1);
}

const defaultPath = join(
  __dirname,
  "..",
  "db",
  "seed-data",
  "icd11-mms",
  "LinearizationMiniOutput-MMS-en.txt"
);

function unquote(s) {
  if (typeof s !== "string") return "";
  return s.trim().replace(/^"|"$/g, "").replace(/^[\s\-]+/, "").trim();
}

function parentCodeFromCode(code) {
  if (!code || typeof code !== "string") return null;
  const trimmed = code.trim();
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot === -1) return null;
  return trimmed.slice(0, lastDot);
}

const BATCH_SIZE = 500;

async function main() {
  const dataPath = process.argv[2] || defaultPath;
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const fileStream = createReadStream(dataPath, { encoding: "utf8" });
  const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

  let header = null;
  let chapterNo = "";
  let chapterTitle = "";
  let batch = [];
  let total = 0;
  let inserted = 0;

  const flush = async () => {
    if (batch.length === 0) return;
    const values = [];
    const params = [];
    let i = 1;
    for (const row of batch) {
      values.push(
        `($${i}, $${i + 1}, $${i + 2}, $${i + 3}, $${i + 4}, $${i + 5}, $${i + 6}, $${i + 7})`
      );
      params.push(
        row.code,
        row.title.slice(0, 512),
        row.description,
        row.parentCode ? row.parentCode.slice(0, 32) : null,
        row.chapterCode ? row.chapterCode.slice(0, 32) : null,
        row.chapterTitle ? row.chapterTitle.slice(0, 512) : null,
        row.sectionCode ? row.sectionCode.slice(0, 32) : null,
        row.sectionTitle ? row.sectionTitle.slice(0, 512) : null
      );
      i += 8;
    }
    try {
      const res = await client.query(
        `INSERT INTO icd11_entities (
          code, title, description, parent_code,
          chapter_code, chapter_title, section_code, section_title
        ) VALUES ${values.join(", ")}
        ON CONFLICT (code) DO UPDATE SET
          title = EXCLUDED.title,
          parent_code = EXCLUDED.parent_code,
          chapter_code = EXCLUDED.chapter_code,
          chapter_title = EXCLUDED.chapter_title,
          section_code = EXCLUDED.section_code,
          section_title = EXCLUDED.section_title,
          updated_at = now()`,
        params
      );
      inserted += batch.length;
    } catch (e) {
      console.error("Batch error:", e.message);
      for (const row of batch) {
        try {
          await client.query(
            `INSERT INTO icd11_entities (
              code, title, description, parent_code,
              chapter_code, chapter_title, section_code, section_title
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (code) DO UPDATE SET
              title = EXCLUDED.title,
              parent_code = EXCLUDED.parent_code,
              chapter_code = EXCLUDED.chapter_code,
              chapter_title = EXCLUDED.chapter_title,
              section_code = EXCLUDED.section_code,
              section_title = EXCLUDED.section_title,
              updated_at = now()`,
            [
              row.code,
              row.title.slice(0, 512),
              row.description,
              row.parentCode ? row.parentCode.slice(0, 32) : null,
              row.chapterCode ? row.chapterCode.slice(0, 32) : null,
              row.chapterTitle ? row.chapterTitle.slice(0, 512) : null,
              row.sectionCode ? row.sectionCode.slice(0, 32) : null,
              row.sectionTitle ? row.sectionTitle.slice(0, 512) : null,
            ]
          );
          inserted++;
        } catch (e2) {
          console.error("Row error:", row.code, e2.message);
        }
      }
    }
    batch = [];
  };

  for await (const line of rl) {
    const fields = line.split("\t");
    if (!header) {
      header = fields;
      continue;
    }
    const code = fields[2] ? String(fields[2]).trim() : "";
    const titleRaw = fields[4];
    const classKind = fields[5] ? String(fields[5]).trim() : "";
    const chapterNoCol = fields[9] ? String(fields[9]).trim() : "";

    if (classKind === "chapter") {
      chapterNo = chapterNoCol;
      chapterTitle = unquote(titleRaw);
      continue;
    }

    if (!code) continue;

    const title = unquote(titleRaw);
    if (!title) continue;

    const parentCode = parentCodeFromCode(code);
    batch.push({
      code,
      title,
      description: null,
      parentCode,
      chapterCode: chapterNo || null,
      chapterTitle: chapterTitle || null,
      sectionCode: null,
      sectionTitle: null,
    });
    total++;

    if (batch.length >= BATCH_SIZE) {
      await flush();
      process.stdout.write(`\rProcessed ${total} rows, inserted/updated ${inserted}...`);
    }
  }

  await flush();
  console.log(`\nDone. Total rows with code: ${total}. Inserted/updated: ${inserted}.`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
