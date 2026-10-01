"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { Media } from "@ihern/core/blog";
import { mediaPath } from "@ihern/core/blog-paths";
import { savePostAction, type ActionResult } from "@/app/(admin)/admin/actions";
import RichText from "./RichText";
import MediaPicker from "./MediaPicker";
import Result from "./Result";
import { useKeepValues } from "./Forms";
import { u } from "@/lib/paths";

/** Writing and editing a post or a page. */

export type EditorPost = {
  id: number | null;
  type: "post" | "page";
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "draft" | "published" | "trash";
  publishedAt: string; // "YYYY-MM-DDTHH:MM" or ""
  authorId: number | null;
  image: Media | null;
  commentsOpen: boolean;
  categoryIds: number[];
  tags: string;
  announced: boolean;
  viewPath: string | null;
};

function SaveButtons({ status, type }: { status: EditorPost["status"]; type: EditorPost["type"] }) {
  const { pending } = useFormStatus();
  const live = status === "published";
  return (
    <div className="adm-row">
      <button type="submit" name="intent" value="publish" className="adm-btn" disabled={pending}>
        {pending ? "Saving…" : live ? "Update" : `Publish ${type === "page" ? "page" : "post"}`}
      </button>
      <button type="submit" name="intent" value="draft" className="adm-btn adm-btn--ghost" disabled={pending}>
        {live ? "Switch to draft" : "Save draft"}
      </button>
    </div>
  );
}

export default function PostEditor({
  post,
  authors,
  categories,
  tagSuggestions,
}: {
  post: EditorPost;
  authors: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  tagSuggestions: string[];
}) {
  const router = useRouter();
  const [state, action] = useActionState(savePostAction, { ok: false, message: "", error: "" } as ActionResult);
  const formRef = useRef<HTMLFormElement>(null);
  useKeepValues(formRef);
  const [image, setImage] = useState<Media | null>(post.image);
  const [picking, setPicking] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(post.id));
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const isPost = post.type === "post";

  // A new post, once saved, continues at its own address.
  useEffect(() => {
    if (state.ok && state.id && !post.id) router.replace(`/admin/${isPost ? "posts" : "pages"}/${state.id}?saved=1`);
    else if (state.ok) router.refresh();
  }, [state, post.id, isPost, router]);

  const autoSlug = (t: string) =>
    t.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 190);

  return (
    // Keeps the editor's fields after a save that was refused (React 19 would clear them).
    <form ref={formRef} action={action} className="adm-editor">
      {/* Not name="id": a field called "id" hides the form's own id property, and
          React 19 then drops which button was pressed (Publish / Save draft). */}
      <input type="hidden" name="post_id" value={post.id ?? ""} />
      <input type="hidden" name="type" value={post.type} />
      <input type="hidden" name="featured_media_id" value={image?.id ?? ""} />

      <div className="adm-editor-main">
        <Result state={state} />
        <label className="adm-field">
          <span>Title</span>
          <input
            name="title"
            className="adm-title-input"
            value={title}
            required
            maxLength={500}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(autoSlug(e.target.value));
            }}
          />
        </label>
        <label className="adm-field">
          <span>Address</span>
          <span className="adm-slug">
            <code>{isPost ? "/posts/" : "/"}</code>
            <input name="slug" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} maxLength={190} aria-label="Address (slug)" />
          </span>
        </label>
        <div className="adm-field">
          <span>Text</span>
          <RichText name="content" initial={post.content} />
        </div>
        <label className="adm-field">
          <span>Excerpt <em>(optional - the short summary on lists; written from the text if left empty)</em></span>
          <textarea name="excerpt" defaultValue={post.excerpt} rows={3} maxLength={2000} />
        </label>
      </div>

      <aside className="adm-editor-side">
        <section className="adm-card">
          <h2>{post.status === "published" ? "Published" : post.status === "trash" ? "In the trash" : "Draft"}</h2>
          {post.viewPath && post.status === "published" ? (
            <p><a href={u(post.viewPath)} target="_blank" rel="noopener">View on the blog ↗</a></p>
          ) : null}
          {post.id ? <p><a href={u(`/admin/preview/${post.id}`)} target="_blank" rel="noopener">Preview ↗</a></p> : null}
          <label className="adm-field">
            <span>Publish date</span>
            <input type="datetime-local" name="published_at" defaultValue={post.publishedAt} />
            <small>Empty = now. A future date schedules the post.</small>
          </label>
          {isPost && !post.announced ? (
            <label className="adm-check">
              <input type="checkbox" name="notify" value="1" defaultChecked />
              Email subscribers when it is published
            </label>
          ) : null}
          {isPost && post.announced ? <p className="adm-muted">Subscribers have been emailed about this post.</p> : null}
          <SaveButtons status={post.status} type={post.type} />
        </section>

        {isPost ? (
          <section className="adm-card">
            <h2>Author</h2>
            <select name="author_id" defaultValue={post.authorId ?? ""} aria-label="Author">
              <option value="">No author shown</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <p className="adm-muted"><a href={u("/admin/authors")}>Add or edit authors</a></p>
          </section>
        ) : null}

        {isPost ? (
          <section className="adm-card">
            <h2>Categories</h2>
            <div className="adm-checklist">
              {categories.map((c) => (
                <label key={c.id} className="adm-check">
                  <input type="checkbox" name="category" value={c.id} defaultChecked={post.categoryIds.includes(c.id)} />
                  {c.name}
                </label>
              ))}
            </div>
            <p className="adm-muted"><a href={u("/admin/categories")}>Manage categories</a></p>
          </section>
        ) : null}

        {isPost ? (
          <section className="adm-card">
            <h2>Tags</h2>
            <input name="tags" defaultValue={post.tags} list="tag-suggestions" aria-label="Tags" placeholder="Funding, Research" />
            <datalist id="tag-suggestions">
              {tagSuggestions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <small>Separate tags with commas.</small>
          </section>
        ) : null}

        <section className="adm-card">
          <h2>Featured image</h2>
          {image ? (
            <figure className="adm-featured">
              <img src={u(mediaPath(image.path, 640))} alt={image.alt} />
            </figure>
          ) : (
            <p className="adm-muted">None.</p>
          )}
          <div className="adm-row">
            <button type="button" className="adm-btn adm-btn--ghost adm-pick-image" onClick={() => setPicking(true)}>{image ? "Change" : "Choose image"}</button>
            {image ? <button type="button" className="adm-link" onClick={() => setImage(null)}>Remove</button> : null}
          </div>
        </section>

        {isPost ? (
          <section className="adm-card">
            <h2>Discussion</h2>
            <label className="adm-check">
              <input type="checkbox" name="comments_open" value="1" defaultChecked={post.commentsOpen} />
              Allow comments
            </label>
          </section>
        ) : null}
      </aside>

      {picking ? <MediaPicker title="Featured image" onClose={() => setPicking(false)} onPick={(m) => { setImage(m); setPicking(false); }} /> : null}
    </form>
  );
}
