import Link from "next/link";
import { notFound } from "next/navigation";
import PostEditor from "@/components/admin/PostEditor";
import { loadEditor } from "@/lib/editor-data";

export const metadata = { title: "Edit page" };
export const dynamic = "force-dynamic";

export default async function EditPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  if (!/^\d+$/.test(params.id)) notFound();
  const data = await loadEditor("page", Number(params.id));
  if (!data.post) notFound();
  return (
    <>
      <header className="adm-head">
        <h1>Edit page</h1>
        <Link className="adm-link" href="/admin/pages">← All pages</Link>
      </header>
      {searchParams.saved ? <p className="adm-flash adm-flash--ok" role="status">Saved.</p> : null}
      <PostEditor key={data.post.id ?? "new"} post={data.post} authors={data.authors} categories={data.categories} tagSuggestions={data.tags} />
    </>
  );
}
