import Link from "next/link";
import PostEditor from "@/components/admin/PostEditor";
import { loadEditor } from "@/lib/editor-data";

export const metadata = { title: "New page" };
export const dynamic = "force-dynamic";

export default async function NewPage() {
  const data = await loadEditor("page", null);
  return (
    <>
      <header className="adm-head">
        <h1>New page</h1>
        <Link className="adm-link" href="/admin/pages">← All pages</Link>
      </header>
      <PostEditor post={data.post!} authors={data.authors} categories={data.categories} tagSuggestions={data.tags} />
    </>
  );
}
