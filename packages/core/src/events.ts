/**
 * IHERN events (cdnm.ihern_events): what an event is and how it reads - the
 * date, the time, the venue. Safe to import from client components (no
 * database access here; that is apps/main/lib/events.ts).
 *
 * Times are India time (IST), stored as "YYYY-MM-DD HH:MM:SS" with no zone,
 * like the blog's dates.
 */

export type EventMode = "online" | "in-person" | "hybrid";
export type EventStatus = "draft" | "published" | "trash";
export type EventLink = { label: string; url: string };

export type IhernEvent = {
  id: number;
  tag: string;
  title: string;
  description: string;
  speakers: string;
  startsAt: string | null;
  endsAt: string | null;
  venue: string;
  mode: EventMode;
  joinUrl: string;
  joinLabel: string;
  links: EventLink[];
  status: EventStatus;
  publishedAt: string | null;
  createdBy: string;
  updatedAt: string;
  notifiedAt: string | null;
  notifyTotal: number | null;
  notifySent: number;
};

export const MODES: { value: EventMode; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "in-person", label: "In person" },
  { value: "hybrid", label: "In person and online" },
];

/** The current time in India, in the stored format. */
export function nowIst(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 19).replace("T", " ");
}

/** Upcoming until it ends (or, with no end time, until the end of its day). */
export function isUpcoming(ev: Pick<IhernEvent, "startsAt" | "endsAt">, now = nowIst()): boolean {
  if (!ev.startsAt) return true;
  const end = ev.endsAt || `${ev.startsAt.slice(0, 10)} 23:59:59`;
  return end >= now;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parts(dt: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(dt);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return { y, mo, d, h: m[4] === undefined ? null : Number(m[4]), mi: m[5] === undefined ? 0 : Number(m[5]), dow: new Date(Date.UTC(y, mo - 1, d)).getUTCDay() };
}

/** "Monday, 21 September 2026" */
export function eventDate(dt: string | null): string {
  const p = dt ? parts(dt) : null;
  return p ? `${DAYS[p.dow]}, ${p.d} ${MONTHS[p.mo - 1]} ${p.y}` : "";
}

/** "10:30 AM" */
function clock(h: number, mi: number): string {
  return `${h % 12 || 12}:${String(mi).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "10:30 AM IST", "10:30 AM - 12:00 PM IST", or with an end on another day, that day too. */
export function eventTime(start: string | null, end: string | null): string {
  const s = start ? parts(start) : null;
  if (!s || s.h === null) return "";
  const e = end ? parts(end) : null;
  if (!e || e.h === null) return `${clock(s.h, s.mi)} IST`;
  const sameDay = start!.slice(0, 10) === end!.slice(0, 10);
  return sameDay ? `${clock(s.h, s.mi)} - ${clock(e.h, e.mi)} IST` : `${clock(s.h, s.mi)} IST - ${eventDate(end)}, ${clock(e.h, e.mi)} IST`;
}

/** "Online (Zoom)", "IIT Delhi", "IIT Delhi and online" */
export function eventVenue(ev: Pick<IhernEvent, "mode" | "venue">): string {
  const v = ev.venue.trim();
  if (ev.mode === "online") return v ? `Online (${v})` : "Online";
  if (ev.mode === "hybrid") return v ? `${v} and online` : "In person and online";
  return v || "In person";
}

/** The speakers, one per line. */
export function speakerLines(speakers: string): string[] {
  return speakers.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

/** What kind of file or page a link is, shown after its label: "(PDF)", "(Google Form)". */
export function linkNote(url: string): string {
  if (/\.pdf($|[?#])/i.test(url)) return "PDF";
  if (/^https?:\/\/(docs\.google\.com\/forms|forms\.gle)\//i.test(url)) return "Google Form";
  return "";
}

/** A description's paragraphs: blank lines separate them. */
export function paragraphs(text: string): string[] {
  return text.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
}
