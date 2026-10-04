import { createHash, randomBytes } from "crypto";
import { query, execute } from "@ihern/core/db";
import { absoluteUrl } from "@ihern/core/env";

/**
 * "Please update your IHERN details" (ihern2024.member_update_requests). The
 * membership admin asks one member, a selection, or every active member; each
 * gets an emailed link that opens their membership details for editing
 * without a password (/membership/update). A link works for 14 days, until it
 * is used, or until a newer request replaces it. Signed-in members can edit
 * their details from My membership at any time, without a request.
 */

export const UPDATE_DAYS = 14;
/** A member asked this recently, who has not responded, is not asked again by a bulk request. */
export const RECENT_DAYS = 7;
export const UPDATE_PATH = "/membership/update";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type UpdateRequest = { requestedAt: string; completedAt: string | null; expiresAt: string; requestedBy: string };

type Target = { studentID: number; studentName: string; studentEmail: string; userStatus: string };

/**
 * Makes the links. `ids` are the chosen members, or "active" for every active
 * member. Inactive members are left out; so, unless `force`, are members asked
 * in the last 7 days who have not responded. Returns the messages to send.
 */
export async function createUpdateRequests(
  ids: number[] | "active",
  by: string,
  force = false
): Promise<{ requests: { name: string; email: string; link: string }[]; inactive: number; recent: number } | null> {
  const members =
    ids === "active"
      ? await query<Target>("ihern2024", "SELECT studentID, studentName, studentEmail, userStatus FROM studentregistration WHERE userStatus = 'Y' ORDER BY studentID")
      : ids.length
        ? await query<Target>("ihern2024", `SELECT studentID, studentName, studentEmail, userStatus FROM studentregistration WHERE studentID IN (${ids.map(() => "?").join(",")})`, ids)
        : [];
  if (members === null) return null;
  const pending = force
    ? []
    : await query<{ studentID: number }>(
        "ihern2024",
        `SELECT studentID FROM member_update_requests WHERE completed_at IS NULL AND expires_at > NOW() AND requested_at > NOW() - INTERVAL ${RECENT_DAYS} DAY`
      );
  if (pending === null) return null;
  const recentSet = new Set(pending.map((r) => Number(r.studentID)));

  let inactive = 0;
  let recent = 0;
  const chosen: (Target & { token: string })[] = [];
  for (const m of members) {
    if (m.userStatus !== "Y") inactive++;
    else if (recentSet.has(Number(m.studentID))) recent++;
    else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(m.studentEmail).trim())) chosen.push({ ...m, token: randomBytes(24).toString("base64url") });
  }

  // In groups of 200 rows: one statement each.
  for (let i = 0; i < chosen.length; i += 200) {
    const group = chosen.slice(i, i + 200);
    const res = await execute(
      "ihern2024",
      `INSERT INTO member_update_requests (studentID, token_hash, requested_by, requested_at, expires_at, completed_at)
       VALUES ${group.map(() => `(?, ?, ?, NOW(), NOW() + INTERVAL ${UPDATE_DAYS} DAY, NULL)`).join(", ")}
       ON DUPLICATE KEY UPDATE token_hash = VALUES(token_hash), requested_by = VALUES(requested_by), requested_at = NOW(),
         expires_at = VALUES(expires_at), completed_at = NULL`,
      group.flatMap((m) => [Number(m.studentID), sha256(m.token), by])
    );
    if (res === null) return null;
  }
  return {
    requests: chosen.map((m) => ({
      name: String(m.studentName ?? ""),
      email: String(m.studentEmail).trim(),
      link: absoluteUrl(`${UPDATE_PATH.slice(1)}?token=${m.token}`),
    })),
    inactive,
    recent,
  };
}

/** The member a live update link is for. */
export async function readUpdateToken(token: string): Promise<number | null | "unavailable"> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const rows = await query<{ studentID: number }>(
    "ihern2024",
    "SELECT studentID FROM member_update_requests WHERE token_hash = ? AND completed_at IS NULL AND expires_at > NOW()",
    [sha256(token)]
  );
  if (rows === null) return "unavailable";
  return rows[0] ? Number(rows[0].studentID) : null;
}

/** When a used link's details were saved (for the page shown when it is opened again), or null. */
export async function usedUpdateToken(token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const rows = await query<{ at: string }>(
    "ihern2024",
    "SELECT DATE_FORMAT(completed_at, '%Y-%m-%d') AS at FROM member_update_requests WHERE token_hash = ? AND completed_at IS NOT NULL",
    [sha256(token)]
  );
  return rows?.[0]?.at ?? null;
}

/** The member has saved their details: the request is done, and its link stops working. */
export async function completeUpdateRequest(studentID: number): Promise<void> {
  await execute("ihern2024", "UPDATE member_update_requests SET completed_at = NOW() WHERE studentID = ? AND completed_at IS NULL", [studentID]);
}

export async function updateRequests(ids: number[]): Promise<Map<number, UpdateRequest>> {
  const map = new Map<number, UpdateRequest>();
  if (!ids.length) return map;
  const rows = await query<Record<string, unknown>>(
    "ihern2024",
    `SELECT studentID, requested_by, DATE_FORMAT(requested_at, '%Y-%m-%d %H:%i') AS requested_at, DATE_FORMAT(completed_at, '%Y-%m-%d %H:%i') AS completed_at,
            DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i') AS expires_at
       FROM member_update_requests WHERE studentID IN (${ids.map(() => "?").join(",")})`,
    ids
  );
  for (const r of rows ?? []) {
    map.set(Number(r.studentID), {
      requestedAt: String(r.requested_at),
      completedAt: r.completed_at ? String(r.completed_at) : null,
      expiresAt: String(r.expires_at),
      requestedBy: String(r.requested_by ?? ""),
    });
  }
  return map;
}
