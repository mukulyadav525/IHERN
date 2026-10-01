import bcrypt from "bcryptjs";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { query, execute, isConfigured } from "./db";
import { sendSubscriptionConfirmation } from "./mail";

/**
 * The IHERN account system - the EXISTING one.
 *
 * Identity lives in `cdnm.blog_subscribers` and the blog subscription in
 * `cdnm.blog_subscriptions`, exactly as the PHP site uses them. There is no
 * second user table and no second password: an existing IHERN reader signs in
 * here with the account they already have.
 *
 * Passwords are PHP `password_hash()` bcrypt hashes ($2y$). bcryptjs verifies
 * them once the prefix is normalised, and hashes written here are stored as
 * $2y$, so PHP's password_verify() accepts them too - the two applications
 * stay interoperable and can run side by side.
 *
 * Business rules preserved from includes/blog-auth.php and sso-server.php:
 *   - the allowed-email-domain policy
 *   - members who joined through the membership form sign in with the same
 *     email and password (their account is created on first sign-in)
 *   - find-or-create for Google identities (unusable random password)
 *   - subscription upsert, confirmation email only on the move into `active`
 */

export type Account = { id: number; name: string; email: string };

export type Fail =
  | "unavailable" // database not configured/reachable
  | "not_found"
  | "exists"
  | "bad_credentials"
  | "domain_not_allowed";

export type Result<T> = { ok: true; value: T } | { ok: false; reason: Fail };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = <T>(reason: Fail): Result<T> => ({ ok: false, reason });

export function accountsAvailable(): boolean {
  return isConfigured("cdnm");
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function allowedDomains(): string[] {
  return (process.env.IHERN_ALLOWED_EMAIL_DOMAINS || "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

/** Mirrors ihern_email_domain_allowed(): an empty policy allows any address. */
export function emailDomainAllowed(email: string): boolean {
  const allowed = allowedDomains();
  if (!allowed.length) return true;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return allowed.some((d) => domain === d || domain.endsWith("." + d));
}

export function domainHint(): string {
  const allowed = allowedDomains();
  return allowed.length ? `Sign-in is limited to ${allowed.map((d) => "@" + d).join(", ")} addresses.` : "";
}

/*
 * $2a$/$2b$/$2y$ are the same bcrypt algorithm; only the marker differs.
 * PHP writes $2y$, which bcryptjs will not parse, so it is normalised on read;
 * hashes are written as $2y$ so PHP's password_verify() accepts them.
 */
const forBcryptjs = (hash: string) => (hash.startsWith("$2y$") ? "$2a$" + hash.slice(4) : hash);
const forPhp = (hash: string) => hash.replace(/^\$2[ab]\$/, "$2y$");

async function hashPassword(password: string): Promise<string> {
  return forPhp(await bcrypt.hash(password, 10));
}

type Row = { id: number; name: string | null; email: string };
const toAccount = (r: Row): Account => ({ id: Number(r.id), name: String(r.name ?? ""), email: String(r.email) });

export async function getAccountByEmail(email: string): Promise<Result<Account>> {
  const rows = await query<Row>("cdnm", "SELECT id, name, email FROM blog_subscribers WHERE email = ? LIMIT 1", [
    normaliseEmail(email),
  ]);
  if (rows === null) return fail("unavailable");
  return rows.length ? ok(toAccount(rows[0])) : fail("not_found");
}

/** Mirrors ihern_sso_subscriber(). */
export async function getAccountById(id: number): Promise<Result<Account>> {
  const rows = await query<Row>("cdnm", "SELECT id, name, email FROM blog_subscribers WHERE id = ? LIMIT 1", [id]);
  if (rows === null) return fail("unavailable");
  return rows.length ? ok(toAccount(rows[0])) : fail("not_found");
}

/**
 * Signs in with an IHERN password - blog-login.php's sign-in branch: the
 * account's own password first; with no account for the address, a member who
 * joined through the membership form is let in with that password.
 */
export async function verifyCredentials(email: string, password: string): Promise<Result<Account>> {
  const addr = normaliseEmail(email);
  const rows = await query<Row & { password_hash: string }>(
    "cdnm",
    "SELECT id, name, email, password_hash FROM blog_subscribers WHERE email = ? LIMIT 1",
    [addr]
  );
  if (rows === null) return fail("unavailable");
  if (rows.length) {
    const matches = await bcrypt.compare(password, forBcryptjs(String(rows[0].password_hash)));
    return matches ? ok(toAccount(rows[0])) : fail("bad_credentials");
  }
  const member = await adoptMemberAccount(addr, password);
  return member ?? fail("bad_credentials");
}

/**
 * Mirrors ihern_adopt_member_account(): a member registered in
 * ihern2024.studentregistration signs in with the same email and password, and
 * the first time they do their IHERN account is created from that record.
 *
 * Membership passwords are unsalted SHA-256 (the membership system's format);
 * that format is only compared here, never written. The IHERN account gets a
 * proper bcrypt hash of the same password.
 */
async function adoptMemberAccount(email: string, password: string): Promise<Result<Account> | null> {
  if (!password) return null;
  const rows = await query<{ studentName: string | null; studentPassword: string | null }>(
    "ihern2024",
    "SELECT studentName, studentPassword FROM studentregistration WHERE LOWER(studentEmail) = ? LIMIT 2",
    [email]
  );
  if (!rows || rows.length !== 1) return null;

  const stored = Buffer.from(String(rows[0].studentPassword ?? ""));
  const given = Buffer.from(createHash("sha256").update(password).digest("hex"));
  if (stored.length !== given.length || !timingSafeEqual(stored, given)) return null;

  const name = String(rows[0].studentName ?? "").trim() || email.split("@")[0];
  const res = await execute("cdnm", "INSERT INTO blog_subscribers (name, email, password_hash) VALUES (?, ?, ?)", [
    name,
    email,
    await hashPassword(password),
  ]);
  if (res === null) return fail("unavailable");
  return ok({ id: Number(res.insertId), name, email });
}

/** Creates an IHERN account (blog-login.php's "Create account" branch). */
export async function createAccount(email: string, password: string, name: string): Promise<Result<Account>> {
  const addr = normaliseEmail(email);
  if (!emailDomainAllowed(addr)) return fail("domain_not_allowed");

  const existing = await getAccountByEmail(addr);
  if (existing.ok) return fail("exists");
  if (existing.reason === "unavailable") return fail("unavailable");

  const res = await execute("cdnm", "INSERT INTO blog_subscribers (name, email, password_hash) VALUES (?, ?, ?)", [
    name,
    addr,
    await hashPassword(password),
  ]);
  if (res === null) return fail("unavailable");
  return ok({ id: Number(res.insertId), name, email: addr });
}

/**
 * Mirrors ihern_find_or_create_subscriber(): a Google identity gets a random,
 * unusable password because the column is NOT NULL and it never signs in
 * with one.
 */
export async function findOrCreateOAuthAccount(email: string, name: string): Promise<Result<Account>> {
  const addr = normaliseEmail(email);
  if (!emailDomainAllowed(addr)) return fail("domain_not_allowed");

  const existing = await getAccountByEmail(addr);
  if (existing.ok) return existing;
  if (existing.reason === "unavailable") return fail("unavailable");

  const display = name || addr.split("@")[0];
  const res = await execute("cdnm", "INSERT INTO blog_subscribers (name, email, password_hash) VALUES (?, ?, ?)", [
    display,
    addr,
    await hashPassword(randomBytes(32).toString("hex")),
  ]);
  if (res === null) return fail("unavailable");
  return ok({ id: Number(res.insertId), name: display, email: addr });
}

/* ---------------- blog subscription (cdnm.blog_subscriptions) ------------- */

/** Mirrors ihern_subscription_active(). null when the database is unavailable. */
export async function isSubscribed(subscriberId: number): Promise<boolean | null> {
  const rows = await query<{ status: string }>(
    "cdnm",
    "SELECT status FROM blog_subscriptions WHERE subscriber_id = ? LIMIT 1",
    [subscriberId]
  );
  if (rows === null) return null;
  return rows.length > 0 && rows[0].status === "active";
}

/**
 * Mirrors ihern_subscription_set(): the same upsert, and the confirmation
 * email only on the move into `active`, so re-clicking Subscribe sends
 * nothing. Mail is best-effort and never fails the subscription.
 */
export async function setSubscribed(
  subscriberId: number,
  active: boolean,
  source = "blog"
): Promise<Result<{ subscribed: boolean }>> {
  const was = await isSubscribed(subscriberId);
  if (was === null) return fail("unavailable");
  const res = await execute(
    "cdnm",
    `INSERT INTO blog_subscriptions (subscriber_id, status, source) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status)`,
    [subscriberId, active ? "active" : "unsubscribed", source]
  );
  if (res === null) return fail("unavailable");

  if (active && !was) {
    const user = await getAccountById(subscriberId);
    if (user.ok) await sendSubscriptionConfirmation(user.value.name, user.value.email);
  }
  return ok({ subscribed: active });
}

/** Active subscribers, for the new-post notification. */
export async function activeSubscribers(): Promise<{ name: string; email: string }[] | null> {
  return query<{ name: string; email: string }>(
    "cdnm",
    `SELECT s.name, s.email FROM blog_subscribers s
       JOIN blog_subscriptions b ON b.subscriber_id = s.id
      WHERE b.status = 'active'`
  );
}
