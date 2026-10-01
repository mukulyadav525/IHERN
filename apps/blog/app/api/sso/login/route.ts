import { NextRequest, NextResponse } from "next/server";
import { beginLogin, PROBED_COOKIE, safeReturn, SECURE_COOKIES, ssoConfigured } from "@/lib/session";
import { u } from "@/lib/paths";

/**
 * Sign in on the blog: off to the main site's sign-in (or, with prompt=none,
 * a silent check that shows nothing). Also served at /?ihern_sso=login.
 *
 *   ?mode=register   open the "Create account" tab
 *   ?after=subscribe subscribe once signed in
 *   ?return=/path    where to come back to
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const returnTo = safeReturn(q.get("return"));
  const silent = q.get("prompt") === "none";

  const res = (location: string) => {
    const r = new NextResponse(null, { status: 302, headers: { Location: location, "Cache-Control": "no-store" } });
    // The silent check runs once per browser session (and again when the
    // reader comes from the main site, at most once a minute).
    r.cookies.set(PROBED_COOKIE, "1", { path: "/", sameSite: "lax", secure: SECURE_COOKIES, httpOnly: true });
    r.cookies.set("ihern_sso_reprobe", "1", { path: "/", sameSite: "lax", secure: SECURE_COOKIES, httpOnly: true, maxAge: 60 });
    return r;
  };

  if (!ssoConfigured()) return res(u(silent ? returnTo : `${returnTo}${returnTo.includes("?") ? "&" : "?"}notice=signin-off`));

  const location = await beginLogin({
    mode: q.get("mode") === "register" ? "register" : "login",
    prompt: silent ? "none" : undefined,
    returnTo,
    after: q.get("after") === "subscribe" ? "subscribe" : "",
  });
  return res(location);
}
