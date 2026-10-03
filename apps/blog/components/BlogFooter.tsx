import Link from "next/link";
import type { Term } from "@ihern/core/blog";
import { monthName } from "@ihern/core/text";
import { mainUrl } from "@/lib/site";
import { u } from "@/lib/paths";

/**
 * The IHERN footer - the same three columns as the main site, with absolute
 * links because the blog is a separate host - plus the blog's own row:
 * its pages, search, categories and monthly archives.
 */
export default function BlogFooter({ categories, months }: { categories: Term[]; months: { year: number; month: number; count: number }[] }) {
  return (
    <footer id="rs-footer" className="rs-footer style1">
      <div className="footer-main">
        <div className="container-xxl">
          <div className="footer-grid">
            <div className="footer-brand">
              <a className="footer-wordmark" href={mainUrl("")}>
                IHERN
              </a>
              <p className="footer-org">India Higher Education Research Network</p>
              <p className="footer-desc">
                A collective of scholars in higher education in India, working to enhance research and studies in higher education in the
                country and build a research ecosystem that can feed into policy making.
              </p>
              <p className="b-footer-blog">
                <span>Blog:</span> <Link href="/">All posts</Link> <Link href="/about-us">About us</Link> <Link href="/subscribe">Subscribe</Link>
              </p>
            </div>

            <nav className="footer-col" aria-labelledby="footer-explore">
              <h2 className="footer-heading" id="footer-explore">Explore</h2>
              <ul className="footer-links">
                <li><a href={mainUrl("about")}>About</a></li>
                <li><a href={mainUrl("initiatives")}>Initiatives</a></li>
                <li><a href={mainUrl("members")}>Members</a></li>
                <li><a href={mainUrl("stc")}>Steering Committee</a></li>
                <li><a href={mainUrl("sig")}>SIGs</a></li>
              </ul>
            </nav>

            <nav className="footer-col" aria-labelledby="footer-research">
              <h2 className="footer-heading" id="footer-research">Research &amp; Events</h2>
              <ul className="footer-links">
                <li><a href={mainUrl("#events_heading")}>Webinars</a></li>
                <li><a href={mainUrl("iherc2026")}>IHERC 2026</a></li>
                <li><a href={mainUrl("reports")}>Reports &amp; Papers</a></li>
                <li><Link href="/">IHERN Blog</Link></li>
              </ul>
            </nav>

            <nav className="footer-col" aria-labelledby="footer-connect">
              <h2 className="footer-heading" id="footer-connect">Connect</h2>
              <ul className="footer-links">
                <li><a href="mailto:ihern@iiitd.ac.in">ihern@iiitd.ac.in</a></li>
                <li><a href={mainUrl("join")}>Join IHERN</a></li>
                <li>
                  <a href="https://www.linkedin.com/company/india-higher-education-research-network/about/" target="_blank" rel="noopener">
                    LinkedIn
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="b-footer-widgets">
            <section aria-labelledby="footer-search">
              <h2 className="footer-heading" id="footer-search">Search</h2>
              <form className="b-footer-search" action={u("/search")} method="get" role="search">
                <label className="ihern-visually-hidden" htmlFor="footer-q">Search the blog</label>
                <input id="footer-q" type="search" name="q" placeholder="Search" />
                <button type="submit" aria-label="Search">
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.41-5.4-5.39A8 8 0 1 1 10 2Zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" /></svg>
                </button>
              </form>
            </section>
            <nav aria-labelledby="footer-categories">
              <h2 className="footer-heading" id="footer-categories">Categories</h2>
              <ul className="footer-links">
                {categories.map((c) => (
                  <li key={c.id}><Link href={`/category/${c.slug}`}>{c.name}</Link></li>
                ))}
              </ul>
            </nav>
            <nav aria-labelledby="footer-archives">
              <h2 className="footer-heading" id="footer-archives">Archives</h2>
              <ul className="footer-links">
                {months.map((m) => (
                  <li key={`${m.year}-${m.month}`}>
                    <Link href={`/archive/${m.year}/${String(m.month).padStart(2, "0")}`}>{monthName(m.month)} {m.year}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container-xxl">
          <div className="footer-bottom-row">
            <div className="copyright">
              <p>&copy; {new Date().getFullYear()} IHERN IIITD. All rights reserved.</p>
            </div>
            {/* The credit sits on the right; LinkedIn is in the Connect column above. */}
            <p className="footer-credit">
              Developed by{" "}
              <a href="https://iiitd.ac.in/people/administration" target="_blank" rel="noopener">
                Web Admin
              </a>{" "}
              &amp;{" "}
              <a href="https://www.linkedin.com/in/mukulyadav525/" target="_blank" rel="noopener">
                Mukul Yadav
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
