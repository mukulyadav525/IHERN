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

/** Category, full registration amount, discounted rate (IHERN pays half). */
const FEES: [string, string, string][] = [
  ["IHERN Members", "Rs. 8000", "Rs. 4000"],
  ["Non-IHERN members/faculty/researchers", "Rs. 12000", "\u2014"],
  ["Students", "Rs. 3000", "Rs. 1500"],
];

export default function Iherc2026Registration() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <header id="header-wrap">
        <h1 className="ihern-visually-hidden">
          IHERC 2026 - Registration
        </h1>
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
                {" "}Indraprastha Institute of Information Technology Delhi
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
              <div className="about-text">
                <p align="justify" style={{ "marginBottom": "16px" }}>
                  We are pleased to invite you to register for the India Higher Education Research Conference (IHERC) 2026, organised by the India Higher Education Research Network (IHERN). The conference, centred on the theme &ldquo;Research into Practice and Practice into Research,&rdquo; will bring together researchers, faculty members, practitioners, policymakers and students to engage with emerging research, ideas and debates in higher education, in an Indian and global context. The conference will be held on 27-28 November 2026 at the Indraprastha Institute of Information Technology Delhi (IIIT-D), and will provide an important platform for sharing research, fostering scholarly exchange and strengthening the higher education research community.
                </p>
                <p align="justify" style={{ "marginBottom": "16px" }}>
                  To encourage wider participation, IHERN is offering special discounted registration rates to IHERN members and students. For this year&apos;s conference, IHERN will cover 50% of the registration fee for the two categories, enabling them to register at the discounted rates listed below. Participants who are not currently IHERN members are encouraged to become IHERN members to avail themselves of the member discount. Non-IHERN members/faculty/researchers will be required to pay the full registration amount.
                </p>
                <p align="justify" style={{ "marginBottom": "16px" }}>
                  Please note that you must compulsorily register to attend the conference. In case of papers that have multiple authors that are presenting, every presenter must be registered for the conference.
                </p>
              </div>
              <br />
              <div className="section-title-header text-center">
                <p className="iherc-notice" style={{ "fontWeight": "bold", "fontSize": "20px" }}>
                  Become an IHERN Member for FREE by filling out the{" "}
                  <a href={u("/join")} target="_blank" style={{ "textDecoration": "underline", "color": "rgb(0, 0, 0)" }}>
                    membership form.
                  </a>
                </p>
                <p className="iherc-notice">
                  (Please note your membership number for future reference)
                </p>
                <section id="register" style={{ "padding": "0", "margin": "0" }}>
                  <br />
                  <center>
                    <a className="btn btn-common" href="https://form.qfixonline.com/iherclink" target="_blank" rel="noopener">
                      Payment link for IHERC 2026
                    </a>
                  </center>
                  <br />
                </section>
                <h2 className="iherc-fee-title">
                  Registration fee
                </h2>
                <div className="fee-table-wrap">
                  <table className="fee-table">
                    <tbody>
                      <tr>
                        <th>
                          Category
                        </th>
                        <th>
                          Registration Amount
                        </th>
                        <th>
                          Discounted Rate*
                        </th>
                      </tr>
                      {FEES.map(([category, amount, discounted]) => (
                        <tr key={category}>
                          <td>
                            {category}
                          </td>
                          <td>
                            {amount}
                          </td>
                          <td>
                            {discounted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>
                  Note: All fees are exclusive of 18% GST.
                </p>
                <br />
                <p>
                  *The discounted rates for IHERN members and students reflect the 50% contribution towards registration by IHERN for IHERC 2026.
                </p>
                <p>
                  For any other information, please write to{" "}
                  <a href="mailto:jeemut@iiitd.ac.in">
                    jeemut@iiitd.ac.in
                  </a>
                </p>
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
