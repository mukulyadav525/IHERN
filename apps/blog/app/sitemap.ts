import type { MetadataRoute } from "next";
import { listPosts, listTerms, listAuthors } from "@/lib/content";
import { postUrl } from "@ihern/core/blog-paths";
import { blogUrl } from "@ihern/core/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = blogUrl();
  const [posts, pages, cats, tags, authors] = await Promise.all([
    listPosts({ limit: 200 }), listPosts({ type: "page", limit: 200 }), listTerms("category", true), listTerms("tag", true), listAuthors(true),
  ]);
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/posts`, priority: 0.8 },
    { url: `${base}/subscribe`, priority: 0.4 },
    ...(posts?.posts ?? []).map((p) => ({ url: postUrl(p), lastModified: p.updatedAt.replace(" ", "T") + "+05:30", priority: 0.9 })),
    ...(pages?.posts ?? []).map((p) => ({ url: postUrl(p), priority: 0.5 })),
    ...(cats ?? []).map((c) => ({ url: `${base}/category/${c.slug}`, priority: 0.5 })),
    ...(tags ?? []).map((t) => ({ url: `${base}/tag/${t.slug}`, priority: 0.3 })),
    ...(authors ?? []).map((a) => ({ url: `${base}/author/${a.slug}`, priority: 0.4 })),
  ];
}
