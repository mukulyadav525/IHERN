import Link from "next/link";
import { blogCounts, listCommentsForAdmin, listPosts } from "@ihern/core/blog";
import { formatDate } from "@ihern/core/text";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [counts, drafts, pending] = await Promise.all([blogCounts(), listPosts({ status: "draft", limit: 5, sort: "updated" }), listCommentsForAdmin("pending")]);
  return (
    <>
      <header className="adm-head">
        <h1>Dashboard</h1>
        <Link className="adm-btn" href="/admin/posts/new">Write a post</Link>
      </header>
      {counts ? (
        <div className="adm-stats">
          <Link className="adm-stat" href="/admin/posts?status=published"><strong>{counts.published}</strong><span>published posts</span></Link>
          <Link className="adm-stat" href="/admin/posts?status=draft"><strong>{counts.drafts}</strong><span>drafts</span></Link>
          <Link className="adm-stat" href="/admin/comments"><strong>{counts.pendingComments}</strong><span>comments to approve</span></Link>
          <div className="adm-stat"><strong>{counts.subscribers}</strong><span>email subscribers</span></div>
        </div>
      ) : (
        <p className="adm-flash adm-flash--error">The database could not be reached.</p>
      )}
      <div className="adm-two">
        <section className="adm-card">
          <h2>Drafts</h2>
          {drafts?.posts.length ? (
            <ul className="adm-list">
              {drafts.posts.map((p) => (
                <li key={p.id}><Link href={`/admin/posts/${p.id}`}>{p.title}</Link> <span className="adm-muted">edited {formatDate(p.updatedAt)}</span></li>
              ))}
            </ul>
          ) : (
            <p className="adm-muted">No drafts.</p>
          )}
        </section>
        <section className="adm-card">
          <h2>Waiting for approval</h2>
          {pending?.length ? (
            <ul className="adm-list">
              {pending.slice(0, 5).map((c) => (
                <li key={c.id}><strong>{c.authorName}</strong> on <em>{c.postTitle}</em>: {c.content.slice(0, 90)}{c.content.length > 90 ? "…" : ""}</li>
              ))}
            </ul>
          ) : (
            <p className="adm-muted">No comments waiting.</p>
          )}
          {pending?.length ? <p><Link href="/admin/comments">Moderate comments →</Link></p> : null}
        </section>
      </div>
    </>
  );
}
