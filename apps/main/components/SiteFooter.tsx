import Link from "next/link";

/**
 * The shared site footer (includes/site-footer.php). Every link points at a
 * page that exists on this site; nothing here is invented.
 */
export default function SiteFooter() {
  return (
    <footer id="rs-footer" className="rs-footer style1">
      <div className="footer-main">
        <div className="container-xxl">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link className="footer-wordmark" href="/">
                IHERN
              </Link>
              <p className="footer-org">India Higher Education Research Network</p>
              <p className="footer-desc">
                A collective of scholars in higher education in India, working to enhance research and studies in higher
                education in the country and build a research ecosystem that can feed into policy making.
              </p>
            </div>

            <nav className="footer-col" aria-labelledby="footer-explore">
              <h2 className="footer-heading" id="footer-explore">
                Explore
              </h2>
              <ul className="footer-links">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/initiatives">Initiatives</Link></li>
                <li><Link href="/members">Members</Link></li>
                <li><Link href="/stc">Steering Committee</Link></li>
                <li><Link href="/sig">SIGs</Link></li>
              </ul>
            </nav>

            <nav className="footer-col" aria-labelledby="footer-research">
              <h2 className="footer-heading" id="footer-research">
                Research &amp; Events
              </h2>
              <ul className="footer-links">
                <li><Link href="/#events_heading">Webinars</Link></li>
                <li><Link href="/iherc2026">IHERC 2026</Link></li>
                <li><Link href="/reports">Reports &amp; Papers</Link></li>
                <li><Link href="/blogs">IHERN Blog</Link></li>
              </ul>
            </nav>

            <nav className="footer-col" aria-labelledby="footer-connect">
              <h2 className="footer-heading" id="footer-connect">
                Connect
              </h2>
              <ul className="footer-links">
                <li><a href="mailto:ihern@iiitd.ac.in">ihern@iiitd.ac.in</a></li>
                <li><Link href="/join">Join IHERN</Link></li>
                <li>
                  <a href="https://www.linkedin.com/company/india-higher-education-research-network/about/" target="_blank" rel="noopener">
                    LinkedIn
                  </a>
                </li>
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
