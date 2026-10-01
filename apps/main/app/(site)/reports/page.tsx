import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { u } from "@/lib/paths";

export const metadata: Metadata = pageMeta(
  "reports",
  "Reports & Papers",
  "Reports & Research Papers",
  "Reports and research papers from the India Higher Education Research Network (IHERN)."
);

export default function ReportsPage() {
  return (
    <main id="main">
      <div className="container-fluid bg-primary py-5 mb-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white animated slideInDown">
                Reports/Research Papers
              </h1>
            </div>
          </div>
        </div>
      </div>
      <div className="rs-about style2 pt-100 pb-100 md-pt-70 md-pb-70">
        <div className="container-xxl">
          <div className="row">
            <div className="col-lg-12 ">
              <div className="sec-title">
                <h2 className="title pb-22">
                  Reports/Papers
                </h2>
                <p align="justify">
                  Reports / Papers published by of members will be posted on IHERN site. In all cases, the copyright and ownership of any report/note/paper will be with the author, with his/her own affiliation. Only an acknowledgement of partial support by IHERN needs to be mentioned; the paper/reports will be posted on the IHERN website, and IHERN will promote the work done as supported by the network.
                </p>
                <center>
                  <div className="btn-part mt-45 md-mt-30">
                    <a className="readon consultant discover" href={u("/iherc%20report%202025-GK1812.pdf")}>
                      IHERC Report 2025
                    </a>
                  </div>
                </center>
              </div>
            </div>
          </div>
        </div>
        <div className="rs-animation">
          <div className="animate-style">
            <img className="scale" src={u("/assets/images/about/tri-circle-1.png")} alt="About" />
          </div>
        </div>
      </div>
    </main>
  );
}
