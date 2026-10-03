import { notFound } from "next/navigation";
import { getPostById } from "@ihern/core/blog";
import { mediaPath } from "@ihern/core/blog-paths";
import { formatDate } from "@ihern/core/text";
import { css, u } from "@/lib/paths";

/** A post as readers will see it (in full), including drafts. Editors only. */

export const metadata = { title: "Preview" };
export const dynamic = "force-dynamic";

export default async function Preview(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  if (!/^\d+$/.test(params.id)) notFound();
  const post = await getPostById(Number(params.id));
  if (!post) notFound();
  return (
    <>
      <link rel="stylesheet" href={css("/assets/css/blog.css")} />
      <p className="adm-flash adm-flash--ok">Preview{post.status !== "published" ? " of a draft - not visible to readers yet" : ""}.</p>
      <article className="adm-preview">
        {post.image ? <img className="adm-preview-image" src={u(mediaPath(post.image.path))} alt={post.image.alt} /> : null}
        <h1>{post.title}</h1>
        <p className="adm-muted">{post.author?.name ?? ""}{post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : ""}</p>
        <div className="b-content" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </>
  );
}
