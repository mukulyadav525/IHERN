import { NextRequest } from "next/server";
import { getAccountById, isSubscribed, setSubscribed } from "@ihern/core/store";
import { bearerToken, error, getClient, json, verifyToken } from "@/lib/sso";

/**
 * IHERN SSO - blog subscription endpoint, served at /sso-subscription.php
 * (port of sso-subscription.php). Server-to-server only.
 *
 *   GET  ?client_id=ihern-blog                          -> read
 *   POST client_id=…&action=subscribe|unsubscribe       -> change
 *   Authorization: Bearer <access_token>
 *   200 { subscribed, email }
 *
 * The subscription belongs to the IHERN account; the blog never asks the
 * reader for an email address.
 */

export const dynamic = "force-dynamic";

async function handle(req: NextRequest, clientId: string, action: string | null) {
  const client = getClient(clientId);
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

  if (action !== null) {
    if (action !== "subscribe" && action !== "unsubscribe") {
      return error("invalid_request", "action must be subscribe or unsubscribe.");
    }
    const res = await setSubscribed(user.value.id, action === "subscribe", "blog");
    if (!res.ok) return error("server_error", "Could not update the subscription.", 500);
  }

  const subscribed = await isSubscribed(user.value.id);
  if (subscribed === null) return error("server_error", "Could not update the subscription.", 500);
  return json({ subscribed, email: user.value.email });
}

export async function GET(req: NextRequest) {
  return handle(req, req.nextUrl.searchParams.get("client_id") ?? "", null);
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return error("invalid_request", "A form-encoded body is required.");
  }
  return handle(req, String(form.get("client_id") ?? ""), String(form.get("action") ?? ""));
}
