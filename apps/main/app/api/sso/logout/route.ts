import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { getClient, postLogoutUriAllowed } from "@/lib/sso";
import { BASE_PATH } from "@/lib/paths";

/**
 * IHERN SSO - shared sign-out, served at /sso-logout.php (port of
 * sso-logout.php).
 *
 *   GET ?client_id=ihern-blog&post_logout_redirect_uri=https://ihern.iiitd.edu.in/blog/
 *
 * Ends the IHERN session, so signing out on the blog signs the reader out of
 * the main website too. The blog has already ended its own session, so this
 * deliberately does not call back into the blog (that would loop); signing out
 * here is /logout, which does.
 */

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const client = getClient(q.get("client_id"));
  const target = q.get("post_logout_redirect_uri") ?? "";

  const location = client && target && postLogoutUriAllowed(client, target) ? target : `${BASE_PATH}/blogs`;
  const res = new NextResponse(null, { status: 302, headers: { Location: location, "Cache-Control": "no-store" } });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
