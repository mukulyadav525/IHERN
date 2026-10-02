import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { activeSubscribers } from "@ihern/core/store";
import { sendNewPostNotifications } from "@ihern/core/mail";
import { equalStrings, error, getClient, json } from "@/lib/sso";

/**
 * IHERN SSO - new-post notification, served at /sso-notify.php (port of
 * sso-notify.php). Server-to-server only.
 *
 *   POST client_id, post_id, title, url, ts, sig
 *   sig = HMAC-SHA256("post|post_id|ts|url|title", client secret)
 *
 * The blog calls this once when a post is first published; every active
 * subscriber is emailed a link to it. The link must be on the blog's own host,
 * so this cannot be used to mail anything else.
 */

export const dynamic = "force-dynamic";

export function GET() {
  return error("invalid_request", "POST only.", 405);
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return error("invalid_request", "A form-encoded body is required.");
  }
  const field = (k: string) => String(form.get(k) ?? "");

  const client = getClient(field("client_id"));
  if (!client) return error("invalid_client", "Unknown client.", 401);

  const postId = field("post_id");
  const title = field("title");
  const url = field("url");
  const ts = Number.parseInt(field("ts"), 10) || 0;
  const sig = field("sig");

  if (!/^\d+$/.test(postId) || !title || Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) {
    return error("invalid_request", "Missing or stale parameters.");
  }
  const expected = createHmac("sha256", client.secret).update(`post|${postId}|${ts}|${url}|${title}`).digest("hex");
  if (!equalStrings(expected, sig)) return error("invalid_client", "Bad signature.", 403);

  let blogHost = "";
  let target: URL | null = null;
  try {
    blogHost = new URL(client.backchannelLogoutUri).hostname.toLowerCase();
    target = new URL(url);
  } catch {
    /* handled below */
  }
  if (!blogHost || !target || !["http:", "https:"].includes(target.protocol) || target.hostname.toLowerCase() !== blogHost) {
    return error("invalid_request", "The post URL must be on the blog.");
  }

  const subscribers = await activeSubscribers();
  if (subscribers === null) return error("temporarily_unavailable", "The account service is unavailable.", 503);

  const sent = await sendNewPostNotifications(subscribers, title, url);
  return json({ sent });
}
