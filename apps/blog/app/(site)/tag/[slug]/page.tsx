import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTerm } from "@/lib/content";
import { ArchiveHeading, Listing, parsePage } from "@/components/Listing";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const term = await getTerm("tag", { slug: params.slug });
  return term ? { title: term.name, alternates: { canonical: `/tag/${term.slug}` } } : {};
}

export default async function TermPage(props: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const term = await getTerm("tag", { slug: params.slug });
  if (term === undefined) notFound();
  return (
    <main id="main">
      {term ? (
        <ArchiveHeading kind="Tag" title={term.name}>
          {term.description ? <p className="b-archive-desc">{term.description}</p> : null}
        </ArchiveHeading>
      ) : null}
      <div className="b-wrap">
        <Listing base={`/tag/${params.slug}`} page={parsePage(searchParams.page)} query={{ tag: params.slug }} />
      </div>
    </main>
  );
}
