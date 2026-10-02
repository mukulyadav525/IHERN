import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes } from "crypto";
import { query, execute } from "@ihern/core/db";
import { readSigned, secret, signValue, SECURE_COOKIES } from "./auth";
import { BASE_PATH } from "./paths";
import { removePhoto } from "./membership";
import { allowed, clear, hit, ADMIN_SIGN_IN_FAILURES } from "@ihern/core/ratelimit";

/**
 * The membership admin panel (applications/admin on the PHP site): the staff
 * back office for `ihern2024.studentregistration`.
 *
 * Staff sign in with their existing `adminlogin` accounts - the same email,
 * the same password (unsalted SHA-256, the format that table has always used,
 * so the PHP panel keeps working if both run side by side) and the same
 * active flag.
 *
 * The PHP panel recorded admin sign-ins in `authsession` under the admin's id,
 * the table member sign-ins use - so admin 1 signing in signed member 1 out.
 * This panel keeps its session in a signed cookie instead. The cookie carries
 * a fingerprint of the admin's password hash and status: changing the
 * password or deactivating the account ends every session at once.
 */

export type Admin = { id: number; name: string; email: string; mobile: string; active: boolean; added: string };

type AdminRow = { adID: number; adName: string; adEmail: string; adMobile: string; adPassword: string; adDate: string; userStatus: string | null };
type AdminSession = { id: number; fp: string; exp: number };

export const ADMIN_COOKIE = "ihern_admin";
/** A sign-in lasts a working day. */
const SESSION_SECONDS = 60 * 60 * 10;
/** The panel's own path: the cookie is sent nowhere else. */
export const ADMIN_PATH = `${BASE_PATH}/membership/admin`;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const fingerprint = (row: Pick<AdminRow, "adPassword" | "userStatus">) =>
  createHmac("sha256", secret()).update(`${row.adPassword}|${row.userStatus}`).digest("base64url").slice(0, 22);

const toAdmin = (r: AdminRow): Admin => ({
  id: Number(r.adID),
  name: String(r.adName ?? ""),
  email: String(r.adEmail ?? ""),
  mobile: String(r.adMobile ?? ""),
  active: r.userStatus === "Y",
  added: String(r.adDate ?? ""),
});

/* ---------------- sign-in ---------------- */

/** ADMIN::adminLogin(). The password is checked before the status, as for members. */
export async function adminLogin(email: string, password: string): Promise<"ok" | "error" | "inactive" | "throttled" | "unavailable"> {
  // After 5 wrong passwords for an address, it waits 15 minutes.
  if (!allowed(ADMIN_SIGN_IN_FAILURES, email)) return "throttled";
  const rows = await query<AdminRow>("ihern2024", "SELECT * FROM adminlogin WHERE adEmail = ?", [email]);
  if (rows === null) return "unavailable";
  if (rows.length !== 1 || rows[0].adPassword !== sha256(password)) {
    hit(ADMIN_SIGN_IN_FAILURES, email);
    return "error";
  }
  if (rows[0].userStatus !== "Y") return "inactive";
  clear(ADMIN_SIGN_IN_FAILURES, email);
  await startAdminSession(rows[0]);
  return "ok";
}

async function startAdminSession(row: AdminRow): Promise<void> {
  const value = signValue({ id: Number(row.adID), fp: fingerprint(row), exp: Date.now() + SESSION_SECONDS * 1000 } satisfies AdminSession);
  (await cookies()).set(ADMIN_COOKIE, value, { httpOnly: true, sameSite: "lax", path: ADMIN_PATH, maxAge: SESSION_SECONDS, secure: SECURE_COOKIES });
}

export async function adminLogout(): Promise<void> {
  (await cookies()).set(ADMIN_COOKIE, "", { path: ADMIN_PATH, maxAge: 0 });
}

/** The signed-in admin; null when signed out (or the account changed since). */
export const currentAdmin = cache(async (): Promise<Admin | null | "unavailable"> => {
  const s = readSigned<AdminSession>((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!s || typeof s.id !== "number" || typeof s.fp !== "string" || typeof s.exp !== "number" || Date.now() > s.exp) return null;
  const rows = await query<AdminRow>("ihern2024", "SELECT * FROM adminlogin WHERE adID = ?", [s.id]);
  if (rows === null) return "unavailable";
  const row = rows[0];
  if (!row || row.userStatus !== "Y" || fingerprint(row) !== s.fp) return null;
  return toAdmin(row);
});

export class NotSignedIn extends Error {}

/** For server actions and downloads: the admin, or throws. */
export async function requireAdmin(): Promise<Admin> {
  const who = await currentAdmin();
  if (!who || who === "unavailable") throw new NotSignedIn("Your admin session has ended. Please sign in again.");
  return who;
}

/* ---------------- admins ---------------- */

export async function listAdmins(): Promise<Admin[] | null> {
  const rows = await query<AdminRow>("ihern2024", "SELECT * FROM adminlogin ORDER BY adID");
  return rows === null ? null : rows.map(toAdmin);
}

/** adAdminUser.php. "exists" when the address already has an admin account. */
export async function addAdmin(name: string, email: string, mobile: string, password: string): Promise<"ok" | "exists" | "error"> {
  const rows = await query("ihern2024", "SELECT adID FROM adminlogin WHERE adEmail = ?", [email]);
  if (rows === null) return "error";
  if (rows.length) return "exists";
  const res = await execute(
    "ihern2024",
    "INSERT INTO adminlogin (adName, adEmail, adMobile, adPassword, tokenCode, userStatus) VALUES (?, ?, ?, ?, ?, 'Y')",
    [name, email, mobile, sha256(password), randomBytes(16).toString("hex")]
  );
  return res === null ? "error" : "ok";
}

export async function setAdminActive(id: number, active: boolean): Promise<boolean> {
  const res = await execute("ihern2024", "UPDATE adminlogin SET userStatus = ? WHERE adID = ?", [active ? "Y" : "N", id]);
  return res !== null && res.affectedRows > 0;
}

/** changePassword.php. Keeps the current browser signed in; every other session ends. */
export async function changeAdminPassword(id: number, current: string, next: string): Promise<"ok" | "wrong" | "error"> {
  const rows = await query<AdminRow>("ihern2024", "SELECT * FROM adminlogin WHERE adID = ?", [id]);
  if (rows === null || !rows[0]) return "error";
  if (rows[0].adPassword !== sha256(current)) return "wrong";
  const res = await execute("ihern2024", "UPDATE adminlogin SET adPassword = ? WHERE adID = ?", [sha256(next), id]);
  if (res === null) return "error";
  await startAdminSession({ ...rows[0], adPassword: sha256(next) });
  return "ok";
}

/* ---------------- members ---------------- */

export type MemberRecord = {
  studentID: number;
  studentName: string;
  studentEmail: string;
  studentMobile: string;
  yourTitle: string;
  institutionName: string;
  areasofinterest: string;
  areasofinteresthe: string;
  url: string;
  photo: string;
  regDate: string;
  userStatus: "Y" | "N";
};

const MEMBER_COLUMNS = `studentID, studentName, studentEmail, studentMobile, yourTitle, institutionName, areasofinterest,
  areasofinteresthe, url, photo, regDate, userStatus`;

function toMember(r: Record<string, unknown>): MemberRecord {
  const s = (k: string) => (r[k] == null ? "" : String(r[k]));
  return {
    studentID: Number(r.studentID),
    studentName: s("studentName"),
    studentEmail: s("studentEmail"),
    studentMobile: s("studentMobile"),
    yourTitle: s("yourTitle"),
    institutionName: s("institutionName"),
    areasofinterest: s("areasofinterest"),
    areasofinteresthe: s("areasofinteresthe"),
    url: s("url"),
    photo: s("photo"),
    regDate: s("regDate"),
    userStatus: r.userStatus === "Y" ? "Y" : "N",
  };
}

export type MemberCounts = { total: number; active: number; inactive: number; withPhoto: number; last30: number };

export async function memberCounts(): Promise<MemberCounts | null> {
  const rows = await query<Record<string, unknown>>(
    "ihern2024",
    `SELECT COUNT(*) AS total,
            SUM(userStatus = 'Y') AS active,
            SUM(photo IS NOT NULL AND photo <> '') AS withPhoto,
            SUM(regDate >= NOW() - INTERVAL 30 DAY) AS last30
       FROM studentregistration`
  );
  if (rows === null) return null;
  const r = rows[0] ?? {};
  const n = (k: string) => Number(r[k] ?? 0);
  return { total: n("total"), active: n("active"), inactive: n("total") - n("active"), withPhoto: n("withPhoto"), last30: n("last30") };
}

export type MemberFilter = { q?: string; status?: "Y" | "N" | ""; page?: number };
export const PAGE_SIZE = 50;

/** The registered-members list (adminDashboard.php), newest first, searchable. */
export async function findMembers(f: MemberFilter): Promise<{ rows: MemberRecord[]; total: number } | null> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  const q = (f.q ?? "").trim();
  if (q) {
    // "IHERN/2025-12" or "12" finds member 12, as well as text matches.
    const num = q.match(/^(?:IHERN\/\d{4}-)?(\d+)$/i);
    const like = `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
    where.push(
      `(${num ? "studentID = ? OR " : ""}studentName LIKE ? OR studentEmail LIKE ? OR studentMobile LIKE ? OR institutionName LIKE ?
        OR yourTitle LIKE ? OR areasofinterest LIKE ? OR areasofinteresthe LIKE ?)`
    );
    if (num) params.push(Number(num[1]));
    params.push(like, like, like, like, like, like, like);
  }
  if (f.status === "Y") where.push("userStatus = 'Y'");
  if (f.status === "N") where.push("(userStatus = 'N' OR userStatus IS NULL)");
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const page = Math.max(1, Math.floor(f.page ?? 1));

  const count = await query<{ n: number }>("ihern2024", `SELECT COUNT(*) AS n FROM studentregistration ${clause}`, params);
  if (count === null) return null;
  const rows = await query<Record<string, unknown>>(
    "ihern2024",
    `SELECT ${MEMBER_COLUMNS} FROM studentregistration ${clause} ORDER BY studentID DESC LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    params
  );
  if (rows === null) return null;
  return { rows: rows.map(toMember), total: Number(count[0]?.n ?? 0) };
}

export async function getMember(id: number): Promise<MemberRecord | null | "error"> {
  const rows = await query<Record<string, unknown>>("ihern2024", `SELECT ${MEMBER_COLUMNS} FROM studentregistration WHERE studentID = ?`, [id]);
  if (rows === null) return "error";
  return rows[0] ? toMember(rows[0]) : null;
}

/** Active members in membership-number order: exportStudentDetails.php. */
export async function exportMembers(includeInactive: boolean): Promise<MemberRecord[] | null> {
  const rows = await query<Record<string, unknown>>(
    "ihern2024",
    `SELECT ${MEMBER_COLUMNS} FROM studentregistration ${includeInactive ? "" : "WHERE userStatus = 'Y'"} ORDER BY studentID`
  );
  return rows === null ? null : rows.map(toMember);
}

export async function setMemberStatus(id: number, active: boolean): Promise<boolean> {
  const res = await execute("ihern2024", "UPDATE studentregistration SET userStatus = ? WHERE studentID = ?", [active ? "Y" : "N", id]);
  if (res === null || res.affectedRows === 0) return false;
  // A deactivated member is signed out of the membership pages.
  if (!active) await execute("ihern2024", "DELETE FROM authsession WHERE studentID = ?", [id]);
  return true;
}

export type MemberEdit = Pick<
  MemberRecord,
  "studentName" | "studentEmail" | "studentMobile" | "yourTitle" | "institutionName" | "areasofinterest" | "areasofinteresthe" | "url" | "userStatus"
>;

/** "taken" when another registration already uses the email address. */
export async function updateMember(id: number, m: MemberEdit): Promise<"ok" | "taken" | "missing" | "error"> {
  const dup = await query("ihern2024", "SELECT studentID FROM studentregistration WHERE studentEmail = ? AND studentID <> ? LIMIT 1", [m.studentEmail, id]);
  if (dup === null) return "error";
  if (dup.length) return "taken";
  const res = await execute(
    "ihern2024",
    `UPDATE studentregistration SET studentName = ?, studentEmail = ?, studentMobile = ?, yourTitle = ?, institutionName = ?,
       areasofinterest = ?, areasofinteresthe = ?, url = ?, userStatus = ? WHERE studentID = ?`,
    [m.studentName, m.studentEmail, m.studentMobile, m.yourTitle, m.institutionName, m.areasofinterest, m.areasofinteresthe, m.url, m.userStatus, id]
  );
  if (res === null) return "error";
  if (res.affectedRows === 0) return "missing";
  if (m.userStatus !== "Y") await execute("ihern2024", "DELETE FROM authsession WHERE studentID = ?", [id]);
  return "ok";
}

/** Replaces (or, with null, removes) the member's photograph. */
export async function setMemberPhoto(id: number, photo: string | null): Promise<boolean> {
  const current = await getMember(id);
  if (!current || current === "error") return false;
  const res = await execute("ihern2024", "UPDATE studentregistration SET photo = ? WHERE studentID = ?", [photo, id]);
  if (res === null) return false;
  if (current.photo && current.photo !== photo) await removePhoto(current.photo);
  return true;
}

/** Removes the registration, its sign-in record and its photograph. */
export async function deleteMember(id: number): Promise<boolean> {
  const current = await getMember(id);
  if (!current || current === "error") return false;
  const res = await execute("ihern2024", "DELETE FROM studentregistration WHERE studentID = ?", [id]);
  if (res === null || res.affectedRows === 0) return false;
  await execute("ihern2024", "DELETE FROM authsession WHERE studentID = ?", [id]);
  if (current.photo) await removePhoto(current.photo);
  return true;
}
