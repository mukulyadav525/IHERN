import { isConfigured, query } from "./db";

/**
 * Which admin areas an IHERN account can open, for the links in the account
 * menu. Only a convenience: each admin area still checks for itself (the
 * blog admin its editor list, the membership admin its own sign-in).
 *
 *   blog editor        the email is in cdnm.blog_editors
 *   membership admin   an active ihern2024.adminlogin row has the email
 *
 * A database that is not configured or not reachable reads as "no".
 */

export async function isBlogEditor(email: string): Promise<boolean> {
  if (!isConfigured("cdnm")) return false;
  const rows = await query("cdnm", "SELECT 1 FROM blog_editors WHERE LOWER(email) = ? LIMIT 1", [email.toLowerCase()]);
  return Boolean(rows?.length);
}

export async function isMembershipAdmin(email: string): Promise<boolean> {
  if (!isConfigured("ihern2024")) return false;
  const rows = await query("ihern2024", "SELECT 1 FROM adminlogin WHERE LOWER(adEmail) = ? AND userStatus = 'Y' LIMIT 1", [email.toLowerCase()]);
  return Boolean(rows?.length);
}
