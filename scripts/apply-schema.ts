/**
 * Creates the blog's tables in the cdnm database (db/schema.sql). Safe to
 * run again: every statement is CREATE TABLE IF NOT EXISTS.
 *
 *   npm run db:schema
 */
import { readFileSync } from "fs";
import path from "path";
import { loadEnv } from "./env";

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
  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
