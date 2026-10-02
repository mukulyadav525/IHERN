import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { currentAdmin } from "@/lib/admin";
import { uploadDir } from "@/lib/membership";

/** Membership photographs are private: only signed-in admins see them. */

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp" };

export async function GET(_req: Request, props: { params: Promise<{ name: string }> }) {
  const params = await props.params;
  const who = await currentAdmin();
  if (!who || who === "unavailable") return new NextResponse("Not signed in.", { status: 403 });
  const name = params.name;
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!/^[A-Za-z0-9._-]+$/.test(name) || name.startsWith(".") || !type) return new NextResponse("Not found.", { status: 404 });
  try {
    const bytes = await readFile(path.join(uploadDir(), name));
    return new NextResponse(bytes, {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600", "Content-Security-Policy": "default-src 'none'" },
    });
  } catch {
    return new NextResponse("Not found.", { status: 404 });
  }
}
