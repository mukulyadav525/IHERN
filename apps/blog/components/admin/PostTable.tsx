import Link from "next/link";
import { commentCounts, listPosts, type PostStatus, type PostType } from "@ihern/core/blog";
import { postPath } from "@ihern/core/blog-paths";
import { formatDate } from "@ihern/core/text";
import { query } from "@ihern/core/db";
import { announceAction, deletePostAction, setPostStatusAction } from "@/app/(admin)/admin/actions";
import ActionButton from "./ActionButton";
import { u } from "@/lib/paths";

/** The list of posts (or pages) in the admin area, by status. */
export default async function PostTable({ type, status, q }: { type: PostType; status: string; q: string }) {
  const tabs: [string, string][] = [["all", "All"], ["published", "Published"], ["draft", "Drafts"], ["trash", "Trash"]];
  const st: PostStatus | "any" = status === "published" || status === "draft" || status === "trash" ? status : "any";
  const res = await listPosts({ type, status: st, search: q || undefined, limit: 200, sort: "newest" });
  const counts = await commentCounts((res?.posts ?? []).map((p) => p.id));
  const base = type === "page" ? "/admin/pages" : "/admin/posts";
  const nowIst = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 19).replace("T", " ");
  const notified = new Set<number>();
  if (type === "post" && res) {
    const rows = await query<{ id: number }>("cdnm", "SELECT id FROM blog_posts WHERE notified_at IS NOT NULL");
    for (const r of rows ?? []) notified.add(Number(r.id));
  }

  return (
    <>
      <nav className="adm-tabs" aria-label="Filter by status">
        {tabs.map(([key, label]) => (
          <Link key={key} href={`${base}${key === "all" ? "" : `?status=${key}`}`} className={(st === "any" ? "all" : st) === key ? "is-active" : undefined}>
            {label}
          </Link>
        ))}
        <form className="adm-search" action={u(base)} method="get">
          {st !== "any" ? <input type="hidden" name="status" value={st} /> : null}
          <input type="search" name="q" defaultValue={q} placeholder="Search" aria-label="Search" />
        </form>
      </nav>
      {!res ? (
        <p className="adm-flash adm-flash--error">The database could not be reached.</p>
      ) : !res.posts.length ? (
        <p className="adm-card adm-muted">Nothing here.</p>
      ) : (
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              {type === "post" ? <th scope="col">Author</th> : null}
              {type === "post" ? <th scope="col">Categories</th> : null}
              <th scope="col">Date</th>
              <th scope="col"><span className="adm-sr">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {res.posts.map((p) => {
              const live = p.status === "published" && (p.publishedAt ?? "") <= nowIst;
              return (
                <tr key={p.id}>
                  <td>
                    <Link className="adm-strong" href={`${base}/${p.id}`}>{p.title}</Link>
                    {p.status === "draft" ? <span className="adm-badge">Draft</span> : null}
                    {p.status === "published" && !live ? <span className="adm-badge">Scheduled</span> : null}
                    {counts.get(p.id) ? <span className="adm-muted"> · {counts.get(p.id)} comments</span> : null}
                  </td>
                  {type === "post" ? <td data-label="Author">{p.author?.name ?? "—"}</td> : null}
                  {type === "post" ? <td className="adm-muted" data-label="Categories">{p.categories.map((c) => c.name).join(", ") || "—"}</td> : null}
                  <td className="adm-nowrap" data-label="Date">{p.status === "published" ? formatDate(p.publishedAt) : `Edited ${formatDate(p.updatedAt)}`}</td>
                  <td className="adm-actions">
                    {p.status !== "trash" ? <Link className="adm-link" href={`${base}/${p.id}`}>Edit</Link> : null}
                    {live ? <a className="adm-link" href={u(postPath(p))} target="_blank" rel="noopener">View</a> : null}
                    {type === "post" && live && !notified.has(p.id) ? (
                      <ActionButton action={announceAction.bind(null, p.id)} label="Email subscribers" confirm={`Email every subscriber about “${p.title}”?`} />
                    ) : null}
                    {p.status === "trash" ? (
                      <>
                        <ActionButton action={setPostStatusAction.bind(null, p.id, "draft")} label="Restore" />
                        <ActionButton action={deletePostAction.bind(null, p.id)} label="Delete permanently" confirm={`Delete “${p.title}” permanently? This cannot be undone.`} className="adm-link adm-danger" />
                      </>
                    ) : (
                      <ActionButton action={setPostStatusAction.bind(null, p.id, "trash")} label="Trash" className="adm-link adm-danger" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
