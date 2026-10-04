import { isConfigured, query } from "./db";

/**
 * Which admin areas an IHERN account can open, for the links in the account
 * menu. Only a convenience: each admin area still checks for itself (the
 * blog admin its editor list, the membership admin its own sign-in).
 *
 *   blog editor        the email is in cdnm.blog_editors
 *   membership admin   an active ihern2024.adminlogin row has the email
 *   events admin       the email is in cdnm.event_editors, or is a membership admin
 *
 * A database that is not configured or not reachable reads as "no".
 */

export async function isBlogEditor(email: string): Promise<boolean> {
  if (!isConfigured("cdnm")) return false;
  const rows = await query("cdnm", "SELECT 1 FROM blog_editors WHERE LOWER(email) = ? AND active = 1 LIMIT 1", [email.toLowerCase()]);
  return Boolean(rows?.length);
}

export async function isMembershipAdmin(email: string): Promise<boolean> {
  if (!isConfigured("ihern2024")) return false;
  const rows = await query("ihern2024", "SELECT 1 FROM adminlogin WHERE LOWER(adEmail) = ? AND userStatus = 'Y' LIMIT 1", [email.toLowerCase()]);
  return Boolean(rows?.length);
}

export async function isEventEditor(email: string): Promise<boolean> {
  if (isConfigured("cdnm")) {
    const rows = await query("cdnm", "SELECT 1 FROM event_editors WHERE LOWER(email) = ? AND active = 1 LIMIT 1", [email.toLowerCase()]);
    if (rows?.length) return true;
  }
  return isMembershipAdmin(email);
}

/** An IHERN member (a registration with this email): for "My membership" in the account menu. */
export async function isMember(email: string): Promise<boolean> {
  if (!isConfigured("ihern2024")) return false;
  const rows = await query("ihern2024", "SELECT 1 FROM studentregistration WHERE LOWER(studentEmail) = ? LIMIT 1", [email.toLowerCase()]);
  return Boolean(rows?.length);
}

/**
 * Admin access of any kind (blog, events, membership) is given only to IHERN
 * members: an active registration with this email. "unavailable" when the
 * membership database cannot be read, so access is not given blindly.
 */
export async function activeMember(email: string): Promise<{ name: string } | null | "unavailable"> {
  if (!isConfigured("ihern2024")) return "unavailable";
  const rows = await query<{ studentName: string }>(
    "ihern2024",
    "SELECT studentName FROM studentregistration WHERE LOWER(TRIM(studentEmail)) = ? AND userStatus = 'Y' LIMIT 1",
    [email.trim().toLowerCase()]
  );
  if (rows === null) return "unavailable";
  return rows[0] ? { name: String(rows[0].studentName ?? "") } : null;
}

/** The refusal shown when someone who is not a member is given admin access. */
export const NOT_A_MEMBER = "Admin access is only for IHERN members, and this email address has no active IHERN membership. They can join at Join IHERN first.";
export const MEMBERSHIP_UNREADABLE = "The membership list could not be checked just now, so access was not given. Please try again shortly.";
