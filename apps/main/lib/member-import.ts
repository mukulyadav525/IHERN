import { randomBytes } from "crypto";
import { query, execute } from "@ihern/core/db";
import { sha256 } from "./admin";
import { assignMembershipNumber } from "./membership";

/**
 * Importing members from a CSV file (the membership admin's Members page).
 *
 * Reads the export's own file (Export active members / Export everyone), so
 * an export can be edited in a spreadsheet and brought back, and simpler
 * files with just a name and an email column. Columns are found by their
 * heading, in any order; unknown columns are ignored.
 *
 *   new address         a new registration. It gets no usable password: the
 *                       member sets one with "Forgot password".
 *   address registered  left alone, or (with "update") its details are
 *                       replaced by the file's non-empty cells.
 *
 * "Membership No." and "Photo" are not imported: a new member gets the next
 * IHERN/<year>-<month><n> number for their registration date, and the
 * photographs are files the CSV does not carry.
 */

export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 5000;

type Field = "studentName" | "studentEmail" | "studentMobile" | "institutionName" | "areasofinterest" | "areasofinteresthe" | "yourTitle" | "url" | "regDate" | "userStatus";

/** Headings (lower case, spaces collapsed) -> field. The export's first, then common alternatives. */
const HEADINGS: Record<string, Field> = {
  "candidate name": "studentName", name: "studentName", "full name": "studentName", "member name": "studentName",
  "candidate email": "studentEmail", email: "studentEmail", "email address": "studentEmail", "e-mail": "studentEmail",
  "candidate mobile": "studentMobile", mobile: "studentMobile", phone: "studentMobile", "mobile number": "studentMobile",
  organisation: "institutionName", organization: "institutionName", institution: "institutionName", "institution name": "institutionName",
  "areas of research interest": "areasofinterest", "research interest": "areasofinterest",
  "areas of research interest in higher education": "areasofinteresthe", "higher education interest": "areasofinteresthe",
  "your title": "yourTitle", title: "yourTitle", position: "yourTitle", designation: "yourTitle",
  "website link": "url", website: "url", url: "url",
  "registration date": "regDate", registered: "regDate",
  status: "userStatus",
};

const LIMITS: Partial<Record<Field, number>> = {
  studentName: 100, studentEmail: 100, studentMobile: 50, yourTitle: 150, institutionName: 200, url: 255,
  areasofinterest: 5000, areasofinteresthe: 5000,
};

const NAMES: Partial<Record<Field, string>> = {
  studentName: "name", studentEmail: "email address", studentMobile: "mobile number", yourTitle: "title",
  institutionName: "organisation", url: "website link", areasofinterest: "research interest", areasofinteresthe: "higher education interest",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** RFC 4180 CSV: quoted fields, doubled quotes, commas and line breaks inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

/** The export guards cells a spreadsheet would run as formulas with a leading ' ; take it off again. */
const unguard = (v: string) => (/^'([=@+\-\t\r])/.test(v) ? v.slice(1) : v);

export type ImportRow = { line: number } & Partial<Record<Field, string>>;
export type ImportProblem = { line: number; reason: string };

/** The file's rows as members, and the rows that cannot be imported (with why). */
export function readMembersCsv(text: string): { rows: ImportRow[]; problems: ImportProblem[]; columns: Field[]; error?: string } {
  const table = parseCsv(text.replace(/^﻿/, ""));
  if (!table.length) return { rows: [], problems: [], columns: [], error: "The file is empty." };
  const fields = table[0].map((h) => HEADINGS[h.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.:]$/, "")] ?? null);
  const columns = [...new Set(fields.filter((f): f is Field => f !== null))];
  if (!columns.includes("studentEmail") || !columns.includes("studentName")) {
    return { rows: [], problems: [], columns, error: "The file needs a name column and an email column (for example the export's “Candidate Name” and “Candidate Email”)." };
  }
  if (table.length - 1 > IMPORT_MAX_ROWS) return { rows: [], problems: [], columns, error: `The file has more than ${IMPORT_MAX_ROWS} rows. Please split it.` };

  const rows: ImportRow[] = [];
  const problems: ImportProblem[] = [];
  const seen = new Set<string>();
  table.slice(1).forEach((cells, i) => {
    const line = i + 2; // the spreadsheet's row number (the heading is row 1)
    const r: ImportRow = { line };
    fields.forEach((f, c) => {
      if (!f) return;
      const v = unguard(String(cells[c] ?? "").trim());
      if (v && !r[f]) r[f] = v;
    });
    const email = (r.studentEmail ?? "").toLowerCase();
    if (!r.studentName) return problems.push({ line, reason: "no name" });
    if (!EMAIL.test(email)) return problems.push({ line, reason: r.studentEmail ? `“${r.studentEmail}” is not an email address` : "no email address" });
    if (seen.has(email)) return problems.push({ line, reason: `${r.studentEmail} is already in the file (an earlier row)` });
    seen.add(email);
    const long = (Object.entries(LIMITS) as [Field, number][]).find(([f, max]) => (r[f]?.length ?? 0) > max);
    if (long) return problems.push({ line, reason: `the ${NAMES[long[0]]} is longer than ${long[1]} characters` });
    if (r.url && !/^https?:\/\//i.test(r.url)) r.url = "https://" + r.url;
    rows.push(r);
  });
  return { rows, problems, columns };
}

/** "Active" / "Y" / "Inactive" / "N" ... ; undefined when the cell says neither. */
function status(v: string | undefined): "Y" | "N" | undefined {
  const s = (v ?? "").trim().toLowerCase();
  if (["active", "y", "yes", "1"].includes(s)) return "Y";
  if (["inactive", "n", "no", "0"].includes(s)) return "N";
  return undefined;
}

/** A date the database takes (YYYY-MM-DD, with an optional time), else undefined. */
function date(v: string | undefined): string | undefined {
  const m = (v ?? "").trim().match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?$/);
  if (!m || Number.isNaN(Date.parse(m[1]))) return undefined;
  return m[2] ? `${m[1]} ${m[2].length === 5 ? m[2] + ":00" : m[2]}` : `${m[1]} 00:00:00`;
}

export type ImportOptions = { update: boolean; newStatus: "Y" | "N"; dryRun: boolean };
export type ImportSummary = { added: number; updated: number; unchanged: number; failed: ImportProblem[] };

/** Adds (and with `update`, updates) the rows. With `dryRun`, only counts what would happen. */
export async function importMembers(rows: ImportRow[], opts: ImportOptions): Promise<ImportSummary | null> {
  const existing = await query<{ studentID: number; studentEmail: string }>("ihern2024", "SELECT studentID, studentEmail FROM studentregistration");
  if (existing === null) return null;
  const byEmail = new Map(existing.map((r) => [String(r.studentEmail).trim().toLowerCase(), Number(r.studentID)]));
  const sum: ImportSummary = { added: 0, updated: 0, unchanged: 0, failed: [] };

  for (const r of rows) {
    const id = byEmail.get(r.studentEmail!.toLowerCase());
    if (id !== undefined) {
      if (!opts.update) {
        sum.unchanged++;
        continue;
      }
      // Only the file's non-empty cells replace what is stored.
      const set: string[] = [];
      const values: string[] = [];
      for (const f of ["studentName", "studentMobile", "yourTitle", "institutionName", "areasofinterest", "areasofinteresthe", "url"] as const) {
        if (r[f]) {
          set.push(`${f} = ?`);
          values.push(r[f]!);
        }
      }
      const st = status(r.userStatus);
      if (st) {
        set.push("userStatus = ?");
        values.push(st);
      }
      if (!set.length) {
        sum.unchanged++;
        continue;
      }
      if (opts.dryRun) {
        sum.updated++;
        continue;
      }
      const res = await execute("ihern2024", `UPDATE studentregistration SET ${set.join(", ")} WHERE studentID = ?`, [...values, id]);
      if (res === null) sum.failed.push({ line: r.line, reason: "could not be saved" });
      else {
        sum.updated++;
        // A member made inactive is signed out, as when an admin deactivates them.
        if (st === "N") await execute("ihern2024", "DELETE FROM authsession WHERE studentID = ?", [id]);
      }
      continue;
    }

    if (opts.dryRun) {
      sum.added++;
      continue;
    }
    const regDate = date(r.regDate);
    const res = await execute(
      "ihern2024",
      `INSERT INTO studentregistration (studentName, studentEmail, studentMobile, institutionName, areasofinterest,
         areasofinteresthe, yourTitle, url, studentPassword, photo, tokenCode, userStatus${regDate ? ", regDate" : ""})
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?${regDate ? ", ?" : ""})`,
      [
        r.studentName!, r.studentEmail!, r.studentMobile ?? "", r.institutionName ?? "", r.areasofinterest ?? "", r.areasofinteresthe ?? "",
        r.yourTitle ?? "", r.url ?? "",
        // No usable password: the member chooses one with "Forgot password".
        sha256(randomBytes(32).toString("hex")),
        randomBytes(16).toString("hex"),
        status(r.userStatus) ?? opts.newStatus,
        ...(regDate ? [regDate] : []),
      ]
    );
    if (res === null) sum.failed.push({ line: r.line, reason: "could not be saved" });
    else {
      sum.added++;
      byEmail.set(r.studentEmail!.toLowerCase(), Number(res.insertId));
      await assignMembershipNumber(Number(res.insertId));
    }
  }
  return sum;
}
