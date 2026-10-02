import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { INITIATIVES } from "@/lib/initiatives";

/** Initiatives of IHERN. Content lives in lib/initiatives.ts. */

export const metadata: Metadata = pageMeta(
  "initiatives",
  "Initiatives",
  "Initiatives",
  "IHERN's active initiatives: Fellowships, the Senior Scholar Program, and the Research Grant for Human Resources."
);

export default function InitiativesPage() {
  const initiatives = INITIATIVES.filter((i) => i.status === "active");

  return (
    <main id="main">
      <div className="container-fluid bg-primary py-5 mb-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white animated slideInDown">Initiatives</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="rs-about style2 pb-100 md-pb-70">
        <div className="container-xxl">
          <div className="ini-intro">
            <h2 className="ini-lede">Initiatives of IHERN</h2>
            <p className="ini-sub">The following initiatives of IHERN are already in action.</p>
          </div>

          <div className="ini-list">
            {initiatives.map((item, i) => (
              <article className="ini-card" key={item.title}>
                <div className="ini-card-head">
                  <span className="ini-num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="ini-title">{item.title}</h3>
                    {item.summary ? <p className="ini-summary">{item.summary}</p> : null}
                  </div>
                </div>

                {item.facts?.length ? (
                  <dl className="ini-facts">
                    {item.facts.map(([label, value]) => (
                      <div className="ini-fact" key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                <div className="ini-body">
                  {item.body
                    .trim()
                    .split(/\n\s*\n/)
                    .map((para, j) => (
                      <p key={j}>{para.trim()}</p>
                    ))}
                </div>
              </article>
            ))}
          </div>

          {initiatives.length === 0 ? <p className="text-center text-muted">No initiatives are listed at the moment.</p> : null}
        </div>
      </div>
    </main>
  );
}
