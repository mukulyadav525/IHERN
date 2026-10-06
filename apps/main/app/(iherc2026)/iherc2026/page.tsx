import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { u } from "@/lib/paths";

export const metadata: Metadata = pageMeta(
  "iherc2026",
  "India Higher Education Research Conference 2026",
  "India Higher Education Research Conference 2026",
  "India Higher Education Research Conference (IHERC) 2026, organised by the India Higher Education Research Network (IHERN) on the theme 'Research into Practice and Practice into Research', 27–28 November 2026 at IIIT-Delhi."
);

/** The page's own styles (inline <style> blocks in the original HTML). */
const PAGE_CSS = `
li { list-style: none;}
      /* The page-local \`.nav-link { display: ruby-text !important }\` override was
         laying the navigation out as ruby annotation text and beat every
         stylesheet. Navbar styling now lives in assets/css/ihern-brand.css. */

#clock {
              display: flex;
              justify-content: center;
              gap: 30px;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }

          .time-box {
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.3);
              padding: 20px;
              border-radius: 12px;
              min-width: 80px;
          }

              .time-box h2 {
                  color: #fff;
                  font-size: 36px;
                  margin: 0;
              }

              .time-box span {
                  color: #fff;
                  font-size: 16px;
                  display: block;
                  margin-top: 5px;
              }

          @media (max-width: 576px) {
              #clock {
                  flex-wrap: wrap;
                  gap: 15px;
              }

              .time-box {
                  min-width: 60px;
                  padding: 15px;
              }

                  .time-box h2 {
                      font-size: 28px;
                  }
          }
`;

type Person = { name: string; role: string; photo: string };
type CommitteeMember = { name: string; org: string; place: string; photo?: string };

const SPEAKER_IMG = "/iherc2026/assets/img/speaker/";
const COMMITTEE_IMG = "/assets/images/team/committee/";

/*
 * The people on this page. Each section's heading follows its count
 * ("Distinguished Speaker" for one, "Distinguished Speakers" for more), so
 * adding or removing someone here is all an update needs.
 */
const KEYNOTE_SPEAKERS: Person[] = [
  { name: "Prof. Ananya Mukherjee", role: "Vice-Chancellor, Shiv Nadar University", photo: SPEAKER_IMG + "ananya-mukherjee.jpg" },
  { name: "Prof. Graeme Atherton", role: "Associate Pro-Vice-Chancellor (Regional Engagement), Vice-Principal, Ruskin College, University of West London", photo: SPEAKER_IMG + "Graeme%20Atherton.jpg" },
  { name: "Prof. Simon Marginson", role: "Professor of Higher Education, Linacre College, University of Oxford", photo: SPEAKER_IMG + "Simon%20Marginson.jpg" },
];

const DISTINGUISHED_SPEAKERS: Person[] = [
  { name: "Prof. Philip Altbach", role: "Professor Emeritus, Boston College", photo: SPEAKER_IMG + "Philip%20Altbach.jpg" },
];

const GENERAL_CHAIRS: Person[] = [
  { name: "Prof. Fazal Rizvi", role: "University of Melbourne, Australia", photo: SPEAKER_IMG + "proffazal.jpg" },
  { name: "Prof. N.V. Varghese", role: "National Institute of Educational Planning and Administration", photo: "/iherc2026/Varghese-Photo-1.jpg" },
];

const PROGRAM_CHAIRS: Person[] = [
  { name: "Prof. Saumen Chattopadhyay", role: "Jawaharlal Nehru University", photo: SPEAKER_IMG + "Saumen-Chattopadhyay.jpg" },
  { name: "Dr. Gwilym Croucher", role: "University of Melbourne, Australia", photo: SPEAKER_IMG + "dr-gwilym-croucher_.jpg" },
];

const PROGRAM_COMMITTEE: CommitteeMember[] = [
  { name: "Camille B. Kandiko Howson", org: "Imperial College", place: "London, UK", photo: COMMITTEE_IMG + "camille-kandiko-howson.jpg" },
  { name: "Debananda Misra", org: "Indian Institute of Technology Delhi", place: "India", photo: COMMITTEE_IMG + "debananda-misra.jpg" },
  { name: "Emon Nandi", org: "Tata Institute of Social Sciences", place: "Mumbai, India", photo: COMMITTEE_IMG + "emon-nandi.jpg" },
  { name: "Giulio Marini", org: "University of Catania", place: "Italy", photo: COMMITTEE_IMG + "giulio-marini.jpg" },
  { name: "Malish C.M.", org: "Indian Institute of Technology Bombay", place: "India", photo: COMMITTEE_IMG + "malish-cm.jpg" },
  { name: "Matthew A. Witenstein", org: "University of New Mexico", place: "USA", photo: COMMITTEE_IMG + "matthew-witenstein.jpg" },
  { name: "Miguel Antonio Lim", org: "The University of Manchester", place: "UK", photo: COMMITTEE_IMG + "miguel-antonio-lim.jpg" },
  { name: "Sayantan Mandal", org: "Jawaharlal Nehru University", place: "New Delhi, India", photo: COMMITTEE_IMG + "sayantan-mandal.jpg" },
];

/** "Keynote Speaker" for one person, "Keynote Speakers" for several. */
const titled = (people: unknown[], singular: string) => (people.length === 1 ? singular : singular + "s");

/** Initials for someone without a photograph ("Malish C.M." -> "MC"). */
const initials = (name: string) => {
  const words = name.replace(/\./g, " ").split(/\s+/).filter(Boolean);
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};

function PeopleRow({ people, col }: { people: Person[]; col: string }) {
  return (
    <div className="row justify-content-center">
      {people.map((p) => (
        <div className={col} key={p.name}>
          <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
            <div className="team-img">
              <img className="img-fluid" src={u(p.photo)} alt={p.name} width="240" height="309" loading="lazy" decoding="async" />
              <div className="team-overlay">
                <div className="overlay-social-icon text-center"></div>
              </div>
            </div>
            <div className="info-text">
              <h3>
                <a href="#">
                  {p.name}
                </a>
              </h3>
              <p>
                {p.role}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Iherc2026Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <header id="header-wrap">
        <h1 className="ihern-visually-hidden">
          India Higher Education Research Conference 2026 (IHERC 2026)
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
                <li className="nav-item active">
                  <a className="nav-link" href="#header-wrap" aria-current="page">
                    Home
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#about">
                    About
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#speakers">
                    Keynote Speakers
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#team">
                    Governance &amp; Management
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#travel">
                    Travel &amp; Accommodation
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#contact">
                    Contact
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#venue">
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
            <div className="row intro-wrapper"></div>
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
            <div className="hero-actions">
              <a className="btn btn-common" href={u("/iherc2026/Call%20for%20Papers%20August%202026-%20IHERC%202026.pdf")} target="_blank" rel="noopener">
                Call for Papers
              </a>
              {" "}
              <a className="btn btn-common" href="https://cmt3.research.microsoft.com/IHERC2026/Submission/Index" target="_blank" rel="noopener">
                Abstract Submission
              </a>
              {" "}
              <a className="btn btn-common" href={u("/iherc2026/registration")}>
                Registration for IHERC 2026
              </a>
            </div>
            <section id="register" style={{ "padding": "0", "margin": "0" }}>
              <div className="row" style={{ "margin": "0" }}>
                <div className="col-12" style={{ "padding": "0" }}></div>
              </div>
            </section>
            <br />
            <br />
            <br />
            <br />
          </div>
        </div>
      </header>
      {" "}
      <main id="main">
      <section id="about" className="section-padding">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12 col-xs-12">
              <div className="about-content">
                <div>
                  <div className="about-text">
                    <center>
                      <p>
                        The Microsoft CMT service was used for managing the peer-reviewing process for this conference. This service was provided for free by Microsoft and they bore all expenses, including costs for Azure cloud services as well as for software development and support.
                      </p>
                    </center>
                    <br />
                    <h3>
                      About the Conference
                    </h3>
                    <p align="justify">
                      The India Higher Education Research Network (IHERN) will be holding its Second Annual India Higher Education Research Conference (IHERC) on the theme of &apos;Research into Practice and Practice into Research&apos; on 27-28 November 2026 at IIIT-Delhi. The conference will explore the interlinkages between research and practice and how they inform and impact one another in the field of higher education. It will bring together a diverse set of stakeholders including students, researchers, governments and communities on a common platform, and examine the field of higher education through both local and global perspectives.
                    </p>
                    <p>
                      <strong>
                        The sub-themes of this year&apos;s conference include-
                      </strong>
                    </p>
                    <ul>
                      <li>
                        » Higher Education, National Development and Global Public Good
                      </li>
                      <li>
                        » Teaching, Learning and Assessment in Higher Education
                      </li>
                      <li>
                        » Student Experiences and Learning Trajectories
                      </li>
                      <li>
                        » Equity, Access and Inclusion in Higher Education, including Gender
                      </li>
                      <li>
                        » Digital Transformation and Educational Possibilities
                      </li>
                      <li>
                        » Governance, Leadership and Managing Institutional Change
                      </li>
                      <li>
                        » Internationalisation of Higher Education and Global Collaboration and Engagement
                      </li>
                      <li>
                        » Research Policy, Funding, and the Changing Nature of Academic Work
                      </li>
                      <li>
                        » The Role of Higher Education in Driving Cultures of Innovation
                      </li>
                    </ul>
                    <br />
                    <h3>
                      About IHERC 2025
                    </h3>
                    <p align="justify">
                      IHERN&apos;s first annual flagship conference on &apos;Advancing Research on Higher Education in India&apos; was successfully held on 21-22 November 2025 at IIT-Delhi&apos;s R&amp;I Park, and saw participation from a diverse community of scholars, practitioners, policymakers and students, both nationally and internationally. Over two days, 175 participants, including 113 presenters, engaged with 58 research papers and 39 poster presentations across multi-track sessions. The academic program featured parallel sessions, thematic panels, poster showcases, and three insightful keynote lectures, creating a dynamic environment for exchange and critical inquiry. Discussions spanned a wide spectrum of themes- ranging from equitable access and student success, internationalization and mobility, AI, digital and online higher education, governance and financing, interdisciplinarity, research excellence, and the role of higher education in national development. The conference was organized in collaboration with the Society for Research into Higher Education (SRHE), UK, and supported by Ahmedabad University, the Department of Science &amp; Technology (DST), Government of India, and Indian Council of Social Science Research (ICSSR).
                    </p>
                    <center>
                      <p>
                        <a className="btn btn-common" href={u("/iherc%20report%202025-GK1812.pdf")} target="_blank">
                          IHERC 2025 Report
                        </a>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{" "}
                        <a className="btn btn-common" href={u("/iherc2025")} target="_blank">
                          IHERC 2025 Website
                        </a>
                      </p>
                    </center>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="speakers" className="section-padding text-center">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="section-title-header text-center">
                <h2 className="section-title wow fadeInUp" data-wow-delay="0.2s">
                  {titled(KEYNOTE_SPEAKERS, "Keynote Speaker")}
                </h2>
              </div>
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="governance-content">
                <PeopleRow people={KEYNOTE_SPEAKERS} col="col-md-4" />
              </div>
              <hr />
            </div>
          </div>
        </div>
      </section>
      <section id="team" className="section-padding text-center">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h4>
                {titled(DISTINGUISHED_SPEAKERS, "Distinguished Speaker")}
              </h4>
              <PeopleRow people={DISTINGUISHED_SPEAKERS} col="col-md-4" />
            </div>
          </div>
          <br />
          <br />
          <div className="row">
            <div className="col-12">
              <div className="section-title-header text-center">
                <h2 className="section-title wow fadeInUp" data-wow-delay="0.2s">
                  Governance and Management
                </h2>
              </div>
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="governance-content">
                <h3>
                  {titled(GENERAL_CHAIRS, "General Chair")}
                </h3>
                <PeopleRow people={GENERAL_CHAIRS} col="col-md-6" />
                <hr />
                <h3>
                  {titled(PROGRAM_CHAIRS, "Program Chair")}
                </h3>
                <PeopleRow people={PROGRAM_CHAIRS} col="col-md-6" />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="program-committee" className="iherc-committee" aria-labelledby="program-committee-title">
        <div className="container">
          <div className="section-title-header text-center">
            <h2 className="section-title" id="program-committee-title">
              IHERC 2026 Program Committee
            </h2>
            <p>
              The Program Committee of the India Higher Education Research Conference 2026, organised by IHERN.
            </p>
          </div>
          <ul className="iherc-committee-grid">
            {PROGRAM_COMMITTEE.map((m) => (
              <li className="iherc-person" key={m.name}>
                {m.photo ? (
                  <img className="iherc-person-photo" src={u(m.photo)} alt={m.name} width="300" height="300" loading="lazy" decoding="async" />
                ) : (
                  <span className="iherc-person-photo iherc-person-initials" aria-hidden="true">
                    {initials(m.name)}
                  </span>
                )}
                <h3 className="iherc-person-name">
                  {m.name}
                </h3>
                <p className="iherc-person-org">
                  {m.org}
                </p>
                <p className="iherc-person-place">
                  {m.place}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section id="contact" className="section-padding">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="section-title-header text-center">
                <h2 className="section-title wow fadeInUp" data-wow-delay="0.2s">
                  Contact
                </h2>
              </div>
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-4 col-md-6 col-sm-8">
              <div className="team-row">
                <div className="team-item" style={{ "textAlign": "center" }}>
                  <div className="team-img">
                    <img className="img-fluid" src={u("/iherc2026/pic.jpeg")} alt="Gauri Khanna" />
                    <div className="team-overlay">
                      <div className="overlay-social-icon text-center"></div>
                    </div>
                  </div>
                  <div className="info-text" style={{ "textAlign": "center" }}>
                    <h3>
                      <a href="#">
                        Gauri Khanna
                      </a>
                    </h3>
                    <p style={{ "color": "#000" }}>
                      Organising Committee Chair
                    </p>
                    <p style={{ "color": "#000" }}>
                      <a href="mailto:iherc2026@iiitd.ac.in">
                        iherc2026@iiitd.ac.in
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-sm-8">
              <div className="team-row">
                <div className="team-item" style={{ "textAlign": "center" }}>
                  <div className="team-img">
                    <img className="img-fluid" src={u("/iherc2026/jeemut.jpg")} alt="Jeemut Pratim Das" />
                    <div className="team-overlay">
                      <div className="overlay-social-icon text-center"></div>
                    </div>
                  </div>
                  <div className="info-text" style={{ "textAlign": "center" }}>
                    <h3>
                      <a href="#">
                        Jeemut Pratim Das
                      </a>
                    </h3>
                    <p style={{ "color": "#000" }}>
                      Conference Manager
                    </p>
                    <p style={{ "color": "#000" }}>
                      <a href="mailto:jeemut@iiitd.ac.in">
                        jeemut@iiitd.ac.in
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <br />
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-12 col-xs-12"></div>
          </div>
        </div>
      </section>
      <section id="travel" style={{ "padding": "0", "margin": "0" }}>
        <div className="row" style={{ "margin": "0" }}>
          <div className="col-12" style={{ "padding": "0" }}>
            <br />
            <center>
              <a className="btn btn-common" href={u("/iherc2026/Conference%20Travel%20Information.pdf")} target="_blank">
                Travel &amp; Accommodation Guidelines
              </a>
            </center>
            <br />
          </div>
        </div>
      </section>
      <section id="venue" className="iherc-venue" aria-labelledby="venue-title">
        <div className="container">
          <div className="section-title-header text-center">
            <h2 className="section-title" id="venue-title">
              Venue
            </h2>
          </div>
          <div className="iherc-venue-grid">
            <div className="iherc-venue-info">
              <p className="iherc-venue-label">
                Conference venue
              </p>
              <h3 className="iherc-venue-name">
                R&amp;D Building
              </h3>
              <p className="iherc-venue-org">
                Indraprastha Institute of Information Technology Delhi (IIIT-Delhi)
                <br />
                New Delhi, India
              </p>
              <dl className="iherc-venue-facts">
                <dt>
                  Dates
                </dt>
                <dd>
                  27–28 November 2026
                </dd>
                <dt>
                  Email
                </dt>
                <dd>
                  <a href="mailto:iherc2026@iiitd.ac.in">
                    iherc2026@iiitd.ac.in
                  </a>
                </dd>
              </dl>
              <a className="btn btn-common iherc-venue-open" href="https://www.google.com/maps/search/?api=1&query=R%26D%20Building%2C%20IIIT-Delhi%2C%20New%20Delhi" target="_blank" rel="noopener">
                Open in Google Maps
              </a>
            </div>
            <div className="iherc-venue-map">
              <iframe title="Map: R&D Building, IIIT-Delhi, New Delhi" src="https://www.google.com/maps?q=R%26D%20Building%2C%20IIIT-Delhi%2C%20New%20Delhi&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen></iframe>
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
