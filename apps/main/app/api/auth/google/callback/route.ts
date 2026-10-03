import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/auth";
import { fetchGoogleProfile, googleEnabled, googleRedirectUri, OAUTH_STATE_COOKIE, readStateCookie } from "@/lib/oauth";
import { emailDomainAllowed, findOrCreateOAuthAccount } from "@ihern/core/store";
import { linkAdminOnSignIn } from "@/lib/admin";
import { BASE_PATH, u } from "@/lib/paths";

/**
 * Google sends the reader back here (as /blog-oauth.php, the address the PHP
 * site registers). The same checks as blog-oauth.php, in the same order:
 * configured, state matches (single use), not cancelled, code present, profile
 * fetched, email verified, domain allowed, account found or created.
 *
 * Failures go back to the sign-in page with an error code it turns into the
 * same message the PHP page shows.
 */

export const dynamic = "force-dynamic";

function back(location: string) {
  const res = new NextResponse(null, { status: 303, headers: { Location: location, "Cache-Control": "no-store" } });
  res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

function fail(code: string, ret: string) {
  return back(`${BASE_PATH}/login?${new URLSearchParams({ error: code, return: ret })}`);
}

export async function GET(req: NextRequest) {
  const stored = readStateCookie(req.cookies.get(OAUTH_STATE_COOKIE)?.value);
  const ret = stored?.ret ?? "/blogs";
  const q = req.nextUrl.searchParams;

  if (!googleEnabled()) return fail("google_off", ret);
  if (!stored || (q.get("state") ?? "") !== stored.state) return fail("state", ret);
  if (q.get("error")) return fail("cancelled", ret);

  const code = q.get("code") ?? "";
  if (!code) return fail("no_code", ret);

  let profile;
  try {
    profile = await fetchGoogleProfile(code, googleRedirectUri());
  } catch (e) {
    console.error("[google-callback]", (e as Error).message);
    return fail("google_failed", ret);
  }

  if (!profile.verified) return fail("unverified", ret);
  if (!emailDomainAllowed(profile.email)) return fail("domain", ret);

  const account = await findOrCreateOAuthAccount(profile.email, profile.name);
  if (!account.ok) return fail(account.reason === "domain_not_allowed" ? "domain" : "unavailable", ret);

  // Google has checked the address: a membership admin's account opens the membership admin.
  await linkAdminOnSignIn(account.value.id, account.value.email, null);

  const res = back(u(ret));
  res.cookies.set(SESSION_COOKIE, createSessionToken(account.value.id, account.value.email, account.value.name), SESSION_COOKIE_OPTIONS);
  return res;
}
