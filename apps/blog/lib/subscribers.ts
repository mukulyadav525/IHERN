import { query, execute, isConfigured } from "@ihern/core/db";

/**
 * The blog's subscribers, for the blog admins (Subscribers): who is
 * subscribed, who unsubscribed, and who could be asked to subscribe -
 *
 *   IHERN accounts that have never subscribed, and
 *   active IHERN members (ihern2024, when the blog can read it) whose address
 *   has no subscription at all.
 *
 * Someone who unsubscribed is never asked again: that was their choice.
 * Reminders are recorded in cdnm.blog_nudges; a bulk reminder leaves out
 * anyone reminded in the last NUDGE_DAYS days.
 */

export const NUDGE_DAYS = 30;
export const SUBSCRIBERS_PAGE = 100;

export type Subscriber = { name: string; email: string; since: string; source: string };
export type Prospect = { name: string; email: string; kind: "account" | "member"; nudgedAt: string | null; nudges: number };

const str = (v: unknown) => (v == null ? "" : String(v));
const like = (q: string) => `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;

/** Subscribed (active) or unsubscribed accounts, latest change first. */
export async function listSubscribers(status: "active" | "unsubscribed", q = ""): Promise<Subscriber[] | null> {
  const params: string[] = [status];
  let search = "";
  if (q.trim()) {
    search = "AND (s.name LIKE ? OR s.email LIKE ?)";
    params.push(like(q.trim()), like(q.trim()));
  }
  const rows = await query<Record<string, unknown>>(
    "cdnm",
    `SELECT s.name, s.email, b.source, DATE_FORMAT(b.updated_at, '%Y-%m-%d %H:%i') AS since
       FROM blog_subscribers s JOIN blog_subscriptions b ON b.subscriber_id = s.id
      WHERE b.status = ? ${search}
      ORDER BY b.updated_at DESC, s.id DESC`,
    params
  );
  return rows === null ? null : rows.map((r) => ({ name: str(r.name), email: str(r.email), since: str(r.since), source: str(r.source) }));
}

/** Everyone who could be asked to subscribe (see above), with their last reminder. */
export async function listProspects(q = ""): Promise<Prospect[] | null> {
  const [accounts, anySub, nudges] = await Promise.all([
    query<{ name: string; email: string }>(
      "cdnm",
      "SELECT s.name, s.email FROM blog_subscribers s LEFT JOIN blog_subscriptions b ON b.subscriber_id = s.id WHERE b.id IS NULL ORDER BY s.id DESC"
    ),
    query<{ email: string }>("cdnm", "SELECT LOWER(s.email) AS email FROM blog_subscribers s JOIN blog_subscriptions b ON b.subscriber_id = s.id"),
    query<{ email: string; sent_at: string; count: number }>("cdnm", "SELECT LOWER(email) AS email, DATE_FORMAT(sent_at, '%Y-%m-%d %H:%i') AS sent_at, count FROM blog_nudges"),
  ]);
  if (accounts === null || anySub === null || nudges === null) return null;
  // Members: only when the blog can read the membership database.
  const members = isConfigured("ihern2024")
    ? await query<{ studentName: string; studentEmail: string }>("ihern2024", "SELECT studentName, studentEmail FROM studentregistration WHERE userStatus = 'Y' ORDER BY studentID DESC")
    : [];

  const subscribed = new Set(anySub.map((r) => str(r.email)));
  const nudged = new Map(nudges.map((n) => [str(n.email), n]));
  const out = new Map<string, Prospect>();
  const add = (name: string, email: string, kind: Prospect["kind"]) => {
    const key = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key) || subscribed.has(key)) return;
    const prev = out.get(key);
    if (prev) {
      // An account that is also a member reads as a member.
      if (kind === "member") prev.kind = "member";
      return;
    }
    const n = nudged.get(key);
    out.set(key, { name: name.trim(), email: email.trim(), kind, nudgedAt: n ? str(n.sent_at) : null, nudges: n ? Number(n.count) : 0 });
  };
  for (const a of accounts) add(str(a.name), str(a.email), "account");
  for (const m of members ?? []) add(str(m.studentName), str(m.studentEmail), "member");

  let list = [...out.values()];
  const needle = q.trim().toLowerCase();
  if (needle) list = list.filter((p) => p.name.toLowerCase().includes(needle) || p.email.toLowerCase().includes(needle));
  return list;
}

/** Was this address reminded within the last NUDGE_DAYS days? */
export function recentlyNudged(p: Prospect, now = Date.now()): boolean {
  if (!p.nudgedAt) return false;
  const at = Date.parse(p.nudgedAt.replace(" ", "T") + ":00+05:30");
  return Number.isFinite(at) && now - at < NUDGE_DAYS * 24 * 3600 * 1000;
}

export async function recordNudges(emails: string[], by: string): Promise<void> {
  for (let i = 0; i < emails.length; i += 200) {
    const group = emails.slice(i, i + 200);
    await execute(
      "cdnm",
      `INSERT INTO blog_nudges (email, sent_at, sent_by, count) VALUES ${group.map(() => "(?, NOW(), ?, 1)").join(", ")}
       ON DUPLICATE KEY UPDATE sent_at = NOW(), sent_by = VALUES(sent_by), count = count + 1`,
      group.flatMap((e) => [e.toLowerCase().slice(0, 190), by])
    );
  }
}

export async function subscriberCounts(): Promise<{ active: number; unsubscribed: number } | null> {
  const rows = await query<{ status: string; n: number }>("cdnm", "SELECT status, COUNT(*) AS n FROM blog_subscriptions GROUP BY status");
  if (rows === null) return null;
  const n = (s: string) => Number(rows.find((r) => r.status === s)?.n ?? 0);
  return { active: n("active"), unsubscribed: n("unsubscribed") };
}
