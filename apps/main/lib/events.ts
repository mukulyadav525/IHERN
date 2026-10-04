import { randomBytes } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { query, execute } from "@ihern/core/db";
import { cached, EVENTS_TAG } from "@ihern/core/cached";
import { isUpcoming, nowIst, type EventLink, type EventMode, type EventStatus, type IhernEvent } from "@ihern/core/events";
import { uploadDir } from "./membership";

/**
 * IHERN events (cdnm.ihern_events): the home page's Events section and the
 * Events page, managed in the events admin (/events/admin). The shapes and
 * formatting are in @ihern/core/events.
 */

type Row = Record<string, unknown>;

function parseLinks(v: unknown): EventLink[] {
  try {
    const list = JSON.parse(String(v ?? "[]"));
    return Array.isArray(list)
      ? list.filter((l) => l && typeof l.url === "string" && l.url).map((l) => ({ label: String(l.label ?? "").trim() || "Link", url: String(l.url) }))
      : [];
  } catch {
    return [];
  }
}

const str = (v: unknown) => (v == null ? "" : String(v));
const date = (v: unknown) => (v == null ? null : String(v).slice(0, 19));

function toEvent(r: Row): IhernEvent {
  return {
    id: Number(r.id),
    tag: str(r.tag),
    title: str(r.title),
    description: str(r.description),
    speakers: str(r.speakers),
    startsAt: date(r.starts_at),
    endsAt: date(r.ends_at),
    venue: str(r.venue),
    mode: (["online", "in-person", "hybrid"].includes(str(r.mode)) ? r.mode : "online") as EventMode,
    joinUrl: str(r.join_url),
    joinLabel: str(r.join_label),
    links: parseLinks(r.links),
    status: (["draft", "published", "trash"].includes(str(r.status)) ? r.status : "draft") as EventStatus,
    publishedAt: date(r.published_at),
    createdBy: str(r.created_by),
    updatedAt: str(r.updated_at),
    notifiedAt: date(r.notified_at),
    notifyTotal: r.notify_total == null ? null : Number(r.notify_total),
    notifySent: Number(r.notify_sent ?? 0),
  };
}

// DATE_FORMAT keeps dates as plain text: no time-zone conversion on the way out.
const COLUMNS = `id, tag, title, description, speakers, venue, mode, join_url, join_label, links, status, created_by,
  notify_total, notify_sent,
  DATE_FORMAT(starts_at, '%Y-%m-%d %H:%i:%s') AS starts_at, DATE_FORMAT(ends_at, '%Y-%m-%d %H:%i:%s') AS ends_at,
  DATE_FORMAT(published_at, '%Y-%m-%d %H:%i:%s') AS published_at, DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
  DATE_FORMAT(notified_at, '%Y-%m-%d %H:%i:%s') AS notified_at`;

/* ---------------- the website ---------------- */

/** Published events: upcoming soonest first, then past events latest first. */
async function readPublished(): Promise<{ upcoming: IhernEvent[]; past: IhernEvent[] } | null> {
  const rows = await query<Row>("cdnm", `SELECT ${COLUMNS} FROM ihern_events WHERE status = 'published' ORDER BY starts_at DESC, id DESC`);
  if (rows === null) return null;
  const all = rows.map(toEvent);
  const now = nowIst();
  return { upcoming: all.filter((e) => isUpcoming(e, now)).reverse(), past: all.filter((e) => !isUpcoming(e, now)) };
}

/** Shared between visitors; cleared at once by any change in the events admin. */
export const publishedEvents = cached("publishedEvents", readPublished, { tag: EVENTS_TAG, seconds: 300 });

/* ---------------- the events admin ---------------- */

export type EventFilter = "upcoming" | "past" | "draft" | "trash" | "all";

export async function eventCounts(): Promise<Record<EventFilter, number> | null> {
  const rows = await query<Row>(
    "cdnm",
    `SELECT status, (starts_at IS NULL OR COALESCE(ends_at, CONCAT(DATE(starts_at), ' 23:59:59')) >= ?) AS upcoming, COUNT(*) AS n
       FROM ihern_events GROUP BY status, upcoming`,
    [nowIst()]
  );
  if (rows === null) return null;
  const c: Record<EventFilter, number> = { upcoming: 0, past: 0, draft: 0, trash: 0, all: 0 };
  for (const r of rows) {
    const n = Number(r.n);
    if (r.status === "trash") c.trash += n;
    else {
      c.all += n;
      if (r.status === "draft") c.draft += n;
      else if (Number(r.upcoming)) c.upcoming += n;
      else c.past += n;
    }
  }
  return c;
}

/** The admin's list: everything but the trash (or one part of it), searchable. */
export async function listEvents(filter: EventFilter, q = ""): Promise<IhernEvent[] | null> {
  const where: string[] = [];
  const params: string[] = [];
  const upcoming = "(starts_at IS NULL OR COALESCE(ends_at, CONCAT(DATE(starts_at), ' 23:59:59')) >= ?)";
  if (filter === "trash") where.push("status = 'trash'");
  else where.push("status <> 'trash'");
  if (filter === "draft") where.push("status = 'draft'");
  if (filter === "upcoming" || filter === "past") {
    where.push("status = 'published'", filter === "upcoming" ? upcoming : `NOT ${upcoming}`);
    params.push(nowIst());
  }
  if (q.trim()) {
    const like = `%${q.trim().replace(/[\\%_]/g, (c) => "\\" + c)}%`;
    where.push("(title LIKE ? OR tag LIKE ? OR description LIKE ? OR speakers LIKE ? OR venue LIKE ?)");
    params.push(like, like, like, like, like);
  }
  const order = filter === "upcoming" ? "starts_at IS NULL, starts_at ASC" : "starts_at IS NULL DESC, starts_at DESC";
  const rows = await query<Row>("cdnm", `SELECT ${COLUMNS} FROM ihern_events WHERE ${where.join(" AND ")} ORDER BY ${order}, id DESC LIMIT 500`, params);
  return rows === null ? null : rows.map(toEvent);
}

export async function getEvent(id: number): Promise<IhernEvent | null | "error"> {
  const rows = await query<Row>("cdnm", `SELECT ${COLUMNS} FROM ihern_events WHERE id = ?`, [id]);
  if (rows === null) return "error";
  return rows[0] ? toEvent(rows[0]) : null;
}

export type EventInput = Pick<IhernEvent, "tag" | "title" | "description" | "speakers" | "startsAt" | "endsAt" | "venue" | "mode" | "joinUrl" | "joinLabel" | "links" | "status">;

/** Adds (id null) or updates an event; returns its id. The first publish is dated. */
export async function saveEvent(id: number | null, e: EventInput, by: string): Promise<number | null> {
  const values = [e.tag, e.title, e.description, e.speakers, e.startsAt, e.endsAt, e.venue, e.mode, e.joinUrl, e.joinLabel, JSON.stringify(e.links), e.status];
  if (id === null) {
    const res = await execute(
      "cdnm",
      `INSERT INTO ihern_events (tag, title, description, speakers, starts_at, ends_at, venue, mode, join_url, join_label, links, status, published_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${e.status === "published" ? "NOW()" : "NULL"}, ?)`,
      [...values, by]
    );
    return res === null ? null : Number(res.insertId);
  }
  const res = await execute(
    "cdnm",
    `UPDATE ihern_events SET tag = ?, title = ?, description = ?, speakers = ?, starts_at = ?, ends_at = ?, venue = ?, mode = ?,
       join_url = ?, join_label = ?, links = ?, status = ?, published_at = IF(? = 'published', COALESCE(published_at, NOW()), published_at)
     WHERE id = ?`,
    [...values, e.status, id]
  );
  return res === null || res.affectedRows === 0 ? null : id;
}

export async function setEventStatus(id: number, status: EventStatus): Promise<boolean> {
  const res = await execute(
    "cdnm",
    "UPDATE ihern_events SET status = ?, published_at = IF(? = 'published', COALESCE(published_at, NOW()), published_at) WHERE id = ?",
    [status, status, id]
  );
  return res !== null && res.affectedRows > 0;
}

/** Deletes an event in the trash, and the files it alone used. */
export async function deleteEvent(id: number): Promise<boolean> {
  const ev = await getEvent(id);
  if (!ev || ev === "error" || ev.status !== "trash") return false;
  const res = await execute("cdnm", "DELETE FROM ihern_events WHERE id = ? AND status = 'trash'", [id]);
  if (res === null || res.affectedRows === 0) return false;
  for (const l of ev.links) {
    const name = eventFileName(l.url);
    if (name && !(await fileStillUsed(l.url))) await removeEventFile(name);
  }
  return true;
}

/** A copy, as a draft: for the next session of a series. */
export async function duplicateEvent(id: number, by: string): Promise<number | null> {
  const ev = await getEvent(id);
  if (!ev || ev === "error") return null;
  return saveEvent(null, { ...ev, title: `${ev.title} (copy)`.slice(0, 300), status: "draft" }, by);
}

/**
 * Claims an event's one email to all members: true for exactly one caller,
 * and only while the event is published and not yet announced.
 */
export async function claimAnnouncement(id: number, total: number): Promise<boolean> {
  const res = await execute(
    "cdnm",
    "UPDATE ihern_events SET notified_at = NOW(), notify_total = ?, notify_sent = 0 WHERE id = ? AND status = 'published' AND notified_at IS NULL",
    [total, id]
  );
  return res !== null && res.affectedRows > 0;
}

export async function recordAnnouncementProgress(id: number, sent: number): Promise<void> {
  await execute("cdnm", "UPDATE ihern_events SET notify_sent = ? WHERE id = ?", [sent, id]);
}

/** Active members, for the email about a new event. */
export async function activeMembers(): Promise<{ name: string; email: string }[] | null> {
  const rows = await query<{ studentName: string; studentEmail: string }>(
    "ihern2024",
    "SELECT studentName, studentEmail FROM studentregistration WHERE userStatus = 'Y' ORDER BY studentID"
  );
  if (rows === null) return null;
  // One message per address, even if two registrations share it.
  const seen = new Set<string>();
  return rows
    .map((r) => ({ name: str(r.studentName), email: str(r.studentEmail).trim() }))
    .filter((r) => {
      const k = r.email.toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

/* ---------------- who may use the events admin ---------------- */

export type EventEditor = { id: number; email: string; role: "admin" | "editor"; active: boolean; createdAt: string };
const toEditor = (r: Row): EventEditor => ({ id: Number(r.id), email: str(r.email), role: r.role === "admin" ? "admin" : "editor", active: Number(r.active) === 1, createdAt: str(r.created_at) });

/** The active editor with this email (a deactivated one reads as none). */
export async function getEventEditor(email: string): Promise<EventEditor | null | "error"> {
  const rows = await query<Row>("cdnm", "SELECT id, email, role, active, created_at FROM event_editors WHERE LOWER(email) = ? AND active = 1 LIMIT 1", [email.toLowerCase()]);
  if (rows === null) return "error";
  return rows[0] ? toEditor(rows[0]) : null;
}

/** Everyone on the list, deactivated editors included. */
export async function listEventEditors(): Promise<EventEditor[] | null> {
  const rows = await query<Row>("cdnm", "SELECT id, email, role, active, created_at FROM event_editors ORDER BY active DESC, role, email");
  return rows === null ? null : rows.map(toEditor);
}

/** "added" (new to the list), "updated" (already on it), or null on failure. */
export async function addEventEditor(email: string, role: "admin" | "editor"): Promise<"added" | "updated" | null> {
  const res = await execute("cdnm", "INSERT INTO event_editors (email, role) VALUES (?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role), active = 1", [email.toLowerCase(), role]);
  return res === null ? null : res.affectedRows === 1 ? "added" : "updated";
}

export async function setEventEditorActive(id: number, active: boolean): Promise<boolean> {
  const res = await execute("cdnm", "UPDATE event_editors SET active = ? WHERE id = ?", [active ? 1 : 0, id]);
  return res !== null && res.affectedRows > 0;
}

export async function removeEventEditor(id: number): Promise<boolean> {
  const res = await execute("cdnm", "DELETE FROM event_editors WHERE id = ?", [id]);
  return res !== null && res.affectedRows > 0;
}

/* ---------------- files (posters, programmes) ---------------- */

/** Where event files are kept: IHERN_EVENT_UPLOAD_DIR, or "events" next to the member photographs. */
export function eventUploadDir(): string {
  return process.env.IHERN_EVENT_UPLOAD_DIR || path.join(path.dirname(uploadDir()), "events");
}

export const EVENT_FILE_MAX = 10 * 1024 * 1024;
export const EVENT_FILE_TYPES = { pdf: "application/pdf", jpg: "image/jpeg", png: "image/png" } as const;
export type EventFileType = keyof typeof EVENT_FILE_TYPES;
const FILE_PATH = "/events/files/";

/** PDF, JPEG or PNG, from the file's own bytes. */
export function eventFileType(b: Uint8Array): EventFileType | null {
  if (b.length > 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "pdf";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  return null;
}

/** Stores the file under a generated name (from the original's, made safe); returns its link, or null. */
export async function storeEventFile(bytes: Uint8Array, ext: EventFileType, original: string): Promise<string | null> {
  const stem = original.replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";
  const name = `${stem}-${randomBytes(4).toString("hex")}.${ext}`;
  try {
    await mkdir(eventUploadDir(), { recursive: true });
    await writeFile(path.join(eventUploadDir(), name), bytes);
    return FILE_PATH + name;
  } catch (e) {
    console.error("[events] could not store a file:", (e as Error).message);
    return null;
  }
}

/** The stored file a link points at ("/events/files/<name>"), else null. */
export function eventFileName(url: string): string | null {
  if (!url.startsWith(FILE_PATH)) return null;
  const name = url.slice(FILE_PATH.length);
  return /^[A-Za-z0-9-]+\.(pdf|jpg|png)$/.test(name) ? name : null;
}

export async function readEventFile(name: string): Promise<{ bytes: Buffer; type: string } | null> {
  if (!/^[A-Za-z0-9-]+\.(pdf|jpg|png)$/.test(name)) return null;
  try {
    const bytes = await readFile(path.join(eventUploadDir(), name));
    return { bytes, type: EVENT_FILE_TYPES[name.split(".").pop() as EventFileType] };
  } catch {
    return null;
  }
}

async function fileStillUsed(url: string): Promise<boolean> {
  const rows = await query("cdnm", "SELECT 1 FROM ihern_events WHERE links LIKE ? LIMIT 1", [`%${JSON.stringify(url).slice(1, -1).replace(/[\\%_]/g, (c) => "\\" + c)}%`]);
  return rows === null || rows.length > 0;
}

export async function removeEventFile(name: string): Promise<void> {
  try {
    await unlink(path.join(eventUploadDir(), path.basename(name)));
  } catch {
    /* already gone */
  }
}
