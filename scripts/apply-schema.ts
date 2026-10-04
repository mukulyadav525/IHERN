/**
 * Creates the tables in both databases, then adds columns that later
 * releases introduced to tables that already exist. Safe to run again (and
 * after every release): every step checks first. Only adds; never changes or
 * removes anything.
 *
 *   cdnm        db/schema.sql (accounts, blog, events)
 *   ihern2024   db/membership-schema.sql (members), when configured
 *
 * The first time the events table is created, it is filled with the events
 * the home page listed before the events admin existed (db/events-seed.sql).
 *
 *   npm run db:schema
 */
import { readFileSync } from "fs";
import path from "path";
import type { Pool } from "mysql2/promise";
import { loadEnv } from "./env";

type Added = [table: string, column: string, definition: string];
type Index = [table: string, index: string, definition: string];

const CDNM_COLUMNS: Added[] = [
  // the author's picture (blog admin, Authors)
  ["blog_authors", "photo_media_id", "INT NULL AFTER `bio`"],
  // deactivating an editor without removing them
  ["blog_editors", "active", "TINYINT(1) NOT NULL DEFAULT 1 AFTER `role`"],
  ["event_editors", "active", "TINYINT(1) NOT NULL DEFAULT 1 AFTER `role`"],
];
const MEMBERSHIP_COLUMNS: Added[] = [
  // the IHERN/<year>-<month><n> membership numbers (from 5 October 2026)
  ["studentregistration", "membershipNo", "VARCHAR(40) NULL DEFAULT NULL"],
];
const MEMBERSHIP_INDEXES: Index[] = [["studentregistration", "uniq_membership_no", "UNIQUE KEY `uniq_membership_no` (`membershipNo`)"]];

const statements = (file: string) =>
  readFileSync(path.resolve(__dirname, "../db", file), "utf8")
    .replace(/^\s*--.*$/gm, "")
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);

async function exists(pool: Pool, sql: string, params: string[]): Promise<boolean> {
  const [rows] = await pool.query(sql, params);
  return (rows as unknown[]).length > 0;
}

async function apply(pool: Pool, file: string, columns: Added[], indexes: Index[] = []): Promise<void> {
  for (const st of statements(file)) {
    await pool.query(st);
    console.log("ok  ", /CREATE TABLE IF NOT EXISTS `(\w+)`/.exec(st)?.[1] ?? st.slice(0, 50));
  }
  // Columns added after the first release (MySQL has no ADD COLUMN IF NOT EXISTS).
  for (const [table, column, definition] of columns) {
    if (await exists(pool, "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", [table, column])) continue;
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log("added", `${table}.${column}`);
  }
  for (const [table, index, definition] of indexes) {
    if (await exists(pool, "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?", [table, index])) continue;
    await pool.query(`ALTER TABLE \`${table}\` ADD ${definition}`);
    console.log("added", `${table}.${index}`);
  }
}

async function main() {
  const envFile = loadEnv();
  const { getPool } = await import("@ihern/core/db");
  const cdnm = getPool("cdnm") as Pool | null;
  if (!cdnm) throw new Error(`The cdnm database is not configured (settings read from ${envFile ?? "the environment"}).`);

  const newEvents = !(await exists(cdnm, "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?", ["ihern_events"]));
  await apply(cdnm, "schema.sql", CDNM_COLUMNS);
  if (newEvents) {
    for (const st of statements("events-seed.sql")) await cdnm.query(st);
    console.log("ok   ihern_events: added the events the home page listed");
  }

  const members = getPool("ihern2024") as Pool | null;
  if (members) await apply(members, "membership-schema.sql", MEMBERSHIP_COLUMNS, MEMBERSHIP_INDEXES);
  else console.log("skip  the membership tables: ihern2024 is not configured in these settings");

  await cdnm.end();
  if (members && members !== cdnm) await members.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
