import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { revalidateTag } from "next/cache";
import { BLOG_CONTENT_TAG } from "@ihern/core/cached";
import { equalStrings, error, getClient, json } from "@/lib/sso";

/**
 * The blog says its content changed (a post published, edited or removed), so
 * the Blogs page here shows it at once instead of within a minute (the cache
 * in lib/cached.ts). Server-to-server only.
 *
 *   POST client_id, ts, sig      sig = HMAC-SHA256("blog-changed|ts", client secret)
 *
 * All it can do is make this site re-read the blog's posts.
 */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return error("invalid_request", "A form-encoded body is required.");
  }
  const client = getClient(String(form.get("client_id") ?? ""));
  if (!client) return error("invalid_client", "Unknown client.", 401);
  const ts = Number.parseInt(String(form.get("ts") ?? ""), 10) || 0;
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) return error("invalid_request", "Stale request.");
  const expected = createHmac("sha256", client.secret).update(`blog-changed|${ts}`).digest("hex");
  if (!equalStrings(expected, String(form.get("sig") ?? ""))) return error("invalid_client", "Bad signature.", 403);
  revalidateTag(BLOG_CONTENT_TAG);
  return json({ ok: true });
}
