import type { Metadata } from "next";
import SiteDocument, { SITE_TITLE, siteMetadata } from "@/app/_components/SiteDocument";
import { u } from "@/lib/paths";

/**
 * Any address that is not a page: the site's 404, inside the site frame.
 *
 * A global not-found page (next.config.mjs, experimental.globalNotFound)
 * rather than a catch-all route calling notFound(): Next 15 sends a page that
 * calls notFound() as an empty shell drawn only by JavaScript, while this
 * page arrives as complete HTML (status 404) and reads without JavaScript.
 */

export const metadata: Metadata = {
  ...siteMetadata,
  title: `Page not found - ${SITE_TITLE}`,
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <SiteDocument>
      <main id="main">
        <div className="container-fluid bg-primary py-5 mb-5 page-header">
          <div className="container py-5">
            <div className="row justify-content-center">
              <div className="col-lg-10 text-center">
                <h1 className="display-3 text-white">Page not found</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="rs-about style2 pb-100 md-pb-70">
          <div className="container-xxl">
            {/* centred, as the blog's "Page not found" */}
            <div className="sec-title text-center">
              <p>The page you were looking for is not here. It may have moved, or the address may be mistyped.</p>
              <div className="btn-part mt-45 md-mt-30">
                {" "}
                <a className="readon consultant discover" href={u("/")}>
                  Go to the IHERN home page
                </a>{" "}
              </div>
            </div>
          </div>
        </div>
      </main>
    </SiteDocument>
  );
}
