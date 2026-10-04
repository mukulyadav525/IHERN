import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { query, execute, isConfigured } from "@ihern/core/db";
import { readSigned, signValue, SECURE_COOKIES } from "./auth";
import { formatMembershipNo, TITLES } from "./membership-options";

/**
 * The IHERN membership system - `ihern2024.studentregistration`, the table the
 * membership form has always written and the Members page and the admin panel
 * read. A port of applications/class.user.php and the pages around it.
 *
 * Membership passwords stay in that system's existing format (unsalted
 * SHA-256), so accounts keep working in the existing admin panel and in the
 * PHP site if both run side by side.
 */

export type Member = {
  studentID: number;
  studentName: string;
  studentEmail: string;
  studentMobile: string;
  institutionName: string;
  yourTitle: string;
  areasofinterest: string;
  areasofinteresthe: string;
  url: string;
  regDate: string;
  userStatus: string;
  membershipNo: string | null;
  photo: string | null;
};

export { TITLES, POSITIONS, membershipNumber } from "./membership-options";
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function membershipAvailable(): boolean {
  return isConfigured("ihern2024");
}

/** Where membership photographs are stored (applications/uploadDoc on the PHP site). */
export function uploadDir(): string {
  return process.env.IHERN_UPLOAD_DIR || path.join(process.cwd(), "uploads", "uploadDoc");
}

/* ---------------- registration ---------------- */

/** null when the database is unavailable. */
export async function emailRegistered(email: string): Promise<boolean | null> {
  const rows = await query("ihern2024", "SELECT studentID FROM studentregistration WHERE studentEmail = ? LIMIT 1", [email]);
  return rows === null ? null : rows.length > 0;
}

/** Detects JPEG/PNG from the file's own bytes, as getimagesize() does. */
export function imageType(bytes: Uint8Array): "jpg" | "png" | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "png";
  return null;
}

/** Stores the photograph under a generated name; returns the file name, or null. */
export async function storePhoto(bytes: Uint8Array, ext: "jpg" | "png", mobile: string): Promise<string | null> {
  const name = `${mobile.replace(/\D/g, "")}-${randomBytes(6).toString("hex")}.${ext}`;
  try {
    await mkdir(uploadDir(), { recursive: true });
    await writeFile(path.join(uploadDir(), name), bytes);
    return name;
  } catch (e) {
    console.error("[register] could not store the photograph:", (e as Error).message);
    return null;
  }
}

export async function removePhoto(name: string): Promise<void> {
  try {
    await unlink(path.join(uploadDir(), path.basename(name)));
  } catch {
    /* already gone */
  }
}

export type Registration = {
  studentName: string;
  studentEmail: string;
  studentMobile: string;
  institutionName: string;
  areasofinterest: string;
  areasofinteresthe: string;
  yourTitle: string;
  url: string;
  password: string;
  photo: string | null;
};

/**
 * USER::register(). A new member is active straight away (the PHP form left
 * them inactive until an admin switched them on). Returns the new member's
 * id and membership number, or null on failure.
 */
export async function registerMember(r: Registration): Promise<{ id: number; number: string } | null> {
  const res = await execute(
    "ihern2024",
    `INSERT INTO studentregistration (studentName, studentEmail, studentMobile, institutionName, areasofinterest,
       areasofinteresthe, yourTitle, url, studentPassword, photo, tokenCode, userStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Y')`,
    [r.studentName, r.studentEmail, r.studentMobile, r.institutionName, r.areasofinterest, r.areasofinteresthe,
      r.yourTitle, r.url, sha256(r.password), r.photo, randomBytes(16).toString("hex")]
  );
  if (res === null) return null;
  const id = Number(res.insertId);
  return { id, number: (await assignMembershipNumber(id)) ?? `IHERN/2025-${id}` };
}

/**
 * Gives a new registration its membership number, IHERN/<year>-<month><n>,
 * from its registration date: n counts everyone who registered that year up
 * to and including this member. A number already taken (after a deletion),
 * or one that reads like an earlier member's IHERN/2025-<id>, is skipped.
 * Returns the number, or null if it could not be saved.
 */
export async function assignMembershipNumber(id: number): Promise<string | null> {
  const rows = await query<{ y: string; m: string; membershipNo: string | null }>(
    "ihern2024",
    "SELECT DATE_FORMAT(regDate, '%Y') AS y, DATE_FORMAT(regDate, '%c') AS m, membershipNo FROM studentregistration WHERE studentID = ?",
    [id]
  );
  const row = rows?.[0];
  if (!row) return null;
  if (row.membershipNo) return row.membershipNo;
  const year = Number(row.y);
  const month = Number(row.m);
  const count = await query<{ n: number }>(
    "ihern2024",
    "SELECT COUNT(*) AS n FROM studentregistration WHERE regDate >= ? AND regDate < ? AND studentID <= ?",
    [`${year}-01-01`, `${year + 1}-01-01`, id]
  );
  if (!count) return null;
  for (let n = Math.max(1, Number(count[0]?.n ?? 1)), tries = 0; tries < 100; n++, tries++) {
    const number = formatMembershipNo(year, month, n);
    const legacy = number.match(/^IHERN\/2025-(\d+)$/);
    if (legacy) {
      const clash = await query("ihern2024", "SELECT 1 FROM studentregistration WHERE studentID = ? AND membershipNo IS NULL LIMIT 1", [Number(legacy[1])]);
      if (clash === null) return null;
      if (clash.length) continue;
    }
    const taken = await query("ihern2024", "SELECT 1 FROM studentregistration WHERE membershipNo = ? LIMIT 1", [number]);
    if (taken === null) return null;
    if (taken.length) continue;
    const res = await execute("ihern2024", "UPDATE studentregistration SET membershipNo = ? WHERE studentID = ? AND membershipNo IS NULL", [number, id]);
    // null: someone took it in the meantime (the unique key refused it); try the next.
    if (res && res.affectedRows) return number;
  }
  return null;
}

/** The details a member can change themselves (not the email address, which is their sign-in, nor the status). */
export type OwnDetails = Pick<Member, "studentName" | "studentMobile" | "institutionName" | "areasofinterest" | "areasofinteresthe" | "yourTitle" | "url">;

/** Saves a member's own changes, and their name on their IHERN account too. */
export async function updateOwnDetails(id: number, d: OwnDetails): Promise<boolean> {
  const res = await execute(
    "ihern2024",
    `UPDATE studentregistration SET studentName = ?, studentMobile = ?, institutionName = ?, areasofinterest = ?, areasofinteresthe = ?,
       yourTitle = ?, url = ? WHERE studentID = ?`,
    [d.studentName, d.studentMobile, d.institutionName, d.areasofinterest, d.areasofinteresthe, d.yourTitle, d.url, id]
  );
  if (res === null || res.affectedRows === 0) return false;
  const rows = await query<{ studentEmail: string }>("ihern2024", "SELECT studentEmail FROM studentregistration WHERE studentID = ?", [id]);
  const email = rows?.[0]?.studentEmail;
  if (email && isConfigured("cdnm")) await execute("cdnm", "UPDATE blog_subscribers SET name = ? WHERE LOWER(email) = ?", [d.studentName, String(email).trim().toLowerCase()]);
  return true;
}

/** "Dr. Asha Rao" -> ["Dr.", "Asha Rao"]; a name without a known title -> ["", name]. */
export function splitTitle(name: string): [string, string] {
  const m = /^(mr|dr|prof|mrs|ms)\.?\s+(.*)$/i.exec(name.trim());
  if (!m) return ["", name.trim()];
  const title = TITLES.find((t) => t.toLowerCase() === `${m[1].toLowerCase()}.`) ?? "";
  return [title, m[2].trim()];
}

/* ---------------- member sign-in ---------------- */

export const MEMBER_COOKIE = "ihern_member";
/** A member sign-in lasts 50 minutes (page-top.php's 3000-second timeout). */
export const MEMBER_IDLE_SECONDS = 3000;

type MemberSession = { id: number; email: string; token: string; exp: number };

/**
 * USER::login(). The password is checked before the account status, so a
 * wrong password never reveals whether (or how) an address is registered.
 */
export async function memberLogin(email: string, password: string): Promise<"ok" | "error" | "inactive" | "unavailable"> {
  const rows = await query<{ studentID: number; studentEmail: string; studentPassword: string; userStatus: string }>(
    "ihern2024",
    "SELECT studentID, studentEmail, studentPassword, userStatus FROM studentregistration WHERE studentEmail = ?",
    [email]
  );
  if (rows === null) return "unavailable";
  if (rows.length !== 1 || rows[0].studentPassword !== sha256(password)) return "error";
  if (rows[0].userStatus !== "Y") return "inactive";

  // Record the sign-in in authsession, as the membership system always has.
  const studentID = Number(rows[0].studentID);
  const token = randomBytes(16).toString("hex");
  const existing = await query("ihern2024", "SELECT studentID FROM authsession WHERE studentID = ?", [studentID]);
  const saved = existing && existing.length
    ? await execute("ihern2024", "UPDATE authsession SET authtokenid = ?, loginFlg = 'Y' WHERE studentID = ?", [token, studentID])
    : await execute("ihern2024", "INSERT INTO authsession (studentID, authtokenid, loginFlg) VALUES (?, ?, 'Y')", [studentID, token]);
  if (saved === null) return "unavailable";

  await setMemberCookie({ id: studentID, email: rows[0].studentEmail, token, exp: 0 });
  return "ok";
}

async function setMemberCookie(s: MemberSession): Promise<void> {
  (await cookies()).set(MEMBER_COOKIE, signValue({ ...s, exp: Date.now() + MEMBER_IDLE_SECONDS * 1000 }), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: MEMBER_IDLE_SECONDS, secure: SECURE_COOKIES,
  });
}

export async function readMemberSession(): Promise<MemberSession | null> {
  const s = readSigned<MemberSession>((await cookies()).get(MEMBER_COOKIE)?.value);
  if (!s || typeof s.id !== "number" || !s.token || Date.now() > s.exp) return null;
  return s;
}

/** The signed-in member's record, checked against authsession like page-top.php. */
export async function currentMember(): Promise<Member | null | "unavailable"> {
  const s = await readMemberSession();
  if (!s) return null;
  const rows = await query<Member>(
    "ihern2024",
    `SELECT st.studentID, st.studentName, st.studentEmail, st.studentMobile, st.institutionName, st.yourTitle,
            st.areasofinterest, st.areasofinteresthe, st.url, st.regDate, st.userStatus, st.membershipNo, st.photo
       FROM studentregistration st JOIN authsession ads ON ads.studentID = st.studentID
      WHERE st.studentEmail = ? AND ads.authtokenid = ? LIMIT 1`,
    [s.email, s.token]
  );
  if (rows === null) return "unavailable";
  return rows[0] ?? null;
}

/** logout.php: drop the authsession row and the cookie. */
export async function memberLogout(): Promise<void> {
  const s = await readMemberSession();
  if (s) await execute("ihern2024", "DELETE FROM authsession WHERE studentID = ?", [s.id]);
  (await cookies()).set(MEMBER_COOKIE, "", { path: "/", maxAge: 0 });
}

/* ---------------- password reset ---------------- */

/**
 * forgotPassword.php: a fresh random token on the record. Returns the reset
 * link's id/code pair, or null when the address is not registered ("error"
 * on a database failure). The caller answers the same either way.
 */
export async function createResetToken(email: string): Promise<{ id: string; code: string } | null | "error"> {
  const rows = await query<{ studentID: number }>("ihern2024", "SELECT studentID FROM studentregistration WHERE studentEmail = ? LIMIT 1", [email]);
  if (rows === null) return "error";
  if (!rows.length) return null;
  const code = randomBytes(16).toString("hex");
  const res = await execute("ihern2024", "UPDATE studentregistration SET tokenCode = ? WHERE studentID = ?", [code, rows[0].studentID]);
  if (res === null) return "error";
  return { id: Buffer.from(String(rows[0].studentID)).toString("base64"), code };
}

function decodeId(id: string): string | null {
  try {
    const v = Buffer.from(id, "base64").toString("utf8");
    return /^\d+$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

/** resetpass.php: is this id/code pair a live reset link? */
export async function resetLinkValid(id: string, code: string): Promise<boolean | "error"> {
  const uid = decodeId(id);
  if (!uid || !code) return false;
  const rows = await query("ihern2024", "SELECT studentID FROM studentregistration WHERE studentID = ? AND tokenCode = ?", [uid, code]);
  if (rows === null) return "error";
  return rows.length > 0;
}

/** Sets the new password and uses the link up by replacing its token. */
export async function resetPassword(id: string, code: string, password: string): Promise<boolean> {
  const uid = decodeId(id);
  if (!uid || !code) return false;
  const res = await execute(
    "ihern2024",
    "UPDATE studentregistration SET studentPassword = ?, tokenCode = ? WHERE studentID = ? AND tokenCode = ?",
    [sha256(password), randomBytes(16).toString("hex"), uid, code]
  );
  return res !== null && res.affectedRows > 0;
}

/* ---------------- the public directory ---------------- */

export type DirectoryEntry = { name: string; designation: string; affiliation: string; area: string };

/** members.php: every registration, ordered by name; null when unavailable. */
export async function memberDirectory(): Promise<DirectoryEntry[] | null> {
  const rows = await query<{ studentName: string | null; yourTitle: string | null; institutionName: string | null; areasofinteresthe: string | null }>(
    "ihern2024",
    "SELECT studentName, yourTitle, institutionName, areasofinteresthe FROM studentregistration ORDER BY studentName"
  );
  if (rows === null) return null;
  return rows.map((r) => ({
    name: String(r.studentName ?? ""),
    designation: String(r.yourTitle ?? ""),
    affiliation: String(r.institutionName ?? ""),
    area: String(r.areasofinteresthe ?? ""),
  }));
}
