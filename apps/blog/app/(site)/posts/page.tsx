import type { Metadata } from "next";
import { Listing, parsePage, type ListingParams } from "@/components/Listing";

/** All posts, with the filter bar. The filters arrive as ordinary query parameters. */

export const metadata: Metadata = { title: "All posts", alternates: { canonical: "/posts" } };
export const dynamic = "force-dynamic";

const KEYS = ["q", "author", "category", "tag", "year", "sort"] as const;

export default async function AllPostsPage(props: { searchParams: Promise<ListingParams> }) {
  const searchParams = await props.searchParams;
  const params: Record<string, string> = {};
  for (const k of KEYS) {
    const v = searchParams[k];
    if (typeof v === "string" && v.trim()) params[k] = v.trim().slice(0, 200);
  }
  const year = /^\d{4}$/.test(params.year ?? "") ? Number(params.year) : undefined;
  const sort = params.sort === "oldest" || params.sort === "az" ? params.sort : "newest";
  return (
    <main className="b-wrap" id="main">
      <h1 className="b-page-title">{params.q ? `Search results for “${params.q}”` : "All posts"}</h1>
      <Listing
        filters
        base="/posts"
        params={params}
        page={parsePage(searchParams.page)}
        query={{ search: params.q, author: params.author, category: params.category, tag: params.tag, year, sort }}
        empty="No posts match these filters."
      />
    </main>
  );
}
