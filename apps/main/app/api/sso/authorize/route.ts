import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/auth";
import { getAccountById } from "@ihern/core/store";
import { getClient, issueCode, redirectUriAllowed, redirectWith } from "@/lib/sso";
import { BASE_PATH } from "@/lib/paths";

/**
 * IHERN SSO - authorization endpoint, served at /sso-authorize.php
 * (port of sso-authorize.php).
 *
 * The blog sends the reader here. With an IHERN session they go straight back
 * with a one-time code - that is the single sign-on. Without one they use the
 * IHERN sign-in page and land back here afterwards.
 *
 *   ?client_id=ihern-blog&redirect_uri=…&state=…  [&nonce=…] [&prompt=none] [&mode=register]
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const clientId = q.get("client_id") ?? "";
  const redirectUri = q.get("redirect_uri") ?? "";
  const state = q.get("state") ?? "";
  const nonce = q.has("nonce") ? (q.get("nonce") ?? "").slice(0, 64) : null;
  const prompt = q.get("prompt") ?? "";
  const mode = q.get("mode") === "register" ? "register" : "login";

  const client = getClient(clientId);

  // An unknown client or unregistered redirect_uri must NOT be redirected to.
  if (!client) {
    return new NextResponse("Unknown or unconfigured SSO client.", { status: 400 });
  }
  if (!redirectUri || !redirectUriAllowed(client, redirectUri)) {
    return new NextResponse("The redirect_uri is not registered for this client.", { status: 400 });
  }
  if (!/^[A-Za-z0-9_\-]{8,128}$/.test(state)) {
    return redirectWith(redirectUri, { error: "invalid_request", error_description: "Missing or malformed state." });
  }

  const session = await readSession();

  if (!session) {
    if (prompt === "none") {
      // Silent check: tell the blog nobody is signed in, without any UI.
      return redirectWith(redirectUri, { error: "login_required", state });
    }
    // Through the IHERN sign-in page, then back here.
    const back = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, state });
    if (nonce) back.set("nonce", nonce);
    const login = new URLSearchParams({ mode, return: `/sso-authorize.php?${back.toString()}` });
    return new NextResponse(null, { status: 302, headers: { Location: `${BASE_PATH}/login?${login.toString()}` } });
  }

  const account = await getAccountById(session.id);
  if (!account.ok && account.reason === "unavailable") {
    return redirectWith(redirectUri, { error: "temporarily_unavailable", state });
  }
  if (!account.ok) {
    // A session for an account that no longer exists is not a session.
    const res = redirectWith(redirectUri, { error: "login_required", state });
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  const code = await issueCode(client.id, session.id, redirectUri, nonce);
  if (!code) {
    return redirectWith(redirectUri, { error: "server_error", state });
  }
  return redirectWith(redirectUri, { code, state });
}
