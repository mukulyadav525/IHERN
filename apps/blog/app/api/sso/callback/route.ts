import { NextRequest, NextResponse } from "next/server";
import { setSubscribed } from "@ihern/core/store";
import { exchangeCode, startSession, takeLoginState } from "@/lib/session";
import { u } from "@/lib/paths";

/**
 * Back from the main site (served at /?ihern_sso=callback, the redirect URI
 * the main site has registered for the blog): check the state, exchange the
 * one-time code for the reader's identity, start the blog session, and do
 * what they asked for before signing in (subscribe).
 */

export const dynamic = "force-dynamic";

function finish(path: string, notice?: string) {
  const sep = path.includes("?") ? "&" : "?";
  const target = notice ? `${path}${sep}notice=${notice}` : path;
  return new NextResponse(null, { status: 302, headers: { Location: u(target), "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const remembered = await takeLoginState();
  const returnTo = remembered?.ret ?? "/";

  // A silent check that found nobody signed in, or a sign-in that was abandoned.
  if (q.get("error")) {
    if (q.get("error") !== "login_required") console.error("[blog sso] authorize error:", q.get("error"));
    return finish(returnTo);
  }
  if (!remembered || q.get("state") !== remembered.state) return finish(returnTo, "signin-failed");

  const code = q.get("code") ?? "";
  if (!code) return finish(returnTo);

  const user = await exchangeCode(code);
  if (typeof user === "string") {
    console.error("[blog sso] token exchange:", user);
    return finish(returnTo, "signin-failed");
  }
  if (!(await startSession(user))) return finish(returnTo, "signin-failed");

  if (remembered.after === "subscribe") {
    const res = await setSubscribed(user.id, true, "blog");
    return finish(returnTo, res.ok ? "subscribed" : "subscribe-failed");
  }
  return finish(returnTo);
}
