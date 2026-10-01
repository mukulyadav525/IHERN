import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { imageSize } from "image-size";
import { slugify } from "@ihern/core/text";

/**
 * The blog's uploaded files: one folder (BLOG_UPLOAD_DIR), laid out the way
 * WordPress laid out wp-content/uploads (year/month/file), and served at
 * /wp-content/uploads/... so every image address from the old blog still
 * works after the move.
 */

export function uploadDir(): string {
  return path.resolve(process.env.BLOG_UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

export const MAX_UPLOAD = 10 * 1024 * 1024;

export const TYPES: Record<string, { mime: string; image: boolean }> = {
  jpg: { mime: "image/jpeg", image: true },
  jpeg: { mime: "image/jpeg", image: true },
  png: { mime: "image/png", image: true },
  gif: { mime: "image/gif", image: true },
  webp: { mime: "image/webp", image: true },
  svg: { mime: "image/svg+xml", image: true },
  pdf: { mime: "application/pdf", image: false },
};

/** The type of an uploaded file, from its own bytes (never from its name). */
export function sniff(bytes: Uint8Array): "jpg" | "png" | "gif" | "webp" | "pdf" | null {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "pdf";
  return null;
}

/** Resolves a path under the upload folder; null if it would leave it. */
export function resolveUpload(relative: string): string | null {
  const root = uploadDir();
  const full = path.resolve(root, relative);
  return full.startsWith(root + path.sep) ? full : null;
}

/** Saves an upload as YYYY/MM/<name>-<random>.<ext>. */
export async function storeUpload(bytes: Uint8Array, originalName: string, ext: string) {
  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const base = slugify(originalName.replace(/\.[^.]+$/, "")).slice(0, 60) || "upload";
  const rel = `${dir}/${base}-${randomBytes(3).toString("hex")}.${ext}`;
  const full = resolveUpload(rel)!;
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
  let width: number | null = null;
  let height: number | null = null;
  try {
    const d = imageSize(bytes);
    width = d.width ?? null;
    height = d.height ?? null;
  } catch {
    /* not an image (a PDF) */
  }
  return { path: rel, width, height };
}

export async function removeUpload(relative: string): Promise<void> {
  const full = resolveUpload(relative);
  if (full) await unlink(full).catch(() => {});
}
