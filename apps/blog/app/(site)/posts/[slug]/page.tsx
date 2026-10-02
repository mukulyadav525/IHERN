import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pendingCommentsBy } from "@ihern/core/blog";
import { adjacentPosts, approvedComments, getPublishedBySlug } from "@/lib/content";
import { mediaPath, mediaSrcSet, mediaUrl, postPath, postUrl } from "@ihern/core/blog-paths";
import { escapeHtml, formatDate, teaser } from "@ihern/core/text";
import { Chips, PostMeta, AuthorIcon } from "@/components/PostParts";
import SubscribeBox from "@/components/SubscribeBox";
import CommentForm from "@/components/CommentForm";
import { currentReader, currentSubscribed } from "@/lib/reader";
import { mainUrl } from "@/lib/site";
import { u } from "@/lib/paths";

/**
 * A post. Read in full with an IHERN account; a signed-out reader sees the
 * opening (whole paragraphs, about 90 words) and is asked to sign in - the
 * rule the WordPress blog used.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const post = await getPublishedBySlug("post", params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: postUrl(post) },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: postUrl(post),
      publishedTime: post.publishedAt?.replace(" ", "T"),
      authors: post.author ? [post.author.name] : undefined,
      images: post.image ? [mediaUrl(post.image.path)] : undefined,
    },
    twitter: { card: post.image ? "summary_large_image" : "summary" },
  };
}

export default async function PostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  // The post (usually from the cache) and who is reading, side by side.
  const [post, reader] = await Promise.all([getPublishedBySlug("post", params.slug), currentReader()]);
  if (post === undefined) notFound();
  if (post === null) {
    return (
      <main className="b-wrap" id="main">
        <div className="b-card b-empty">The blog is temporarily unavailable. Please try again shortly.</div>
      </main>
    );
  }

  const [adjacent, comments, pending, subscribed] = await Promise.all([
    adjacentPosts(post.id, post.publishedAt),
    approvedComments(post.id),
    reader ? pendingCommentsBy(post.id, reader.subscriberId) : Promise.resolve([]),
    currentSubscribed(),
  ]);
  const around = adjacent ?? { prev: null, next: null };
  const here = postPath(post);
  const gated = !reader;
  const body = gated ? teaser(post.content) : post.content;
  const updated = post.updatedAt && post.publishedAt && post.updatedAt.slice(0, 10) > post.publishedAt.slice(0, 10) ? formatDate(post.updatedAt) : "";

  return (
    <main className="b-wrap b-wrap--post" id="main">
      <nav className="b-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{post.title}</span>
      </nav>

      <article className="b-card b-post">
        {post.image ? (
          <figure className="b-post-image">
            <img
              src={u(mediaPath(post.image.path, 1280))}
              srcSet={mediaSrcSet(post.image.path, post.image.width, [640, 960, 1280, 1600], u)}
              sizes="(max-width: 900px) 100vw, 860px"
              alt={post.image.alt}
              width={post.image.width ?? undefined}
              height={post.image.height ?? undefined}
            />
          </figure>
        ) : null}
        <div className="b-post-inner">
          <Chips terms={post.categories} />
          <h1 className="b-post-title">{post.title}</h1>
          <PostMeta post={post} comments={post.commentsOpen || (comments?.length ?? 0) > 0 ? comments?.length ?? 0 : undefined} />

          <div className={`b-content${gated ? " b-content--teaser" : ""}`} dangerouslySetInnerHTML={{ __html: body }} />

          {gated ? (
            <aside className="b-card b-gate" aria-labelledby="gate-title">
              <h2 className="b-gate-title" id="gate-title">Sign in to continue reading</h2>
              <p>IHERN Blog posts are available in full to readers with an IHERN account — one account for the IHERN website and the blog.</p>
              <div className="b-actions">
                <a className="b-btn" href={u(`/api/sso/login?return=${encodeURIComponent(here)}`)}>Sign in</a>
                <a className="b-btn b-btn--ghost" href={u(`/api/sso/login?mode=register&return=${encodeURIComponent(here)}`)}>Create IHERN account</a>
              </div>
            </aside>
          ) : null}

          <Chips terms={post.tags} kind="tag" />
          {updated ? <p className="b-updated">Last updated on {updated}</p> : null}
        </div>
      </article>

      {post.author ? (
        <section className="b-card b-author-box" aria-label="About the author">
          <span className="b-author-avatar" aria-hidden="true"><AuthorIcon /></span>
          <div>
            <h2 className="b-author-name">
              <Link href={`/author/${post.author.slug}`}>{post.author.name}</Link>
            </h2>
            {post.author.bio ? <p>{post.author.bio}</p> : null}
          </div>
        </section>
      ) : null}

      {around.prev || around.next ? (
        <nav className="b-prevnext" aria-label="More posts">
          {around.prev ? (
            <Link className="b-card b-prevnext-link" href={postPath(around.prev)} rel="prev">
              <span className="b-prevnext-label">Previous post</span>
              <span className="b-prevnext-title">{around.prev.title}</span>
            </Link>
          ) : <span />}
          {around.next ? (
            <Link className="b-card b-prevnext-link b-prevnext-link--next" href={postPath(around.next)} rel="next">
              <span className="b-prevnext-label">Next post</span>
              <span className="b-prevnext-title">{around.next.title}</span>
            </Link>
          ) : <span />}
        </nav>
      ) : null}

      {!gated ? (
        <SubscribeBox signedIn={Boolean(reader)} subscribed={subscribed === true} returnTo={here} accountUrl={mainUrl("account")} />
      ) : null}

      {post.commentsOpen || (comments?.length ?? 0) > 0 ? (
        <section className="b-card b-comments" id="comments" aria-labelledby="comments-title">
          <h2 className="b-section-title" id="comments-title">Comments</h2>
          {comments === null ? (
            <p>Comments could not be loaded just now.</p>
          ) : comments.length ? (
            <ol className="b-comment-list">
              {comments.map((c) => (
                <li key={c.id} className="b-comment" id={`comment-${c.id}`}>
                  <p className="b-comment-head"><strong>{c.authorName}</strong> <span>{formatDate(c.createdAt)}</span></p>
                  <div className="b-comment-body" dangerouslySetInnerHTML={{ __html: escapeHtml(c.content).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br />").replace(/^/, "<p>") + "</p>" }} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="b-comments-none">No comments yet. Why don&rsquo;t you start the discussion?</p>
          )}
          {(pending ?? []).map((c) => (
            <div key={c.id} className="b-comment b-comment--pending">
              <p className="b-comment-head"><strong>{c.authorName}</strong> <span>Awaiting approval</span></p>
              <div className="b-comment-body"><p>{c.content}</p></div>
            </div>
          ))}
          {post.commentsOpen ? (
            reader ? (
              <CommentForm postId={post.id} name={reader.name || reader.email} />
            ) : (
              <div className="b-comment-signin">
                <p>Sign in with your IHERN account to join the discussion.</p>
                <a className="b-btn" href={u(`/api/sso/login?return=${encodeURIComponent(here + "#comments")}`)}>Sign in to comment</a>
              </div>
            )
          ) : (
            <p className="b-comments-closed">Comments are closed.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}
