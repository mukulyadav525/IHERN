import { inflateRawSync } from "zlib";

/**
 * Reads the first worksheet of an Excel file (.xlsx) into rows of text, so a
 * spreadsheet can be imported the same way as a CSV file. Enough of the
 * format for exported lists (shared and inline strings, numbers, booleans);
 * formulas give their saved result, and formatting is ignored. Dates arrive as
 * Excel's day numbers (lib/iherc.ts parseDate reads those).
 *
 * An .xlsx file is a zip of XML files; Node's zlib unpacks it, so no library
 * is needed.
 */

/** The files inside a zip, by name (only the ones asked for are unpacked). */
function unzip(buf: Buffer, wanted: (name: string) => boolean): Map<string, Buffer> {
  // The end-of-central-directory record: in the last 64 KB + 22 bytes.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip file");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Buffer>();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("damaged zip file");
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (!wanted(name)) continue;
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + size);
    if (method === 0) out.set(name, Buffer.from(data));
    else if (method === 8) out.set(name, inflateRawSync(data));
    else throw new Error("unsupported compression");
  }
  return out;
}

const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) => {
    const k = e.toLowerCase();
    if (k === "amp") return "&";
    if (k === "lt") return "<";
    if (k === "gt") return ">";
    if (k === "quot") return '"';
    if (k === "apos") return "'";
    return String.fromCodePoint(k.startsWith("#x") ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
  });

/** The text of every <t> inside a piece of XML (a shared string can be split into runs). */
const texts = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join("");

/** "B" -> 1, "AA" -> 26 */
function column(ref: string): number {
  let n = 0;
  for (const ch of ref.replace(/\d+$/, "").toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function isXlsx(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

export function readXlsx(bytes: Uint8Array): string[][] {
  const buf = Buffer.from(bytes);
  const files = unzip(buf, (n) => n === "xl/workbook.xml" || n === "xl/_rels/workbook.xml.rels" || n === "xl/sharedStrings.xml" || /^xl\/worksheets\/[^/]+\.xml$/.test(n));

  // The first sheet in the workbook's order (not necessarily sheet1.xml).
  let sheetPath = "";
  const workbook = files.get("xl/workbook.xml")?.toString("utf8") ?? "";
  const rels = files.get("xl/_rels/workbook.xml.rels")?.toString("utf8") ?? "";
  const firstId = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(workbook)?.[1];
  if (firstId) {
    const rel = new RegExp(`<Relationship\\b[^>]*\\bId="${firstId}"[^>]*>`).exec(rels)?.[0];
    const target = rel ? /\bTarget="([^"]+)"/.exec(rel)?.[1] : undefined;
    if (target) sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
  }
  if (!files.has(sheetPath)) sheetPath = [...files.keys()].filter((k) => k.startsWith("xl/worksheets/")).sort()[0] ?? "";
  const sheet = files.get(sheetPath)?.toString("utf8");
  if (!sheet) throw new Error("no worksheet");

  const shared = [...(files.get("xl/sharedStrings.xml")?.toString("utf8") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1]));

  const rows: string[][] = [];
  for (const rm of sheet.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const r = Number(/\br="(\d+)"/.exec(rm[1])?.[1] ?? rows.length + 1) - 1;
    const cells: string[] = [];
    let next = 0;
    for (const cm of rm[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cm[1];
      const body = cm[2] ?? "";
      const ref = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const i = ref ? column(ref) : next;
      next = i + 1;
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? "n";
      const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let value = "";
      if (type === "s") value = shared[Number(v)] ?? "";
      else if (type === "inlineStr") value = texts(body);
      else if (type === "b") value = v === "1" ? "TRUE" : "FALSE";
      else value = v === undefined ? "" : decode(v);
      cells[i] = value;
    }
    rows[r] = Array.from(cells, (c) => c ?? "");
  }
  return Array.from(rows, (r) => r ?? []);
}
