/** Small text helpers shared by both sites. Safe in server and client code. */

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", ndash: "–", mdash: "—",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", laquo: "«", raquo: "»", middot: "·", copy: "©", reg: "®", trade: "™",
};

/** Decodes HTML entities (named, decimal and hex). */
export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
}

/** HTML to plain text: tags removed, entities decoded, whitespace collapsed. */
export function plainText(html: string | null | undefined): string {
  return decodeEntities(
    String(html ?? "")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<\/(p|div|h[1-6]|li|blockquote|figcaption|tr)>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, "")
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** At most `width` characters, ending with "…" when shortened. */
export function strimwidth(s: string, width: number): string {
  const chars = Array.from(s);
  return chars.length <= width ? s : chars.slice(0, width - 1).join("") + "…";
}

/** The first `count` words, ending with "…" when shortened. */
export function trimWords(s: string, count: number): string {
  const words = s.split(/\s+/).filter(Boolean);
  return words.length <= count ? words.join(" ") : words.slice(0, count).join(" ") + "…";
}

/** A URL-safe slug: "Higher Education Policy" -> "higher-education-policy". */
export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&[a-z]+;/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 190) || "item";
}

/** Initials for an avatar: first letters of the first and last words, titles dropped. */
export function initials(name: string, email = ""): string {
  const words = name.trim().replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, "").split(/\s+/).filter(Boolean);
  if (words.length) {
    const first = Array.from(words[0])[0] ?? "";
    const last = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? "" : "";
    return (first + last).toUpperCase();
  }
  return (Array.from(email || "?")[0] ?? "?").toUpperCase();
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-06-29 00:01:52" -> "June 29, 2026" (read as written: site time). */
export function formatDate(dt: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dt ?? "");
  return m ? `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}` : "";
}

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? "";
}

/** "2026-06-29 00:01:52" -> seconds, for sorting. */
export function timestamp(dt: string | null | undefined): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/.exec(dt ?? "");
  if (!m) return 0;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)) / 1000;
}

/**
 * The opening of a post for readers who are not signed in: whole paragraphs,
 * at least two and about 90 words - the rule the WordPress blog used
 * (mu-plugins/ihern-sso/ui.php, teaser()).
 */
export function teaser(html: string): string {
  const paras = String(html).match(/<p\b[^>]*>[\s\S]*?<\/p>/gi);
  if (!paras) return `<p>${escapeHtml(trimWords(plainText(html), 90))}</p>`;
  let out = "";
  let words = 0;
  let count = 0;
  for (const p of paras) {
    out += p + "\n";
    words += plainText(p).split(/\s+/).filter(Boolean).length;
    count++;
    if (count >= 2 && words >= 90) break;
  }
  return out;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
