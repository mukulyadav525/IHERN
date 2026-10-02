import { NextRequest } from "next/server";
import { getAccountById, isSubscribed } from "@ihern/core/store";
import { consumeCode, equalStrings, error, getClient, issueToken, json, TOKEN_TTL } from "@/lib/sso";

/**
 * IHERN SSO - token endpoint, served at /sso-token.php (port of sso-token.php).
 * Server-to-server only.
 *
 *   POST grant_type=authorization_code, code, client_id, client_secret, redirect_uri
 *   200  { access_token, id_token, token_type, expires_in, user{…} }
 *
 * No password crosses this boundary: the blog receives an identity assertion
 * about the user, not their credentials.
 */

export const dynamic = "force-dynamic";

export function GET() {
  return error("invalid_request", "POST required.", 405);
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return error("invalid_request", "A form-encoded body is required.");
  }
  const field = (k: string) => String(form.get(k) ?? "");

  if (field("grant_type") !== "authorization_code") {
    return error("unsupported_grant_type", "Only authorization_code is supported.");
  }

  const clientId = field("client_id");
  const client = getClient(clientId);
  if (!client || !equalStrings(client.secret, field("client_secret"))) {
    return error("invalid_client", "Client authentication failed.", 401);
  }

  const code = field("code");
  const redirectUri = field("redirect_uri");
  if (!code || !redirectUri) {
    return error("invalid_request", "code and redirect_uri are required.");
  }

  const row = await consumeCode(code, clientId, redirectUri);
  if (row === "error") {
    return error("temporarily_unavailable", "The account service is unavailable.", 503);
  }
  if (!row) {
    return error("invalid_grant", "The authorization code is invalid, expired or already used.");
  }

  const user = await getAccountById(row.subscriberId);
  if (!user.ok) {
    return user.reason === "unavailable"
      ? error("temporarily_unavailable", "The account service is unavailable.", 503)
      : error("invalid_grant", "The account no longer exists.");
  }

  const now = Math.floor(Date.now() / 1000);
  const subscribed = (await isSubscribed(user.value.id)) === true;
  const claims: Record<string, unknown> = {
    iss: "ihern",
    sub: String(user.value.id),
    aud: clientId,
    email: user.value.email,
    name: user.value.name,
    subscribed,
    iat: now,
    exp: now + TOKEN_TTL,
  };
  if (row.nonce) claims.nonce = row.nonce;

  const token = issueToken(claims, client.secret);
  return json({
    access_token: token,
    id_token: token,
    token_type: "Bearer",
    expires_in: TOKEN_TTL,
    user: { id: user.value.id, name: user.value.name, email: user.value.email, subscribed },
  });
}
