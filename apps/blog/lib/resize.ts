import { mkdir, readFile, rename, stat, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import sharp from "sharp";
import { IMAGE_WIDTHS } from "@ihern/core/blog-paths";

/**
 * Smaller copies of uploaded images (/wp-content/uploads/...?w=640), so a
 * list thumbnail does not download a 1500-pixel original. Made on first
 * request, kept on disk, and remade if the original changes. Only the fixed
 * widths in IMAGE_WIDTHS are made, so nobody can fill the disk with sizes.
 */

const RESIZABLE = new Set(["jpg", "jpeg", "png", "webp"]);

function cacheDir(): string {
  return path.resolve(process.env.BLOG_IMAGE_CACHE_DIR || path.join(process.cwd(), ".next", "cache", "ihern-images"));
}

export function resizable(ext: string, width: number): boolean {
  return RESIZABLE.has(ext) && (IMAGE_WIDTHS as readonly number[]).includes(width);
}

// Copies being made right now, so simultaneous requests share one job.
const pending = new Map<string, Promise<Buffer | null>>();

/**
 * The resized image (WebP when the browser accepts it, else the original
 * format), or null when it cannot be made (the original is then served).
 */
export function resized(full: string, relative: string, ext: string, width: number, webp: boolean): Promise<Buffer | null> {
  const format = webp ? "webp" : ext === "png" ? "png" : ext === "webp" ? "webp" : "jpeg";
  const key = `${width}/${relative}.${format}`;
  const existing = pending.get(key);
  if (existing) return existing;
  const job = make(full, path.join(cacheDir(), key), width, format).finally(() => pending.delete(key));
  pending.set(key, job);
  return job;
}

async function make(full: string, target: string, width: number, format: "webp" | "png" | "jpeg"): Promise<Buffer | null> {
  try {
    const [src, done] = await Promise.all([stat(full), stat(target).catch(() => null)]);
    if (done && done.mtimeMs >= src.mtimeMs) return await readFile(target);
    let img = sharp(full, { failOn: "none" }).rotate().resize({ width, withoutEnlargement: true });
    img = format === "webp" ? img.webp({ quality: 78 }) : format === "png" ? img.png({ compressionLevel: 9, palette: false }) : img.jpeg({ quality: 80, mozjpeg: true });
    const out = await img.toBuffer();
    await mkdir(path.dirname(target), { recursive: true });
    // Written beside, then renamed: a reader never sees half a file.
    const tmp = `${target}.${randomBytes(4).toString("hex")}.tmp`;
    await writeFile(tmp, out);
    await rename(tmp, target);
    return out;
  } catch (e) {
    console.error("[IHERN blog] could not resize", full, (e as Error).message);
    return null;
  }
}
