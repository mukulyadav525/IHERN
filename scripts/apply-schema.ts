/**
 * Creates the blog's tables in the cdnm database (db/schema.sql), then adds
 * columns that later releases introduced to tables that already exist. Safe
 * to run again (and after every release): every step checks first. Only adds;
 * never changes or removes anything.
 *
 *   npm run db:schema
 */
import { readFileSync } from "fs";
import path from "path";
import { loadEnv } from "./env";

const ADDED_COLUMNS: [string, string, string][] = [
  // the author's picture (blog admin, Authors)
  ["blog_authors", "photo_media_id", "INT NULL AFTER `bio`"],
];

async function main() {
  const envFile = loadEnv();
  const { getPool } = await import("@ihern/core/db");
  const pool = getPool("cdnm");
  if (!pool) throw new Error(`The cdnm database is not configured (settings read from ${envFile ?? "the environment"}).`);
  const sql = readFileSync(path.resolve(__dirname, "../db/schema.sql"), "utf8").replace(/^\s*--.*$/gm, "");
  const statements = sql.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean);
  for (const st of statements) {
    await pool.query(st);
    console.log("ok  ", /CREATE TABLE IF NOT EXISTS `(\w+)`/.exec(st)?.[1] ?? st.slice(0, 50));
  }
  // Columns added after the first release (MySQL has no ADD COLUMN IF NOT EXISTS).
  for (const [table, column, definition] of ADDED_COLUMNS) {
    const [rows] = await pool.query("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", [table, column]);
    if ((rows as unknown[]).length) continue;
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log("added", `${table}.${column}`);
  }
  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
