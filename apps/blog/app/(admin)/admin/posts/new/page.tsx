import Link from "next/link";
import PostEditor from "@/components/admin/PostEditor";
import { loadEditor } from "@/lib/editor-data";

export const metadata = { title: "New post" };
export const dynamic = "force-dynamic";

export default async function NewPost() {
  const data = await loadEditor("post", null);
  return (
    <>
      <header className="adm-head">
        <h1>New post</h1>
        <Link className="adm-link" href="/admin/posts">← All posts</Link>
      </header>
      <PostEditor post={data.post!} authors={data.authors} categories={data.categories} tagSuggestions={data.tags} />
    </>
  );
}
