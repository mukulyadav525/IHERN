import Link from "next/link";
import PageBanner from "@/components/PageBanner";

export const metadata = { title: "Page not found", robots: { index: false } };

/** The main site's 404 (banner, sentence, way back), in the blog. */
export default function NotFound() {
  return (
    <main id="main">
      <PageBanner title="Page not found" />
      <div className="b-wrap b-wrap--narrow b-wrap--message">
        <p>The page you were looking for is not here. It may have moved, or the address may be mistyped.</p>
        <p className="b-actions">
          <Link className="b-btn" href="/">Go to the blog</Link>
          <Link className="b-btn b-btn--ghost" href="/posts">All posts</Link>
        </p>
      </div>
    </main>
  );
}
