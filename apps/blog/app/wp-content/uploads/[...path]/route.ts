import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { resolveUpload, TYPES } from "@/lib/uploads";
import { resizable, resized } from "@/lib/resize";

/**
 * Uploaded files, at the addresses WordPress served them from
 * (/wp-content/uploads/2026/06/ihern.png). Files come from BLOG_UPLOAD_DIR,
 * so images uploaded after the site was built are served too. Only images
 * and PDFs are ever served. ?w=640 (one of IMAGE_WIDTHS) gives a smaller
 * copy, as WebP for browsers that accept it.
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  const relative = params.path.map((p) => decodeURIComponent(p)).join("/");
  const ext = relative.split(".").pop()?.toLowerCase() ?? "";
  const type = TYPES[ext];
  const full = type ? resolveUpload(relative) : null;
  if (!full) return new NextResponse("Not found", { status: 404 });

  let info;
  try {
    info = await stat(full);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!info.isFile()) return new NextResponse("Not found", { status: 404 });

  const width = Number(req.nextUrl.searchParams.get("w"));
  if (width && resizable(ext, width)) {
    const webp = (req.headers.get("accept") || "").includes("image/webp");
    const tag = `"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}-w${width}${webp ? "-webp" : ""}"`;
    const vary = { Vary: "Accept", "Cache-Control": "public, max-age=604800" };
    if (req.headers.get("if-none-match") === tag) return new NextResponse(null, { status: 304, headers: { ETag: tag, ...vary } });
    const out = await resized(full, relative, ext, width, webp);
    if (out) {
      return new NextResponse(new Uint8Array(out), {
        headers: {
          "Content-Type": webp ? "image/webp" : type.mime,
          "Content-Length": String(out.length),
          ETag: tag,
          "Last-Modified": info.mtime.toUTCString(),
          "X-Content-Type-Options": "nosniff",
          ...vary,
        },
      });
    }
    // Could not make the copy: the original below.
  }

  const etag = `"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
  if (req.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag } });

  const headers: Record<string, string> = {
    "Content-Type": type.mime,
    "Content-Length": String(info.size),
    "Cache-Control": "public, max-age=604800",
    ETag: etag,
    "Last-Modified": info.mtime.toUTCString(),
    "X-Content-Type-Options": "nosniff",
  };
  // An SVG is shown as an image, never run as a page.
  if (ext === "svg") headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
  const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;
  return new NextResponse(stream, { status: 200, headers });
}
