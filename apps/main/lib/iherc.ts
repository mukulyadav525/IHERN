import { createHash } from "crypto";
import { execute, query, type SqlParam } from "@ihern/core/db";
import { membershipNumber } from "./membership-options";
import { payableFor, rupees, type FeeCategory } from "./iherc-fees";

/**
 * IHERC 2026 registration: confirming members before they pay, and checking
 * the payments afterwards. The payment itself happens on the finance
 * department's form, which this site cannot change or read (lib/iherc-fees.ts).
 *
 *   before paying   the registration page confirms an IHERN member (signed
 *                   in, membership number, or email + phone), shows the
 *                   details to enter and the amount, and notes it here
 *                   (cdnm.iherc_checks).
 *   after paying    finance's list of payments is imported
 *                   (cdnm.iherc_payments) and each payment is checked against
 *                   the member list: right category, right amount.
 */

type Row = Record<string, unknown>;
const str = (v: unknown) => (v == null ? "" : String(v));

/* ---------------- members, for the registration page ---------------- */

export type CheckMethod = "account" | "number" | "email-phone";

/**
 * A confirmed member. `full` is false when they were found by membership
 * number alone: then only their name and number are shown, so typing in a
 * stranger's number does not reveal their email or phone.
 */
export type ConfirmedMember = {
  id: number;
  number: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  affiliation: string;
  full: boolean;
};

const MEMBER_COLUMNS = "studentID, studentName, studentEmail, studentMobile, yourTitle, institutionName, membershipNo";

function toConfirmed(r: Row, full: boolean): ConfirmedMember {
  return {
    id: Number(r.studentID),
    number: membershipNumber({ studentID: Number(r.studentID), membershipNo: str(r.membershipNo) || null }),
    name: str(r.studentName).trim(),
    email: full ? str(r.studentEmail).trim() : "",
    phone: full ? str(r.studentMobile).trim() : "",
    designation: full ? str(r.yourTitle).trim() : "",
    affiliation: full ? str(r.institutionName).trim() : "",
    full,
  };
}

/** Digits only; for comparing phone numbers written differently ("+91 98…", "098…"). */
export const phoneDigits = (s: string) => s.replace(/\D/g, "");

/** Same number: equal, or the same last 10 digits (country code or a leading 0 left off). */
export function samePhone(a: string, b: string): boolean {
  const x = phoneDigits(a);
  const y = phoneDigits(b);
  if (x.length < 6 || y.length < 6) return false;
  return x === y || (x.length >= 10 && y.length >= 10 && x.slice(-10) === y.slice(-10));
}

/**
 * "IHERN/2026-1007" (stored with the member) or "IHERN/2025-<id>" (the
 * number of members who joined before the new numbers). Case, spaces and a
 * missing "IHERN/" are forgiven.
 */
export function parseMembershipNo(input: string): { text: string; year: number; rest: string } | null {
  const m = /^(?:IHERN\s*[/\\-]?\s*)?(\d{4})\s*-\s*(\d{1,8})$/i.exec(input.trim());
  return m ? { text: `IHERN/${m[1]}-${m[2]}`, year: Number(m[1]), rest: m[2] } : null;
}

/** null: not found; "error": the membership database could not be read. */
export async function memberByEmail(email: string): Promise<ConfirmedMember | null | "error"> {
  const rows = await query<Row>("ihern2024", `SELECT ${MEMBER_COLUMNS} FROM studentregistration WHERE LOWER(TRIM(studentEmail)) = ? AND userStatus = 'Y' ORDER BY studentID LIMIT 1`, [
    email.trim().toLowerCase(),
  ]);
  if (rows === null) return "error";
  return rows[0] ? toConfirmed(rows[0], true) : null;
}

export async function memberByNumber(input: string): Promise<ConfirmedMember | null | "error"> {
  const no = parseMembershipNo(input);
  if (!no) return null;
  const rows = await query<Row>(
    "ihern2024",
    `SELECT ${MEMBER_COLUMNS} FROM studentregistration
      WHERE userStatus = 'Y' AND (membershipNo = ? OR ((membershipNo IS NULL OR membershipNo = '') AND ? = 2025 AND studentID = ?))
      LIMIT 1`,
    [no.text, no.year, Number(no.rest)]
  );
  if (rows === null) return "error";
  return rows[0] ? toConfirmed(rows[0], false) : null;
}

export async function memberByEmailAndPhone(email: string, phone: string): Promise<ConfirmedMember | null | "error"> {
  const rows = await query<Row>("ihern2024", `SELECT ${MEMBER_COLUMNS} FROM studentregistration WHERE LOWER(TRIM(studentEmail)) = ? AND userStatus = 'Y'`, [
    email.trim().toLowerCase(),
  ]);
  if (rows === null) return "error";
  const hit = rows.find((r) => samePhone(str(r.studentMobile), phone));
  return hit ? toConfirmed(hit, true) : null;
}

/** Notes that a member was confirmed before paying (one row per member, counted). */
export async function recordCheck(m: ConfirmedMember, method: CheckMethod): Promise<void> {
  await execute(
    "cdnm",
    `INSERT INTO iherc_checks (member_id, membership_no, name, email, method, amount) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE membership_no = VALUES(membership_no), name = VALUES(name),
       email = IF(VALUES(email) = '', email, VALUES(email)), method = VALUES(method), amount = VALUES(amount),
       checks = checks + 1, last_at = NOW()`,
    [m.id, m.number, m.name.slice(0, 190), m.email.slice(0, 190), method, payableFor("member")]
  );
}

export type CheckRow = { id: number; memberId: number; number: string; name: string; email: string; method: CheckMethod; amount: number; checks: number; firstAt: string; lastAt: string };

export async function listChecks(q = ""): Promise<CheckRow[] | null> {
  const params: SqlParam[] = [];
  let where = "";
  if (q.trim()) {
    where = "WHERE name LIKE ? OR email LIKE ? OR membership_no LIKE ?";
    const like = `%${q.trim().replace(/[\\%_]/g, (c) => "\\" + c)}%`;
    params.push(like, like, like);
  }
  const rows = await query<Row>(
    "cdnm",
    `SELECT id, member_id, membership_no, name, email, method, amount, checks,
            DATE_FORMAT(first_at, '%Y-%m-%d %H:%i') AS first_at, DATE_FORMAT(last_at, '%Y-%m-%d %H:%i') AS last_at
       FROM iherc_checks ${where} ORDER BY last_at DESC LIMIT 2000`,
    params
  );
  return rows === null
    ? null
    : rows.map((r) => ({
        id: Number(r.id),
        memberId: Number(r.member_id),
        number: str(r.membership_no),
        name: str(r.name),
        email: str(r.email),
        method: str(r.method) as CheckMethod,
        amount: Number(r.amount),
        checks: Number(r.checks),
        firstAt: str(r.first_at),
        lastAt: str(r.last_at),
      }));
}

/* ---------------- payments: import ---------------- */

export type PaymentField =
  | "ref" | "paidAt" | "name" | "email" | "phone" | "category" | "saysMember" | "membershipNo"
  | "designation" | "affiliation" | "gstNo" | "paperNo" | "dinner" | "amount" | "payStatus";

/**
 * Which column is which, from its heading. The payment form's own questions
 * first (as finance's export is likely to head them), then common names for
 * the payment's details. Matched in order: the first rule that fits a
 * heading wins, and each field takes the first column it fits.
 */
const RULES: [PaymentField, RegExp][] = [
  ["membershipNo", /membership\s*(no|num|number|id)/i],
  ["saysMember", /ihern\s*member/i],
  ["gstNo", /gst\s*(no|num|number|in)|registered\s+under\s+gst|\bgstin\b/i],
  ["paperNo", /paper|poster/i],
  ["dinner", /dinner/i],
  ["amount", /^(total\s*)?(amount|paid\s*amount|amount\s*paid|transaction\s*amount|fee|fees)\b|amount\s*\(|\bamount\b/i],
  ["payStatus", /(payment|transaction|txn)?\s*status/i],
  ["ref", /(transaction|txn|payment|order|reference|receipt|bank)\s*(id|no|num|number|ref)|\butr\b|reference/i],
  ["paidAt", /(date|time|paid\s*on|created|submitted)/i],
  ["email", /e-?mail/i],
  ["phone", /(contact|mobile|phone|whatsapp)/i],
  ["category", /categor/i],
  ["designation", /(title|designation|position)/i],
  ["affiliation", /(affiliation|organi[sz]ation|institution|university|company)/i],
  ["name", /name/i],
];

export function mapColumns(headings: string[]): Partial<Record<PaymentField, number>> {
  const map: Partial<Record<PaymentField, number>> = {};
  headings.forEach((h, i) => {
    const text = h.replace(/\s+/g, " ").trim();
    if (!text) return;
    for (const [field, re] of RULES) {
      if (re.test(text)) {
        if (map[field] === undefined) map[field] = i;
        return;
      }
    }
  });
  return map;
}

export const FIELD_NAMES: Record<PaymentField, string> = {
  ref: "Payment reference", paidAt: "Date", name: "Name", email: "Email", phone: "Contact number", category: "Category",
  saysMember: "IHERN member?", membershipNo: "Membership number", designation: "Title / designation", affiliation: "Affiliation",
  gstNo: "GST number", paperNo: "Paper number", dinner: "Conference dinner", amount: "Amount", payStatus: "Payment status",
};

/** "14,160.00", "Rs 4720", "₹ 1,770" -> 14160 / 4720 / 1770; else null. */
export function parseAmount(v: string): number | null {
  const s = v.replace(/rs\.?|inr|₹|,|\s/gi, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/** Dates as exports write them -> "YYYY-MM-DD HH:MM:SS"; else null. Excel serial numbers too. */
export function parseDate(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  const pad = (n: number | string) => String(n).padStart(2, "0");
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    // Excel: days since 1899-12-30
    const d = new Date(Math.round((Number(s) - 25569) * 86400 * 1000));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;
  }
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(s);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])} ${pad(m[4] ?? 0)}:${pad(m[5] ?? 0)}:${pad(m[6] ?? 0)}`;
  // 27/11/2026, 27-11-2026 14:05 (day first, as in India)
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i.exec(s);
  if (m) {
    let h = Number(m[4] ?? 0);
    if (m[7]) h = (h % 12) + (/pm/i.test(m[7]) ? 12 : 0);
    return `${m[3]}-${pad(m[2])}-${pad(m[1])} ${pad(h)}:${pad(m[5] ?? 0)}:${pad(m[6] ?? 0)}`;
  }
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    const d = new Date(t);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  }
  return null;
}

export type ImportedPayment = Partial<Record<PaymentField, string>> & { raw: Record<string, string> };

/** The rows of finance's list (first row: headings), read into payments. Blank rows are skipped. */
export function readPayments(table: string[][]): { rows: ImportedPayment[]; columns: PaymentField[]; error?: string } {
  const headIndex = table.findIndex((r) => r.filter((c) => c.trim()).length >= 2);
  if (headIndex < 0) return { rows: [], columns: [], error: "The file has no rows." };
  const headings = table[headIndex].map((h) => h.trim());
  const map = mapColumns(headings);
  const columns = Object.keys(map) as PaymentField[];
  if (map.email === undefined && map.name === undefined) return { rows: [], columns, error: "No Name or Email column was found. The first row must hold the column headings." };
  if (map.amount === undefined) return { rows: [], columns, error: "No Amount column was found. The first row must hold the column headings." };
  const rows: ImportedPayment[] = [];
  for (const r of table.slice(headIndex + 1)) {
    if (!r.some((c) => c.trim())) continue;
    const p: ImportedPayment = { raw: {} };
    headings.forEach((h, i) => {
      if (h && r[i]?.trim()) p.raw[h] = r[i].trim();
    });
    for (const f of columns) p[f] = (r[map[f] as number] ?? "").trim();
    rows.push(p);
  }
  return { rows, columns };
}

const LIMITS: Partial<Record<PaymentField, number>> = {
  ref: 120, name: 190, email: 190, phone: 60, category: 120, saysMember: 40, membershipNo: 80, designation: 190, affiliation: 255, gstNo: 60, paperNo: 120, dinner: 40, payStatus: 60,
};
const cut = (p: ImportedPayment, f: PaymentField) => (p[f] ?? "").slice(0, LIMITS[f] ?? 190);

/** The same payment in a later list: its reference, or (none) the row's whole contents. */
function fingerprint(p: ImportedPayment): string {
  const key = p.ref ? `ref:${p.ref.trim().toLowerCase()}` : `row:${JSON.stringify(Object.entries(p.raw).sort())}`;
  return createHash("sha256").update(key).digest("hex");
}

/** Stores the payments; ones already imported are left as they are. */
export async function importPayments(rows: ImportedPayment[], fileName: string, by: string): Promise<{ added: number; known: number; importId: number } | null> {
  const batch = await execute("cdnm", "INSERT INTO iherc_imports (file_name, imported_by) VALUES (?, ?)", [fileName.slice(0, 190), by.slice(0, 190)]);
  if (!batch) return null;
  const importId = batch.insertId;
  let added = 0;
  let known = 0;
  for (const p of rows) {
    const amount = p.amount ? parseAmount(p.amount) : null;
    const res = await execute(
      "cdnm",
      `INSERT IGNORE INTO iherc_payments
         (import_id, ref, fingerprint, paid_at, name, email, phone, category, says_member, membership_no, designation, affiliation, gst_no, paper_no, dinner, amount, pay_status, raw)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        importId, cut(p, "ref") || null, fingerprint(p), p.paidAt ? parseDate(p.paidAt) : null,
        cut(p, "name"), cut(p, "email").toLowerCase(), cut(p, "phone"), cut(p, "category"), cut(p, "saysMember"), cut(p, "membershipNo"),
        cut(p, "designation"), cut(p, "affiliation"), cut(p, "gstNo"), cut(p, "paperNo"), cut(p, "dinner"), amount, cut(p, "payStatus"),
        JSON.stringify(p.raw).slice(0, 60000),
      ]
    );
    if (res === null) return null;
    if (res.affectedRows) added++;
    else known++;
  }
  await execute("cdnm", "UPDATE iherc_imports SET rows_added = ?, rows_known = ? WHERE id = ?", [added, known, importId]);
  return { added, known, importId };
}

export type ImportBatch = { id: number; fileName: string; added: number; known: number; by: string; at: string; remaining: number };

export async function listImports(): Promise<ImportBatch[] | null> {
  const rows = await query<Row>(
    "cdnm",
    `SELECT i.id, i.file_name, i.rows_added, i.rows_known, i.imported_by, DATE_FORMAT(i.imported_at, '%Y-%m-%d %H:%i') AS imported_at,
            (SELECT COUNT(*) FROM iherc_payments p WHERE p.import_id = i.id) AS remaining
       FROM iherc_imports i ORDER BY i.id DESC`
  );
  return rows === null
    ? null
    : rows.map((r) => ({ id: Number(r.id), fileName: str(r.file_name), added: Number(r.rows_added), known: Number(r.rows_known), by: str(r.imported_by), at: str(r.imported_at), remaining: Number(r.remaining) }));
}

/** Undoes an import: removes the payments it added. */
export async function deleteImport(id: number): Promise<number | null> {
  const res = await execute("cdnm", "DELETE FROM iherc_payments WHERE import_id = ?", [id]);
  if (res === null) return null;
  await execute("cdnm", "DELETE FROM iherc_imports WHERE id = ?", [id]);
  return res.affectedRows;
}

/* ---------------- payments: the check ---------------- */

export type Payment = {
  id: number;
  ref: string;
  paidAt: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  saysMember: string;
  membershipNo: string;
  designation: string;
  affiliation: string;
  amount: number | null;
  payStatus: string;
  resolved: boolean;
  note: string;
  balanceAskedAt: string;
  raw: Record<string, string>;
};

const toPayment = (r: Row): Payment => {
  let raw: Record<string, string> = {};
  try {
    raw = JSON.parse(str(r.raw) || "{}");
  } catch {
    raw = {};
  }
  return {
    id: Number(r.id),
    ref: str(r.ref),
    paidAt: str(r.paid_at),
    name: str(r.name),
    email: str(r.email),
    phone: str(r.phone),
    category: str(r.category),
    saysMember: str(r.says_member),
    membershipNo: str(r.membership_no),
    designation: str(r.designation),
    affiliation: str(r.affiliation),
    amount: r.amount == null ? null : Number(r.amount),
    payStatus: str(r.pay_status),
    resolved: Number(r.resolved) === 1,
    note: str(r.note),
    balanceAskedAt: str(r.balance_asked_at),
    raw,
  };
};

const PAYMENT_COLUMNS = `id, ref, DATE_FORMAT(paid_at, '%Y-%m-%d %H:%i') AS paid_at, name, email, phone, category, says_member, membership_no,
  designation, affiliation, amount, pay_status, resolved, note, DATE_FORMAT(balance_asked_at, '%Y-%m-%d %H:%i') AS balance_asked_at, raw`;

export async function listPayments(): Promise<Payment[] | null> {
  const rows = await query<Row>("cdnm", `SELECT ${PAYMENT_COLUMNS} FROM iherc_payments ORDER BY COALESCE(paid_at, '9999-12-31') DESC, id DESC`);
  return rows === null ? null : rows.map(toPayment);
}

export async function getPayment(id: number): Promise<Payment | null | "error"> {
  const rows = await query<Row>("cdnm", `SELECT ${PAYMENT_COLUMNS} FROM iherc_payments WHERE id = ?`, [id]);
  if (rows === null) return "error";
  return rows[0] ? toPayment(rows[0]) : null;
}

export async function setResolved(id: number, resolved: boolean, note: string, by: string): Promise<boolean> {
  const res = await execute("cdnm", "UPDATE iherc_payments SET resolved = ?, note = ?, updated_by = ? WHERE id = ?", [resolved ? 1 : 0, note.slice(0, 500), by.slice(0, 190), id]);
  return res !== null && res.affectedRows > 0;
}

export async function markBalanceAsked(ids: number[]): Promise<void> {
  if (!ids.length) return;
  await execute("cdnm", `UPDATE iherc_payments SET balance_asked_at = NOW() WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
}

/** Every active member, for checking a whole list of payments at once. */
export type MemberIndex = { byEmail: Map<string, ConfirmedMember>; byNumber: Map<string, ConfirmedMember> };

export async function memberIndex(): Promise<MemberIndex | null> {
  const rows = await query<Row>("ihern2024", `SELECT ${MEMBER_COLUMNS} FROM studentregistration WHERE userStatus = 'Y' ORDER BY studentID`);
  if (rows === null) return null;
  const byEmail = new Map<string, ConfirmedMember>();
  const byNumber = new Map<string, ConfirmedMember>();
  for (const r of rows) {
    const m = toConfirmed(r, true);
    const e = m.email.toLowerCase();
    if (e && !byEmail.has(e)) byEmail.set(e, m);
    byNumber.set(m.number.toUpperCase(), m);
    // Members with a new number may still quote the old form: IHERN/2025-<id>.
    byNumber.set(`IHERN/2025-${m.id}`, byNumber.get(`IHERN/2025-${m.id}`) ?? m);
  }
  return { byEmail, byNumber };
}

/** The outcome of checking one payment. */
export type Verdict = {
  /** ok: nothing to do. due: pays too little. check: someone should look. failed: the payment did not go through. */
  state: "ok" | "due" | "check" | "failed";
  /** What they are, as far as the member list and their answers say. */
  category: FeeCategory;
  member: ConfirmedMember | null;
  /** What they should have paid (GST included), and what is left. */
  expected: number;
  balance: number;
  /** One line each, for the admin. The first is the reason, when there is one. */
  notes: string[];
};

const FAILED = /fail|declin|cancel|abort|pending|refund|unpaid|error|incomplete/i;
const yes = (s: string) => /^\s*(y|yes|true|1)\b/i.test(s);

export function checkPayment(p: Payment, members: MemberIndex): Verdict {
  const notes: string[] = [];
  const number = parseMembershipNo(p.membershipNo)?.text.toUpperCase() ?? "";
  const byNumber = number ? members.byNumber.get(number) ?? null : null;
  const byEmail = p.email ? members.byEmail.get(p.email.toLowerCase()) ?? null : null;
  const member = byNumber ?? byEmail;
  const student = /student/i.test(p.category);
  const category: FeeCategory = student ? "student" : member ? "member" : "standard";
  const expected = payableFor(category);
  const paid = p.amount ?? 0;
  const balance = Math.max(0, Math.round(expected - paid));

  if (p.payStatus && FAILED.test(p.payStatus)) {
    return { state: "failed", category, member, expected, balance: expected, notes: [`The payment did not go through (${p.payStatus}).`] };
  }

  let state: Verdict["state"] = "ok";
  if (p.amount === null) {
    state = "check";
    notes.push("No amount in the list.");
  } else if (balance > 1) {
    state = "due";
    if (!member && paid >= payableFor("member") - 1) {
      notes.push(
        p.membershipNo || yes(p.saysMember)
          ? `Paid the IHERN member rate, but ${p.membershipNo ? `membership number “${p.membershipNo}”` : "this email address"} is not an active IHERN member.`
          : "Paid the IHERN member rate, but is not an IHERN member."
      );
    } else {
      notes.push(`Paid ${rupees(paid)}; the fee for ${category === "member" ? "an IHERN member" : category === "student" ? "a student" : "a non-member"} is ${rupees(expected)}.`);
    }
  } else if (paid - expected > 1) {
    notes.push(`Paid ${rupees(paid - expected)} more than the fee.`);
  }

  if (byNumber && byEmail && byNumber.id !== byEmail.id) {
    notes.push(`Membership number ${byNumber.number} belongs to ${byNumber.name} (${byNumber.email}), not to this email address.`);
    if (state === "ok") state = "check";
  } else if (byNumber && !byEmail && p.email) {
    notes.push(`Membership number ${byNumber.number} belongs to ${byNumber.name} (${byNumber.email}): paid from a different email address.`);
    if (state === "ok") state = "check";
  } else if (!byNumber && byEmail && p.membershipNo && !/^n\/?a$|^none$|^-$/i.test(p.membershipNo.trim())) {
    notes.push(`“${p.membershipNo}” is not a membership number; the email address is a member (${byEmail.number}).`);
  }
  if (student) notes.push("Student rate: check their student ID at the venue.");
  return { state, category, member, expected, balance, notes };
}

/* ---------------- who may use the IHERC admin ---------------- */

export type IhercEditor = { id: number; email: string; role: "admin" | "editor"; active: boolean; createdAt: string };
const toEditor = (r: Row): IhercEditor => ({ id: Number(r.id), email: str(r.email), role: r.role === "admin" ? "admin" : "editor", active: Number(r.active) === 1, createdAt: str(r.created_at) });

/** The active editor with this email (a deactivated one reads as none). */
export async function getIhercEditor(email: string): Promise<IhercEditor | null | "error"> {
  const rows = await query<Row>("cdnm", "SELECT id, email, role, active, created_at FROM iherc_editors WHERE LOWER(email) = ? AND active = 1 LIMIT 1", [email.toLowerCase()]);
  if (rows === null) return "error";
  return rows[0] ? toEditor(rows[0]) : null;
}

export async function listIhercEditors(): Promise<IhercEditor[] | null> {
  const rows = await query<Row>("cdnm", "SELECT id, email, role, active, created_at FROM iherc_editors ORDER BY active DESC, role, email");
  return rows === null ? null : rows.map(toEditor);
}

export async function addIhercEditor(email: string, role: "admin" | "editor"): Promise<"added" | "updated" | null> {
  const res = await execute("cdnm", "INSERT INTO iherc_editors (email, role) VALUES (?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role), active = 1", [email.toLowerCase(), role]);
  return res === null ? null : res.affectedRows === 1 ? "added" : "updated";
}

export async function setIhercEditorActive(id: number, active: boolean): Promise<boolean> {
  const res = await execute("cdnm", "UPDATE iherc_editors SET active = ? WHERE id = ?", [active ? 1 : 0, id]);
  return res !== null && res.affectedRows > 0;
}

export async function removeIhercEditor(id: number): Promise<boolean> {
  const res = await execute("cdnm", "DELETE FROM iherc_editors WHERE id = ?", [id]);
  return res !== null && res.affectedRows > 0;
}
