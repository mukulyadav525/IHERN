import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { execute, query } from "@ihern/core/db";
import { isDev, siteUrl, blogUrl } from "@ihern/core/env";

/**
 * Reader sign-in on the blog, through the main IHERN site.
 *
 * A port of the WordPress plugin (mu-plugins/ihern-sso/client.php): the blog
 * is an OAuth 2.0 client of the main site, with the same client id, the same
 * callback address (/?ihern_sso=callback) and the same back-channel sign-out
 * (/?ihern_sso=backchannel-logout). The main site needs no change to work
 * with it - PHP or Next.js.
 *
 * Sessions are kept in `blog_sessions` (not only in the cookie) so a sign-out
 * on the main site can end them here as well.
 */

export const SESSION_COOKIE = "ihern_blog_session";
const STATE_COOKIE = "ihern_blog_sso";
export const PROBED_COOKIE = "ihern_sso_probed";
const SESSION_DAYS = 14;

export const SECURE_COOKIES = process.env.NODE_ENV === "production" && !process.env.IHERN_INSECURE_COOKIES;

export type Reader = { subscriberId: number; name: string; email: string };

/* ---------------------------------------------------------------- client configuration */

export const CLIENT_ID = () => process.env.IHERN_SSO_CLIENT_ID || "ihern-blog";

/** Shared with the main site (its IHERN_SSO_BLOG_SECRET). Empty = sign-in switched off. */
export function clientSecret(): string {
  return process.env.IHERN_SSO_CLIENT_SECRET || (isDev() ? "local-development-secret-not-for-production" : "");
}

export const ssoConfigured = () => clientSecret() !== "";

/** Where the browser is sent: the main site's public address. */
const endpoint = (name: string) => `${siteUrl()}sso-${name}.php`;

/** For server-to-server calls, an internal address may be set (IHERN_SSO_INTERNAL_URL). */
function serverEndpoint(name: string): string {
  const internal = (process.env.IHERN_SSO_INTERNAL_URL || "").replace(/\/+$/, "");
  return internal ? `${internal}/sso-${name}.php` : endpoint(name);
}

/** Must match a redirect URI registered for this client on the main site. */
export const redirectUri = () => `${blogUrl()}/?ihern_sso=callback`;

/* ---------------------------------------------------------------- signed state cookie */

function signingKey(): string {
  return process.env.IHERN_SESSION_SECRET || clientSecret() || "ihern-blog-development-key";
}
const sign = (v: string) => createHmac("sha256", signingKey()).update(v).digest("base64url");

function seal(data: object): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function unseal<T>(raw: string | undefined): T | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = raw.slice(0, dot);
  const a = Buffer.from(raw.slice(dot + 1));
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- 1. off to the main site */

export type LoginIntent = { mode?: "login" | "register"; prompt?: "none"; returnTo: string; after?: "subscribe" | "" };

/** Same-site paths only. */
export function safeReturn(raw: string | null | undefined, fallback = "/"): string {
  const v = String(raw ?? "").trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return fallback;
  return /^\/[A-Za-z0-9_\-./?=&%#+~]*$/.test(v) ? v : fallback;
}

/** Remembers the request and returns the main site's authorize URL. */
export async function beginLogin(intent: LoginIntent): Promise<string> {
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(STATE_COOKIE, seal({ state, ret: safeReturn(intent.returnTo), after: intent.after || "", exp: Date.now() + 15 * 60 * 1000 }), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 15 * 60, secure: SECURE_COOKIES,
  });
  const params = new URLSearchParams({ client_id: CLIENT_ID(), redirect_uri: redirectUri(), state, nonce: randomBytes(18).toString("base64url") });
  if (intent.mode === "register") params.set("mode", "register");
  if (intent.prompt === "none") params.set("prompt", "none");
  return `${endpoint("authorize")}?${params}`;
}

/** The remembered request, read once. */
export async function takeLoginState(): Promise<{ state: string; ret: string; after: string } | null> {
  const jar = await cookies();
  const raw = jar.get(STATE_COOKIE)?.value;
  jar.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
  const s = unseal<{ state: string; ret: string; after: string; exp: number }>(raw);
  return s && Date.now() < s.exp ? s : null;
}

/* ---------------------------------------------------------------- 2. back from the main site */

export type TokenUser = { id: number; name: string; email: string; subscribed: boolean };

/** Exchanges the one-time code for the reader's identity (server to server). */
export async function exchangeCode(code: string): Promise<TokenUser | string> {
  try {
    const res = await fetch(serverEndpoint("token"), {
      method: "POST",
      body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: CLIENT_ID(), client_secret: clientSecret(), redirect_uri: redirectUri() }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const body = (await res.json().catch(() => null)) as { user?: TokenUser; error_description?: string } | null;
    if (!res.ok || !body?.user?.email) return body?.error_description || `token endpoint returned ${res.status}`;
    return { id: Number(body.user.id), name: String(body.user.name ?? ""), email: String(body.user.email), subscribed: Boolean(body.user.subscribed) };
  } catch (e) {
    return (e as Error).message;
  }
}

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Starts a blog session for this reader; false when the database is unavailable. */
export async function startSession(user: TokenUser): Promise<boolean> {
  const token = randomBytes(32).toString("base64url");
  await execute("cdnm", "DELETE FROM blog_sessions WHERE expires_at < NOW()");
  const res = await execute(
    "cdnm",
    "INSERT INTO blog_sessions (id, subscriber_id, name, email, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))",
    [hash(token), user.id, user.name, user.email, SESSION_DAYS]
  );
  if (res === null) return false;
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400, secure: SECURE_COOKIES });
  return true;
}

/* ---------------------------------------------------------------- the signed-in reader */

/** The signed-in reader, or null. One indexed lookup per request. */
export async function readReader(): Promise<Reader | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await query<{ subscriber_id: number; name: string; email: string }>(
    "cdnm",
    "SELECT subscriber_id, name, email FROM blog_sessions WHERE id = ? AND expires_at > NOW() LIMIT 1",
    [hash(token)]
  );
  const r = rows?.[0];
  return r ? { subscriberId: Number(r.subscriber_id), name: r.name, email: r.email } : null;
}

export type ReaderState = { reader: Reader; subscribed: boolean; editor: boolean };

/**
 * The signed-in reader with what every page shows about them (subscribed?
 * an editor?), in one query instead of three. null when signed out or the
 * database is unavailable.
 */
export async function readReaderState(): Promise<ReaderState | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await query<{ subscriber_id: number; name: string; email: string; subscribed: number | null; editor: number | null }>(
    "cdnm",
    `SELECT s.subscriber_id, s.name, s.email,
            (sub.status = 'active') AS subscribed,
            (e.id IS NOT NULL) AS editor
       FROM blog_sessions s
       LEFT JOIN blog_subscriptions sub ON sub.subscriber_id = s.subscriber_id
       LEFT JOIN blog_editors e ON e.email = LOWER(s.email)
      WHERE s.id = ? AND s.expires_at > NOW()
      LIMIT 1`,
    [hash(token)]
  );
  const r = rows?.[0];
  if (!r) return null;
  return {
    reader: { subscriberId: Number(r.subscriber_id), name: r.name, email: r.email },
    subscribed: Number(r.subscribed) === 1,
    editor: Number(r.editor) === 1,
  };
}

/** Ends this browser's blog session. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await execute("cdnm", "DELETE FROM blog_sessions WHERE id = ?", [hash(token)]);
  jar.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

/** The main site's shared sign-out, which returns the reader to the blog. */
export function mainLogoutUrl(): string {
  const params = new URLSearchParams({ client_id: CLIENT_ID(), post_logout_redirect_uri: `${blogUrl()}/` });
  return `${endpoint("logout")}?${params}`;
}

/* ---------------------------------------------------------------- telling the main site */

/**
 * Tells the main site the blog's content changed, so its Blogs page shows it
 * at once (it otherwise refreshes within a minute). Best effort: a failure is
 * logged, never shown to the editor.
 */
export async function notifyMainSite(): Promise<void> {
  const secret = clientSecret();
  if (!secret) return;
  const base = (process.env.IHERN_SSO_INTERNAL_URL || siteUrl()).replace(/\/+$/, "");
  const ts = String(Math.floor(Date.now() / 1000));
  try {
    const res = await fetch(`${base}/api/blog/changed`, {
      method: "POST",
      body: new URLSearchParams({ client_id: CLIENT_ID(), ts, sig: createHmac("sha256", secret).update(`blog-changed|${ts}`).digest("hex") }),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) console.warn(`[IHERN blog] the main site did not take the content update (${res.status})`);
  } catch (e) {
    console.warn("[IHERN blog] could not tell the main site about the content update:", (e as Error).message);
  }
}

/* ---------------------------------------------------------------- 3. signed out on the main site */

/**
 * The main site's back-channel sign-out: POST sub, ts, sig where
 * sig = HMAC-SHA256("sub|ts", client secret). Ends every blog session of
 * that reader. Same message format the WordPress plugin accepted.
 */
export async function backchannelLogout(sub: string, ts: string, sig: string): Promise<boolean> {
  const secret = clientSecret();
  if (!secret || !/^\d+$/.test(sub) || !/^\d+$/.test(ts)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(ts)) > 300) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${sub}|${ts}`).digest("hex"));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  return (await execute("cdnm", "DELETE FROM blog_sessions WHERE subscriber_id = ?", [Number(sub)])) !== null;
}
