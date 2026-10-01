import { NextRequest, NextResponse } from "next/server";
import { readSession, safeReturn, SESSION_COOKIE } from "@/lib/auth";
import { backchannelLogout } from "@/lib/sso";
import { u } from "@/lib/paths";

/**
 * Sign out of the IHERN account (blog-logout.php).
 *
 * Ends the session here and tells every SSO client - the WordPress blog - to
 * end its own, so one "Sign out" signs the reader out everywhere. The other
 * direction (signing out on the blog) is /sso-logout.php.
 *
 * The blog subscription belongs to the account and is untouched.
 */

export const dynamic = "force-dynamic";

async function signOut(req: NextRequest) {
  const session = await readSession();
  // Notify first; failures are logged inside and never block sign-out.
  if (session) await backchannelLogout(session.id);

  const target = safeReturn(req.nextUrl.searchParams.get("return"), "/");
  const res = new NextResponse(null, { status: 303, headers: { Location: u(target), "Cache-Control": "no-store" } });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export const GET = signOut;
export const POST = signOut;
