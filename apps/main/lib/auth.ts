import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * The IHERN account session.
 *
 * Carries the subscriber id, email and name - the same values the PHP site
 * keeps in $_SESSION['blog_subscriber_id' / '_email' / '_name'] - so the
 * identity is the existing `cdnm.blog_subscribers` row, not a new user record.
 *
 * The cookie is HMAC-SHA256 signed with an expiry: an unsigned cookie would
 * let anyone sign in as anyone by editing it.
 */

export const SESSION_COOKIE = "ihern_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type Session = { id: number; email: string; name: string } | null;

export function secret(): string {
  const s = process.env.IHERN_SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    console.warn("[IHERN] IHERN_SESSION_SECRET is not set; sessions are signed with a fallback key.");
  }
  return "ihern-development-only-session-key-change-me";
}

const b64url = (input: Buffer | string) => Buffer.from(input).toString("base64url");
const sign = (payload: string) => b64url(createHmac("sha256", secret()).update(payload).digest());

/** A signed `payload.signature` value; payload is base64url JSON. */
export function signValue(data: object): string {
  const payload = b64url(JSON.stringify(data));
  return `${payload}.${sign(payload)}`;
}

/** Verifies a value from signValue(); null when tampered with or malformed. */
export function readSigned<T>(token: string | undefined): T | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const a = Buffer.from(token.slice(dot + 1));
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/** Secure cookies in production (set IHERN_INSECURE_COOKIES=1 only for a plain-http preview). */
export const SECURE_COOKIES = process.env.NODE_ENV === "production" && !process.env.IHERN_INSECURE_COOKIES;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
  secure: SECURE_COOKIES,
};

export function createSessionToken(id: number, email: string, name = ""): string {
  return signValue({ id, email, name, exp: Date.now() + MAX_AGE_SECONDS * 1000 });
}

export function verifySessionToken(token: string | undefined): Session {
  const json = readSigned<{ id?: number; email?: string; name?: string; exp?: number }>(token);
  if (!json || typeof json.id !== "number" || !json.email) return null;
  if (typeof json.exp !== "number" || Date.now() > json.exp) return null;
  return { id: json.id, email: json.email, name: json.name || "" };
}

/** The signed-in reader, or null. Tampered or expired cookies read as null. */
export async function readSession(): Promise<Session> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Signs the reader in (server actions and route handlers). */
export async function startSession(id: number, email: string, name: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(id, email, name), SESSION_COOKIE_OPTIONS);
}

export async function endSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
}

/**
 * Same-site return paths only, like ihern_safe_return(). Accepts "/path?query"
 * on this site; a legacy PHP-style relative value ("blog.php") is read as
 * "/blog.php", which the .php aliases then route. Anything else - another
 * host, "//host", "..", a backslash - falls back.
 */
export function safeReturn(candidate: string | null | undefined, fallback = "/blogs"): string {
  let v = String(candidate ?? "").trim();
  if (!v) return fallback;
  if (!v.startsWith("/")) v = "/" + v;
  if (v.startsWith("//") || v.includes("..") || v.includes("\\")) return fallback;
  if (!/^\/[A-Za-z0-9_\-./?=&%#+]*$/.test(v)) return fallback;
  // A PHP page address goes straight to the page it now lives at.
  const cut = v.search(/[?#]/);
  const pathPart = cut < 0 ? v : v.slice(0, cut);
  const page = PHP_PAGES[pathPart];
  return page === undefined ? v : page + (cut < 0 ? "" : v.slice(cut));
}

/** The PHP site's page addresses and the pages they are now (next.config.mjs has the same list). */
const PHP_PAGES: Record<string, string> = {
  "/index.php": "/",
  "/about.php": "/about",
  "/initiatives.php": "/initiatives",
  "/members.php": "/members",
  "/stc.php": "/stc",
  "/sig.php": "/sig",
  "/reports.php": "/reports",
  "/blog.php": "/blogs",
  "/blog-account.php": "/account",
  "/applications/register.php": "/join",
};

/**
 * Initials for the account avatar: first letters of the first and last words
 * of the name ("Mukul Kumar Sharma" -> MS), titles dropped, else the email's
 * first letter. Same rule as ihern_initials() and the blog's account menu.
 */
export function initials(name: string, email = ""): string {
  const words = name.trim().replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, "").split(/\s+/).filter(Boolean);
  if (words.length) {
    const first = Array.from(words[0])[0] ?? "";
    const last = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? "" : "";
    return (first + last).toUpperCase();
  }
  return (Array.from(email || "?")[0] ?? "?").toUpperCase();
}
