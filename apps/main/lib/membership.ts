import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { query, execute, isConfigured } from "@ihern/core/db";
import { readSigned, signValue, SECURE_COOKIES } from "./auth";

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

/** USER::register(). Returns the new member id, or null on failure. */
export async function registerMember(r: Registration): Promise<number | null> {
  const res = await execute(
    "ihern2024",
    `INSERT INTO studentregistration (studentName, studentEmail, studentMobile, institutionName, areasofinterest,
       areasofinteresthe, yourTitle, url, studentPassword, photo, tokenCode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [r.studentName, r.studentEmail, r.studentMobile, r.institutionName, r.areasofinterest, r.areasofinteresthe,
      r.yourTitle, r.url, sha256(r.password), r.photo, randomBytes(16).toString("hex")]
  );
  return res === null ? null : Number(res.insertId);
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
            st.areasofinterest, st.areasofinteresthe, st.url, st.regDate, st.userStatus
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
