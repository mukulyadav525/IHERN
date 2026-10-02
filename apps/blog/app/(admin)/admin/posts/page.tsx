import Link from "next/link";
import PostTable from "@/components/admin/PostTable";

export const metadata = { title: "Posts" };
export const dynamic = "force-dynamic";

export default async function PostsPage(props: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <>
      <header className="adm-head">
        <h1>Posts</h1>
        <Link className="adm-btn" href="/admin/posts/new">New post</Link>
      </header>
      <PostTable type="post" status={searchParams.status ?? "all"} q={(searchParams.q ?? "").slice(0, 100)} />
    </>
  );
}
