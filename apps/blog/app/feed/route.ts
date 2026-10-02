import { listPosts, getPublishedBySlug } from "@/lib/content";
import { postUrl } from "@ihern/core/blog-paths";
import { blogUrl } from "@ihern/core/env";
import { escapeHtml, teaser } from "@ihern/core/text";

/**
 * RSS 2.0 feed of the latest posts (also /?feed=rss2). Feed readers are not
 * signed in, so each item carries the opening of the post, as the WordPress
 * blog's feed did.
 */

export const dynamic = "force-dynamic";

const rfc822 = (dt: string | null) => (dt ? new Date(dt.replace(" ", "T") + "+05:30").toUTCString() : new Date().toUTCString());
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

export async function GET() {
  const list = await listPosts({ limit: 20 });
  if (!list) return new Response("The blog is temporarily unavailable.", { status: 503 });
  const items: string[] = [];
  for (const p of list.posts) {
    const full = await getPublishedBySlug("post", p.slug);
    items.push(`    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${escapeHtml(postUrl(p))}</link>
      <guid isPermaLink="true">${escapeHtml(postUrl(p))}</guid>
      <pubDate>${rfc822(p.publishedAt)}</pubDate>
${p.author ? `      <dc:creator>${cdata(p.author.name)}</dc:creator>\n` : ""}${p.categories.map((c) => `      <category>${cdata(c.name)}</category>\n`).join("")}      <description>${cdata(p.excerpt)}</description>
      <content:encoded>${cdata(full ? teaser(full.content) : p.excerpt)}</content:encoded>
    </item>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>IHERN Blog</title>
    <link>${escapeHtml(blogUrl())}/</link>
    <atom:link href="${escapeHtml(blogUrl())}/feed" rel="self" type="application/rss+xml" />
    <description>Opinion pieces and analysis on higher education in India from the India Higher Education Research Network (IHERN).</description>
    <language>en</language>
    <lastBuildDate>${rfc822(list.posts[0]?.publishedAt ?? null)}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
