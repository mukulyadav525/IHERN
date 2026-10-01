import { redirect } from "next/navigation";

/** /search?q=... (the footer's search box, and old ?s= links) - the filtered post list. */
export default async function SearchPage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const q = (searchParams.q ?? "").trim();
  redirect(q ? `/posts?q=${encodeURIComponent(q)}` : "/posts");
}
