import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { u } from "@/lib/paths";

export const metadata: Metadata = pageMeta(
  "iherc2025/program",
  "India Higher Education Research Conference 2025",
  "India Higher Education Research Conference 2025",
  null
);

/** The page's own styles (inline <style> blocks in the original HTML). */
const PAGE_CSS = `
li { list-style: none;}
      .nav-link {
    display: ruby-text !important;
    padding: 20px 20px 10px;
    font-weight: bold;
}
`;

export default function Iherc2025Program() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <header id="header-wrap">
        <nav className="navbar navbar-expand-xl bg-inverse fixed-top scrolling-navbar">
          <div className="container">
            <a href={u("/")} className="navbar-brand" aria-label="IHERN home">
              IHERN
            </a>
            {" "}
            <a href={u("/iherc2025")} className="nav-section">
              IHERC 2025
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
                <li className="nav-item ">
                  <a className="nav-link" href={u("/iherc2025")}>
                    Home
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2025#about")}>
                    About
                  </a>
                </li>
                <li className="nav-item active">
                  <a className="nav-link" href={u("/iherc2025/program")}>
                    Program
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2025#speakers")}>
                    Keynote Speakers
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2025#team")}>
                    Governance &amp; Management
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2025/abstract")}>
                    Abstract Submission
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2025#sponsors")}>
                    Sponsors
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2025#contact")}>
                    Contact
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
                  <img src={u("/iherc2025/assets/img/SRHE_blue_bg-removebg-preview.png")} alt="Society for Research into Higher Education (SRHE)" style={{ "width": "79%", "paddingTop": "32px" }} />
                </div>
              </div>
              <div className="col-lg-8 col-md-6 col-xs-12"></div>
              <div className="col-lg-2 col-md-6 col-xs-12">
                <div>
                  <img src={u("/iherc2025/assets/img/IHERN.png")} alt="India Higher Education Research Network (IHERN)" style={{ "width": "79%", "paddingTop": "32px" }} />
                </div>
              </div>
            </div>
            <center>
              <h1 className="head-title" style={{ "fontSize": "60px" }}>
                India Higher Education
                <br />
                {" "}Research Conference 2025
              </h1>
              <h2 className="head-title" style={{ "fontSize": "30px" }}>
                <i className="lni-map-marker"></i>
                {" "}R&amp;I Park, IIT Delhi
              </h2>
              <h2 className="head-title" style={{ "fontSize": "30px" }}>
                <i className="lni-calendar"></i>
                {" "}21-22, Nov 2025
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
                <h2 className="section-title wow fadeInUp" data-wow-delay="0.2s">
                  Program Overview
                </h2>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-10 col-md-12 col-xs-12">
              <div className="about-content">
                <div>
                  <h5>
                    Key Dates
                  </h5>
                  <ul className="stylish-list mb-3">
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      Abstract submission opens:{" "}
                      <strong>
                        21 April 2025
                      </strong>
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      Deadline for abstract submission:{" "}
                      <strong>
                        10 August 2025
                      </strong>
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      Registration open:{" "}
                      <strong>
                        20 September 2025
                      </strong>
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      Full draft paper submission:{" "}
                      <strong>
                        22 October 2025
                      </strong>
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      Conference dates:{" "}
                      <strong>
                        21-22 November 2025
                      </strong>
                    </li>
                  </ul>
                  <br />
                  <h5>
                    Themes
                  </h5>
                  <ul>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Employability and student success
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Equity and inclusion
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Expansion, Access, and Participation
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Financing in Higher Education
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Higher education and development
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Industry-academia relationship
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Internationalisation
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Policy in higher education
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Privatization and marketisation
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Research excellence and global competitiveness
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Sustainability
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Teaching quality and learning outcomes
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Technology integration or online higher education (Special session by NIEPA, Delhi)
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Third mission of universities
                    </li>
                    <li>
                      <i className="lni-check-mark-circle"></i>
                      {" "}Other topics of relevance to higher education in India
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
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
