import { headers } from "next/headers";

/**
 * The visitor's IP address, for rate limits only (never stored).
 *
 * Behind Apache (deploy/apache.conf), the proxy appends the address it saw to
 * X-Forwarded-For; earlier entries come from the client and can be made up.
 * So: the right-most public address in the chain, else the left-most entry
 * (a visitor on the campus network), else "unknown".
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const chain = (h.get("x-forwarded-for") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const isPrivate = (ip: string) => /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd|fe80:)/i.test(ip.replace(/^::ffff:/, ""));
  for (let i = chain.length - 1; i >= 0; i--) if (!isPrivate(chain[i])) return chain[i];
  return chain[0] || h.get("x-real-ip") || "unknown";
}

/**
 * True while this request is the page's own form being submitted (a server
 * action, with or without JavaScript), rather than the page being opened.
 *
 * Pages that send signed-in visitors elsewhere (sign-in pages) must not do it
 * then: since Next 15 the action's new session cookie is already visible to
 * that render, and a redirect from it is a 307 - the browser would re-send the
 * form to the next page.
 */
export async function isFormSubmission(): Promise<boolean> {
  const h = await headers();
  return h.has("next-action") || Boolean(h.get("content-type"));
}
