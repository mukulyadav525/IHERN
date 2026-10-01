import { getPostById, listAuthors, listTerms, type PostType } from "@ihern/core/blog";
import { postPath } from "@ihern/core/blog-paths";
import type { EditorPost } from "@/components/admin/PostEditor";

/** Everything the post editor needs: the post (or a blank one) and the choices. */
export async function loadEditor(type: PostType, id: number | null) {
  const [authors, categories, tags] = await Promise.all([listAuthors(), listTerms("category"), listTerms("tag")]);
  let post: EditorPost = {
    id: null, type, title: "", slug: "", excerpt: "", content: "", status: "draft", publishedAt: "", authorId: null,
    image: null, commentsOpen: type === "post", categoryIds: [], tags: "", announced: false, viewPath: null,
  };
  if (id !== null) {
    const p = await getPostById(id);
    if (!p || p.type !== type) return { post: null, authors: [], categories: [], tags: [] };
    post = {
      id: p.id, type: p.type, title: p.title, slug: p.slug, excerpt: p.rawExcerpt, content: p.content, status: p.status,
      publishedAt: p.publishedAt ? p.publishedAt.slice(0, 16).replace(" ", "T") : "", authorId: p.author?.id ?? null,
      image: p.image, commentsOpen: p.commentsOpen, categoryIds: p.categories.map((c) => c.id), tags: p.tags.map((t) => t.name).join(", "),
      announced: Boolean(p.notifiedAt), viewPath: postPath(p),
    };
  }
  return {
    post,
    authors: (authors ?? []).map((a) => ({ id: a.id, name: a.name })),
    categories: (categories ?? []).map((c) => ({ id: c.id, name: c.name })),
    tags: (tags ?? []).map((t) => t.name),
  };
}
