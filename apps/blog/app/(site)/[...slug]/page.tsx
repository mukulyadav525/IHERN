import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedBySlug } from "@/lib/content";
import { postUrl } from "@ihern/core/blog-paths";

/** Pages written in the admin area (About us, ...), at /<slug>. Anything else is a 404. */

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const params = await props.params;
  if (params.slug.length !== 1) return {};
  const page = await getPublishedBySlug("page", params.slug[0]);
  return page ? { title: page.title, description: page.excerpt, alternates: { canonical: postUrl(page) } } : {};
}

export default async function Page(props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  if (params.slug.length !== 1) notFound();
  const page = await getPublishedBySlug("page", params.slug[0]);
  if (!page) notFound();
  return (
    <main className="b-wrap b-wrap--post" id="main">
      <article className="b-card b-post">
        <div className="b-post-inner">
          <h1 className="b-post-title">{page.title}</h1>
          <div className="b-content" dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </article>
    </main>
  );
}
