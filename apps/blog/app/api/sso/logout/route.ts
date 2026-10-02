import { NextResponse } from "next/server";
import { endSession, mainLogoutUrl, ssoConfigured } from "@/lib/session";
import { u } from "@/lib/paths";

/**
 * Sign out on the blog: end the blog session, then the main site's shared
 * sign-out, which ends the IHERN session and returns the reader to the blog.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  await endSession();
  const location = ssoConfigured() ? mainLogoutUrl() : u("/");
  return new NextResponse(null, { status: 302, headers: { Location: location, "Cache-Control": "no-store" } });
}

export const POST = GET;
