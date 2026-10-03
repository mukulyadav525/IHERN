import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedBySlug } from "@/lib/content";
import { postUrl } from "@ihern/core/blog-paths";
import PageBanner from "@/components/PageBanner";

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
  if (page === undefined) notFound();
  if (page === null) {
    // The database is unreachable: say so, rather than a 404 that tells
    // readers (and search engines) the page is gone.
    return (
      <main className="b-wrap" id="main">
        <div className="b-card b-empty">The blog is temporarily unavailable. Please try again shortly.</div>
      </main>
    );
  }
  return (
    // Like the main site's About page: the banner, then the text.
    <main id="main">
      <PageBanner title={page.title} titleClass="b-post-title" />
      <div className="b-wrap b-wrap--post">
        <article className="b-card b-post">
          <div className="b-post-inner">
            <div className="b-content" dangerouslySetInnerHTML={{ __html: page.content }} />
          </div>
        </article>
      </div>
    </main>
  );
}
