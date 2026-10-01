import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { absoluteUrl } from "@ihern/core/env";
import { secret as sessionSecret } from "./auth";

/**
 * Google OAuth 2.0 — the same flow as includes/blog-auth.php + blog-oauth.php.
 *
 * The PHP version keeps the single-use `state` in $_SESSION. There is no
 * server-side session here, so state (and the return path) travel in a signed,
 * httpOnly, short-lived cookie — same single-use CSRF property.
 *
 * Switched on by IHERN_GOOGLE_CLIENT_ID / IHERN_GOOGLE_CLIENT_SECRET, the same
 * variables auth-config.php reads. Absent, the Google button reports that the
 * provider is not configured rather than signing anyone in.
 */

export const OAUTH_STATE_COOKIE = "ihern_oauth";
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export type GoogleProfile = { email: string; name: string; verified: boolean };

export function googleEnabled(): boolean {
  return Boolean(
    process.env.IHERN_GOOGLE_CLIENT_ID && process.env.IHERN_GOOGLE_CLIENT_SECRET
  );
}

/**
 * The address Google sends the reader back to. Defaults to the same one the PHP
 * site registers - IHERN_SITE_URL + "blog-oauth.php" - so the existing entry in
 * Google Cloud Console keeps working (next.config.mjs routes it here).
 */
export function googleRedirectUri(): string {
  return process.env.IHERN_GOOGLE_REDIRECT_URI || absoluteUrl("blog-oauth.php");
}

/* ---------------- signed state cookie ---------------- */

const secret = sessionSecret;

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function makeStateCookie(returnTo: string): { state: string; value: string } {
  const state = randomBytes(24).toString("hex");
  const payload = Buffer.from(
    JSON.stringify({ state, ret: returnTo, exp: Date.now() + STATE_TTL_MS })
  ).toString("base64url");
  return { state, value: `${payload}.${sign(payload)}` };
}

export function readStateCookie(
  raw: string | undefined
): { state: string; ret: string } | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = raw.slice(0, dot);
  const provided = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(sign(payload));
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }
  try {
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      state?: string;
      ret?: string;
      exp?: number;
    };
    if (!json.state || typeof json.exp !== "number" || Date.now() > json.exp) return null;
    return { state: json.state, ret: json.ret || "/blogs" };
  } catch {
    return null;
  }
}

/* ---------------- Google endpoints ---------------- */

export function googleAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.IHERN_GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** Exchanges the authorization code for the signed-in user's profile. */
export async function fetchGoogleProfile(
  code: string,
  redirectUri: string
): Promise<GoogleProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.IHERN_GOOGLE_CLIENT_ID!,
      client_secret: process.env.IHERN_GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) throw new Error(`Token request failed (HTTP ${tokenRes.status})`);
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("Google did not return an access token.");

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  if (!profileRes.ok) throw new Error(`Profile request failed (HTTP ${profileRes.status})`);
  const profile = (await profileRes.json()) as {
    email?: string;
    name?: string;
    email_verified?: boolean;
  };
  if (!profile.email) throw new Error("Google did not return an email address.");

  return {
    email: profile.email.toLowerCase(),
    name: profile.name || profile.email.split("@")[0],
    verified: Boolean(profile.email_verified),
  };
}
