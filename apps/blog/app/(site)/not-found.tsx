import Link from "next/link";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="b-wrap b-wrap--narrow" id="main">
      <div className="b-card b-empty">
        <h1 className="b-page-title">Page not found</h1>
        <p>The page you were looking for is not here. It may have moved, or the address may be mistyped.</p>
        <p className="b-actions">
          <Link className="b-btn" href="/">Go to the blog</Link>
          <Link className="b-btn b-btn--ghost" href="/posts">All posts</Link>
        </p>
      </div>
    </main>
  );
}
