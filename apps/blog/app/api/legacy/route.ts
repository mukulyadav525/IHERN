import { NextRequest, NextResponse } from "next/server";
import { getAuthor, getPostByWpId, getTerm, postPath } from "@ihern/core/blog";
import { u } from "@/lib/paths";

/**
 * Old WordPress addresses on the front page (/?p=196, /?cat=6, ...), sent
 * permanently to where that content lives now. The middleware routes them
 * here. Posts and terms imported from WordPress keep their WordPress ids.
 */

export const dynamic = "force-dynamic";

const go = (path: string, permanent = true) =>
  new NextResponse(null, { status: permanent ? 301 : 302, headers: { Location: u(path) } });

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const int = (k: string) => (/^\d+$/.test(q.get(k) ?? "") ? Number(q.get(k)) : null);

  if (q.has("feed")) return go("/feed");

  if (q.has("p") || q.has("page_id")) {
    const id = int("p") ?? int("page_id");
    if (id !== null) {
      const post = await getPostByWpId(id);
      if (post) return go(postPath(post));
      if (post === null) return go("/", false); // database unavailable: do not cache
    }
    return go("/");
  }

  if (q.has("cat")) {
    const id = int("cat");
    const term = id !== null ? await getTerm("category", { wpId: id }) : await getTerm("category", { slug: q.get("cat") ?? "" });
    return term ? go(`/category/${term.slug}`) : go("/");
  }

  if (q.has("tag")) return go(`/tag/${encodeURIComponent(q.get("tag") ?? "")}`);

  if (q.has("author")) {
    const id = int("author");
    const author = id !== null ? await getAuthor({ wpId: id }) : await getAuthor({ slug: q.get("author") ?? "" });
    return author ? go(`/author/${author.slug}`) : go("/");
  }

  if (q.has("s")) return go(`/search?q=${encodeURIComponent(q.get("s") ?? "")}`);

  const m = q.get("m") ?? "";
  if (/^\d{6}$/.test(m)) return go(`/archive/${m.slice(0, 4)}/${m.slice(4)}`);
  if (/^\d{4}$/.test(m)) return go(`/archive/${m}`);

  if (q.has("paged")) return go(`/?page=${int("paged") ?? 1}`);

  // Unknown: keep the reader on the blog.
  return go("/");
}
