import { NextResponse } from "next/server";
import { memberLogout } from "@/lib/membership";
import { BASE_PATH } from "@/lib/paths";

/** Member sign-out (applications/logout.php): ends the membership session, back to member sign in. */

export const dynamic = "force-dynamic";

export async function GET() {
  await memberLogout();
  return new NextResponse(null, { status: 303, headers: { Location: `${BASE_PATH}/membership/login`, "Cache-Control": "no-store" } });
}
