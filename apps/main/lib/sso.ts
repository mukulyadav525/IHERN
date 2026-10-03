import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { query, execute } from "@ihern/core/db";
import { isDev, blogUrl } from "@ihern/core/env";

/**
 * IHERN SSO - identity provider for the WordPress blog.
 *
 * A port of includes/sso-server.php and includes/sso-config.php. The blog's
 * plugin (wp-content/mu-plugins/ihern-sso) talks to the same endpoints at the
 * same addresses, so it works against this site without any change:
 *
 *   /sso-authorize.php     user-facing: authenticates, issues a one-time code
 *   /sso-token.php         server-to-server: code + client secret -> tokens
 *   /sso-userinfo.php      server-to-server: token -> profile + subscription
 *   /sso-subscription.php  server-to-server: token -> read/change subscription
 *   /sso-logout.php        user-facing: ends the shared IHERN session
 *   /sso-notify.php        server-to-server: emails subscribers about a new post
 *
 * (next.config.mjs rewrites those paths to app/api/sso/*.)
 *
 * OAuth 2.0 authorization-code flow; tokens are compact HS256 JWS, exactly as
 * the PHP version issues them.
 */

export type Client = {
  id: string;
  name: string;
  secret: string;
  redirectUris: string[];
  backchannelLogoutUri: string;
  postLogoutRedirectUris: string[];
};

export const CODE_TTL = 120; // seconds
export const TOKEN_TTL = 3600; // seconds

/** The client registry (sso-config.php). redirect_uris is an exact-match allow-list. */
export function clients(): Record<string, Client> {
  const dev = isDev();
  // The blog's own address, as set in this server's settings (IHERN_BLOG_URL):
  // always allowed, so a blog on another address (a test server, a new host)
  // can sign people in. Only the server's owner can set it.
  const ownBlog = (process.env.IHERN_BLOG_URL || "").replace(/\/+$/, "");
  const devRedirects = Array.from(
    new Set([...(dev ? ["http://localhost:3001/?ihern_sso=callback", "http://localhost:8080/?ihern_sso=callback", "https://localhost:8443/?ihern_sso=callback"] : []), ownBlog ? `${ownBlog}/?ihern_sso=callback` : ""].filter(Boolean))
  );
  const devLogouts = Array.from(
    new Set([...(dev ? ["http://localhost:3001/", "http://localhost:8080/", "https://localhost:8443/"] : []), ownBlog ? `${ownBlog}/` : ""].filter(Boolean))
  );

  return {
    "ihern-blog": {
      id: "ihern-blog",
      name: "IHERN Blog",
      // IHERN_SSO_BLOG_SECRET in the environment, the same value as the blog's
      // IHERN_SSO_CLIENT_SECRET. With nothing set, single sign-on stays off.
      secret: process.env.IHERN_SSO_BLOG_SECRET || (dev ? "local-development-secret-not-for-production" : ""),
      redirectUris: ["https://ihernblog.iiitd.ac.in/?ihern_sso=callback", ...devRedirects],
      backchannelLogoutUri: blogUrl() + "/?ihern_sso=backchannel-logout",
      postLogoutRedirectUris: ["https://ihernblog.iiitd.ac.in/", ...devLogouts],
    },
  };
}

/** The registered client, or null if unknown or unconfigured (no secret). */
export function getClient(clientId: string | null | undefined): Client | null {
  if (!clientId) return null;
  const c = clients()[clientId];
  return c && c.secret ? c : null;
}

export function equalStrings(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const redirectUriAllowed = (c: Client, uri: string) => c.redirectUris.some((u) => equalStrings(u, uri));
export const postLogoutUriAllowed = (c: Client, uri: string) => c.postLogoutRedirectUris.some((u) => equalStrings(u, uri));

/* ---------------- signed tokens ---------------- */

const b64u = (raw: Buffer | string) => Buffer.from(raw).toString("base64url");

export function issueToken(claims: Record<string, unknown>, secret: string): string {
  const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64u(JSON.stringify(claims));
  const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest();
  return `${header}.${payload}.${b64u(sig)}`;
}

/** Signature and expiry; the claims, or null. */
export function verifyToken(token: string, secret: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!claims || typeof claims !== "object") return null;
    if (!claims.exp || Number(claims.exp) < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

export function bearerToken(req: Request): string {
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") || "");
  return m ? m[1] : "";
}

/* ---------------- authorization codes (cdnm.sso_auth_codes) ---------------- */

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** A single-use code bound to the client and redirect_uri; null on a database error. */
export async function issueCode(clientId: string, subscriberId: number, redirectUri: string, nonce: string | null) {
  const code = randomBytes(32).toString("hex");
  await execute("cdnm", "DELETE FROM sso_auth_codes WHERE expires_at < NOW()");
  const res = await execute(
    "cdnm",
    `INSERT INTO sso_auth_codes (code_hash, client_id, subscriber_id, redirect_uri, nonce, expires_at)
     VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))`,
    [sha256(code), clientId, subscriberId, redirectUri, nonce, CODE_TTL]
  );
  return res === null ? null : code;
}

/**
 * Consumes a code. Single-use: the row is deleted whether or not it matched,
 * so a leaked code cannot be replayed. "error" when the database failed.
 */
export async function consumeCode(
  code: string,
  clientId: string,
  redirectUri: string
): Promise<{ subscriberId: number; nonce: string | null } | null | "error"> {
  const hash = sha256(code);
  const rows = await query<{ client_id: string; subscriber_id: number; redirect_uri: string; nonce: string | null; expired: number }>(
    "cdnm",
    "SELECT client_id, subscriber_id, redirect_uri, nonce, (expires_at < NOW()) AS expired FROM sso_auth_codes WHERE code_hash = ?",
    [hash]
  );
  if (rows === null) return "error";
  await execute("cdnm", "DELETE FROM sso_auth_codes WHERE code_hash = ?", [hash]);
  const row = rows[0];
  if (!row || Number(row.expired)) return null;
  if (!equalStrings(String(row.client_id), clientId) || !equalStrings(String(row.redirect_uri), redirectUri)) return null;
  return { subscriberId: Number(row.subscriber_id), nonce: row.nonce };
}

/* ---------------- responses ---------------- */

export function json(payload: unknown, status = 200): NextResponse {
  return NextResponse.json(payload, { status, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
}

export function error(code: string, description: string, status = 400): NextResponse {
  return json({ error: code, error_description: description }, status);
}

/** A redirect to a registered redirect_uri with extra query parameters. */
export function redirectWith(uri: string, params: Record<string, string>): NextResponse {
  const sep = uri.includes("?") ? "&" : "?";
  return new NextResponse(null, {
    status: 302,
    headers: { Location: uri + sep + new URLSearchParams(params).toString(), "Cache-Control": "no-store" },
  });
}

/* ---------------- back-channel single sign-out ---------------- */

/**
 * Tells every registered client that this reader's IHERN session has ended,
 * server-to-server, so they are not left signed in on the blog. Authenticated
 * with an HMAC over "sub|timestamp" using the client secret; failures are
 * logged and never block sign-out here.
 */
export async function backchannelLogout(subscriberId: number): Promise<void> {
  if (subscriberId <= 0) return;
  await Promise.all(
    Object.values(clients()).map(async (c) => {
      if (!c.secret || !c.backchannelLogoutUri) return;
      const ts = Math.floor(Date.now() / 1000);
      const body = new URLSearchParams({
        sub: String(subscriberId),
        ts: String(ts),
        sig: createHmac("sha256", c.secret).update(`${subscriberId}|${ts}`).digest("hex"),
      });
      try {
        const res = await fetch(c.backchannelLogoutUri, {
          method: "POST",
          body,
          cache: "no-store",
          redirect: "manual",
          signal: AbortSignal.timeout(3000),
        });
        const text = (await res.text()).trim();
        if (res.status !== 200 || text !== "ok") {
          console.error(`[IHERN SSO] back-channel logout to ${c.id} returned ${res.status}`);
        }
      } catch (e) {
        console.error(`[IHERN SSO] back-channel logout to ${c.id} failed:`, (e as Error).message);
      }
    })
  );
}
