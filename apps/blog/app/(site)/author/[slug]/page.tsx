import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthor } from "@/lib/content";
import { ArchiveHeading, Listing, parsePage } from "@/components/Listing";
import { mediaPath } from "@ihern/core/blog-paths";
import { u } from "@/lib/paths";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const author = await getAuthor({ slug: params.slug });
  if (!author) return {};
  return {
    title: author.name,
    description: author.bio || `Posts by ${author.name} on the IHERN Blog.`,
    alternates: { canonical: `/author/${author.slug}` },
  };
}

export default async function AuthorPage(props: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const author = await getAuthor({ slug: params.slug });
  if (author === undefined) notFound();
  return (
    <main id="main">
      {author ? (
        <ArchiveHeading
          kind="Author"
          title={author.name}
          photo={author.photo ? <img src={u(mediaPath(author.photo, 320))} alt={`Photo of ${author.name}`} width={112} height={112} /> : undefined}
        >
          {author.bio ? <p className="b-archive-desc">{author.bio}</p> : null}
        </ArchiveHeading>
      ) : null}
      <div className="b-wrap">
        <Listing base={`/author/${params.slug}`} page={parsePage(searchParams.page)} query={{ author: params.slug }} />
      </div>
    </main>
  );
}
