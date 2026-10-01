import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { u } from "@/lib/paths";

export const metadata: Metadata = pageMeta(
  "iherc2026/registration",
  "Registration - India Higher Education Research Conference 2026",
  "Registration - India Higher Education Research Conference 2026",
  "India Higher Education Research Conference (IHERC) 2026, organised by the India Higher Education Research Network (IHERN) on the theme 'Research into Practice and Practice into Research', 27–28 November 2026 at IIIT-Delhi."
);

/** The page's own styles (inline <style> blocks in the original HTML). */
const PAGE_CSS = `
li { list-style: none;}
      /* The page-local \`.nav-link { display: ruby-text !important }\` override was
         laying the navigation out as ruby annotation text and beat every
         stylesheet. Navbar styling now lives in assets/css/ihern-brand.css. */
`;

export default function Iherc2026Registration() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <h1 className="ihern-visually-hidden">
        IHERC 2026 - Registration
      </h1>
      <header id="header-wrap">
        <nav className="navbar navbar-expand-xl bg-inverse fixed-top scrolling-navbar">
          <div className="container">
            <a href={u("/")} className="navbar-brand" aria-label="IHERN home">
              IHERN
            </a>
            {" "}
            <a href={u("/iherc2026")} className="nav-section">
              IHERC 2026
            </a>
            {" "}
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
              <i className="lni-menu" aria-hidden="true"></i>
            </button>
            <div className="collapse navbar-collapse" id="navbarCollapse">
              <ul className="navbar-nav mr-auto w-100 justify-content-end">
                <li className="nav-item nav-item-parent d-sm-none">
                  <a className="nav-link" href={u("/")}>
                    ← Back to IHERN main website
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2026")}>
                    Home
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2026#about")}>
                    About
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2026#speakers")}>
                    Keynote Speakers
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2026#team")}>
                    Governance &amp; Management
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2026#travel")}>
                    Travel &amp; Accommodation
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2026#contact")}>
                    Contact
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2026#venue")}>
                    Venue
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div id="hero-area" className="hero-area-bg">
          <div className="container">
            <br />
            <br />
            <br />
            <br />
            <div className="row intro-wrapper">
              <div className="col-lg-2 col-md-6 col-xs-12">
                <div>
                  <img src={u("/iherc2026/assets/img/SRHE_blue_bg-removebg-preview.png")} alt="Society for Research into Higher Education" style={{ "width": "79%", "paddingTop": "32px" }} />
                </div>
              </div>
              <div className="col-lg-8 col-md-6 col-xs-12"></div>
              <div className="col-lg-2 col-md-6 col-xs-12">
                <div>
                  <img src={u("/iherc2026/assets/img/IHERN.png")} alt="India Higher Education Research Network" style={{ "width": "79%", "paddingTop": "32px" }} />
                </div>
              </div>
            </div>
            <center>
              <h2 className="head-title" style={{ "fontSize": "60px" }}>
                India Higher Education
                <br />
                {" "}Research Conference 2026
              </h2>
              <h2 className="head-title" style={{ "fontSize": "30px" }}>
                <i className="lni-map-marker"></i>
                {" "}R&amp;D Building, IIIT-Delhi
              </h2>
              <h2 className="head-title" style={{ "fontSize": "30px" }}>
                <i className="lni-calendar"></i>
                {" "}27-28 November 2026
              </h2>
            </center>
            <br />
            <br />
            <br />
            <br />
          </div>
        </div>
      </header>
      <main id="main">
      <section id="about" className="section-padding">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="section-title-header text-center">
                <h6 style={{ "fontWeight": "bold", "fontSize": "20px" }}>
                  IHERN members receive a 50% reduction on the registration fee for IHERC 2026.
                </h6>
                <h6 style={{ "fontWeight": "bold", "fontSize": "20px" }}>
                  Become an IHERN Member for FREE by filling out the{" "}
                  <a href={u("/join")} target="_blank" style={{ "textDecoration": "underline", "color": "rgb(0, 0, 0)" }}>
                    membership form.
                  </a>
                </h6>
                <h6>
                  (Please note your membership number for future reference)
                </h6>
                <h5>
                  Registration fee
                </h5>
                <div className="fee-table-wrap">
                  <table className="fee-table">
                    <tbody>
                      <tr>
                        <th>
                          CATEGORY
                        </th>
                        <th>
                          IHERN MEMBERS
                        </th>
                        <th>
                          NON-IHERN MEMBERS
                        </th>
                      </tr>
                      <tr>
                        <td>
                          Student
                        </td>
                        <td>
                          1500*
                        </td>
                        <td>
                          3000*
                        </td>
                      </tr>
                      <tr>
                        <td>
                          Faculty/Researcher
                        </td>
                        <td>
                          4000*
                        </td>
                        <td>
                          8000*
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  <strong>
                    *All fees are exclusive of 18% GST.
                  </strong>
                </p>
                <section id="register" style={{ "padding": "0", "margin": "0" }}>
                  <div className="row" style={{ "margin": "0" }}>
                    <div className="col-12" style={{ "padding": "0" }}>
                      <br />
                      <center>
                        <a className="btn btn-common" href="https://form.qfixonline.com/iiiddpof" target="_blank">
                          Pay Here
                        </a>
                      </center>
                      <br />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
          <div className="row"></div>
        </div>
      </section>
      </main>
      <footer id="iherc-footer" className="iherc-footer">
        <div className="footer-main">
          <div className="container">
            <div className="footer-grid">
              <div className="footer-brand">
                <a className="footer-wordmark" href={u("/")}>
                  IHERN
                </a>
                <p className="footer-org">
                  India Higher Education Research Network
                </p>
                <p className="footer-desc">
                  A collective of scholars in higher education in India, working to enhance research and studies in higher education in the country and build a research ecosystem that can feed into policy making.
                </p>
              </div>
              <nav className="footer-col" aria-labelledby="footer-explore">
                <h2 className="footer-heading" id="footer-explore">
                  Explore
                </h2>
                <ul className="footer-links">
                  <li>
                    <a href={u("/about")}>
                      About
                    </a>
                  </li>
                  <li>
                    <a href={u("/initiatives")}>
                      Initiatives
                    </a>
                  </li>
                  <li>
                    <a href={u("/members")}>
                      Members
                    </a>
                  </li>
                  <li>
                    <a href={u("/stc")}>
                      Steering Committee
                    </a>
                  </li>
                  <li>
                    <a href={u("/sig")}>
                      SIGs
                    </a>
                  </li>
                </ul>
              </nav>
              <nav className="footer-col" aria-labelledby="footer-research">
                <h2 className="footer-heading" id="footer-research">
                  Research &amp; Events
                </h2>
                <ul className="footer-links">
                  <li>
                    <a href={u("/#events_heading")}>
                      Webinars
                    </a>
                  </li>
                  <li>
                    <a href={u("/iherc2026")}>
                      IHERC 2026
                    </a>
                  </li>
                  <li>
                    <a href={u("/reports")}>
                      Reports &amp; Papers
                    </a>
                  </li>
                  <li>
                    <a href={u("/blogs")}>
                      IHERN Blog
                    </a>
                  </li>
                </ul>
              </nav>
              <nav className="footer-col" aria-labelledby="footer-connect">
                <h2 className="footer-heading" id="footer-connect">
                  Connect
                </h2>
                <ul className="footer-links">
                  <li>
                    <a href="mailto:ihern@iiitd.ac.in">
                      ihern@iiitd.ac.in
                    </a>
                  </li>
                  <li>
                    <a href={u("/join")}>
                      Join IHERN
                    </a>
                  </li>
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
          <div className="container">
            <div className="footer-bottom-row">
              <p className="footer-copyright">
                © 2026 IHERN IIITD. All rights reserved.{" "}
                <span className="footer-credit">
                  Developed by{" "}
                  <a href="https://iiitd.ac.in/people/administration" target="_blank" rel="noopener">
                    Web Admin
                  </a>
                  {" "}&amp;{" "}
                  <a href="https://www.linkedin.com/in/mukulyadav525/" target="_blank" rel="noopener">
                    Mukul Yadav
                  </a>
                </span>
              </p>
              <p className="footer-conf">
                IHERC 2026 ·{" "}
                <a href="mailto:iherc2026@iiitd.ac.in">
                  iherc2026@iiitd.ac.in
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
      <a href="#" className="back-to-top">
        <i className="lni-chevron-up"></i>
      </a>
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
      {" "}
    </>
  );
}
