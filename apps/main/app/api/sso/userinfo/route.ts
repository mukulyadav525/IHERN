import { NextRequest } from "next/server";
import { getAccountById, isSubscribed } from "@ihern/core/store";
import { bearerToken, error, getClient, json, verifyToken } from "@/lib/sso";

/**
 * IHERN SSO - userinfo endpoint, served at /sso-userinfo.php (port of
 * sso-userinfo.php). Server-to-server only.
 *
 *   GET ?client_id=ihern-blog   Authorization: Bearer <access_token>
 *   200 { sub, name, email, subscribed }
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const client = getClient(req.nextUrl.searchParams.get("client_id"));
  if (!client) return error("invalid_client", "Unknown client.", 401);

  const claims = verifyToken(bearerToken(req), client.secret);
  if (!claims || claims.aud !== client.id) {
    return error("invalid_token", "The access token is missing, invalid or expired.", 401);
  }

  const user = await getAccountById(Number(claims.sub));
  if (!user.ok) {
    return user.reason === "unavailable"
      ? error("temporarily_unavailable", "The account service is unavailable.", 503)
      : error("invalid_token", "The account no longer exists.", 401);
  }

  const subscribed = await isSubscribed(user.value.id);
  if (subscribed === null) return error("temporarily_unavailable", "The account service is unavailable.", 503);

  return json({ sub: String(user.value.id), name: user.value.name, email: user.value.email, subscribed });
}
