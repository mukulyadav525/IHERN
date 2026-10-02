import Link from "next/link";
import { listCommentsForAdmin } from "@ihern/core/blog";
import { postPath } from "@ihern/core/blog-paths";
import { formatDate } from "@ihern/core/text";
import ActionButton from "@/components/admin/ActionButton";
import { deleteCommentAction, setCommentStatusAction } from "../actions";
import { u } from "@/lib/paths";

export const metadata = { title: "Comments" };
export const dynamic = "force-dynamic";

const TABS = [["pending", "Waiting"], ["approved", "Approved"], ["spam", "Spam"], ["trash", "Trash"]] as const;

export default async function CommentsPage(props: { searchParams: Promise<{ status?: string }> }) {
  const searchParams = await props.searchParams;
  const status = (TABS.find(([k]) => k === searchParams.status)?.[0] ?? "pending") as "pending" | "approved" | "spam" | "trash";
  const comments = await listCommentsForAdmin(status);
  return (
    <>
      <header className="adm-head"><h1>Comments</h1></header>
      <nav className="adm-tabs" aria-label="Filter by status">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/admin/comments?status=${k}`} className={k === status ? "is-active" : undefined}>{label}</Link>
        ))}
      </nav>
      {!comments ? (
        <p className="adm-flash adm-flash--error">The database could not be reached.</p>
      ) : !comments.length ? (
        <p className="adm-card adm-muted">Nothing here.</p>
      ) : (
        <div className="adm-stack">
          {comments.map((c) => (
            <article key={c.id} className="adm-card adm-comment">
              <p className="adm-comment-head">
                <strong>{c.authorName}</strong> <span className="adm-muted">{c.authorEmail} · {formatDate(c.createdAt)} · on </span>
                <a href={u(postPath({ type: "post", slug: c.postSlug }))} target="_blank" rel="noopener">{c.postTitle}</a>
              </p>
              <p className="adm-comment-body">{c.content}</p>
              <p className="adm-actions">
                {c.status !== "approved" ? <ActionButton action={setCommentStatusAction.bind(null, c.id, "approved")} label="Approve" className="adm-btn adm-btn--small" /> : null}
                {c.status === "approved" ? <ActionButton action={setCommentStatusAction.bind(null, c.id, "pending")} label="Unapprove" /> : null}
                {c.status !== "spam" ? <ActionButton action={setCommentStatusAction.bind(null, c.id, "spam")} label="Spam" /> : null}
                {c.status !== "trash" ? (
                  <ActionButton action={setCommentStatusAction.bind(null, c.id, "trash")} label="Trash" className="adm-link adm-danger" />
                ) : (
                  <ActionButton action={deleteCommentAction.bind(null, c.id)} label="Delete permanently" className="adm-link adm-danger" confirm="Delete this comment permanently?" />
                )}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
