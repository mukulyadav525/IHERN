import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { u } from "@/lib/paths";

export const metadata: Metadata = pageMeta(
  "",
  null,
  "India Higher Education Research Network (IHERN)",
  "IHERN is a collective of scholars in higher education in India, working to enhance research and studies in higher education in the country and build a research ecosystem that can feed into policy making."
);

export default function HomePage() {
  return (
    <main id="main">
      <h1 className="ihern-visually-hidden">
        India Higher Education Research Network (IHERN)
      </h1>
      <div id="rs-slider" className="rs-slider slider3">
        <div className="bend niceties">
          {/* One banner, shown at its own proportions. The PHP page ran the nivo
              slider over a single image; this is the markup it produced. */}
          <div id="nivoSlider" className="slides nivoSlider">
            <img className="nivo-main-image" src={u("/assets/images/banner/ihernbanner1.png")} alt="India Higher Education Research Network" />
          </div>
          <div id="slide-2" className="slider-direction">
            <div className="content-part">
              <div className="container">
                <div className="slider-des"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container-fluid ihern-band">
        <div className="row">
          <div className="col-md-12 ihern-notice">
            <a href={u("/iherc2026")} title="IHERC 2026">
              IHERN&apos;s Second annual conference, India Higher Education Research Conference (IHERC 2026)
            </a>
            {" "}
            <span className="ihern-new-badge">
              New
            </span>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="best-offer-right-content">
              <div className="row">
                <div className="col-md-12 pd-l"></div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="best-offer-left-content">
              <div className="row">
                <div className="col-md-12 pd-r">
                  <div className="sec-title">
                    <h2 className="title pb-22">
                      Welcome to IHERN
                    </h2>
                    <p className="margin-0 pt-15" align="justify">
                      India Higher Education Research Network (IHERN) is a collective of scholars in higher education in India. The vision of IHERN is to enhance research and studies in higher education in the country and build a research ecosystem that can feed into policy making. The objective of IHERN is to make it a hub for higher education research in India through various projects, events and evidence synthesis and policy advocacy.
                    </p>
                    <br />
                    <p align="justify">
                      Activities of IHERN are presently conceived and driven by a Steering Committee. Over a period of time, IHERN will have Members who are either early researchers or established scholars from different academic institutions, and centres engaged in research and study of higher education in India. The Membership to IHERN is not limited to Indian scholars and is extended to international scholars working on higher education in India. Membership fee for the first year is waived off.
                    </p>
                    <p align="justify">
                      The Members of IHERN will receive invitations for the Monthly Seminars on higher education research organized by IHERN and will be eligible to apply for Fellowships, for RFPs for Research Grants announced periodically by IHERN. The Members will also be eligible for conference fee waivers and travel support for presenting papers in high-quality international conferences, subject to agreements with conferences.
                    </p>
                    <p align="justify">
                      Join IHERN. Membership is now open. If you are a researcher in the field of higher education in India and interested in joining IHERN, please send an email to{" "}
                      <strong>
                        <a href="mailto:ihern@iiitd.ac.in">
                          ihern@iiitd.ac.in
                        </a>
                      </strong>
                      {" "}. Or join online using{" "}
                      <strong>
                        <a href={u("/join")}>
                          this form
                        </a>
                      </strong>
                      . As of now, the membership fee is waived.
                    </p>
                    <p align="justify">
                      Nomination for Fellowship for 2025 for members will open shortly. All members will be informed about it and the process via email.
                    </p>
                    <div className="btn-part mt-45 md-mt-30">
                      <a className="readon consultant discover" href={u("/join")}>
                        Join IHERN
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="rs-about style1 pt-20 pb-20 md-pt-70 md-pb-70" id="events_heading">
        <div className="container-xxl">
          <div className="row">
            <div className="col-lg-12 pr-5 md-pr-2 md-mb-50">
              <div className="sec-title mb-30">
                <h2 className="title mb-23">
                  Events
                </h2>
              </div>
            </div>
            <div className="col-lg-12 pr-5 md-pr-2 md-mb-50">
              <div className="sec-title2 mb-30 event-card">
                <p className="event-badge">
                  IHERN SIGs Webinar
                </p>
                <h4>
                  Inaugural IHERN Special Interest Groups (SIGs) Webinar
                </h4>
                <p>
                  The inaugural IHERN Special Interest Groups (SIGs) Webinar will provide an opportunity to introduce the IHERN SIGs, discuss their objectives and proposed activities, and explore how members can become active participants in the activities of their SIGs.
                </p>
                <dl className="event-meta">
                  <dt>
                    Date
                  </dt>
                  <dd>
                    Monday, 21 September 2026
                  </dd>
                  <dt>
                    Time
                  </dt>
                  <dd>
                    10:30 AM IST
                  </dd>
                  <dt>
                    Venue
                  </dt>
                  <dd>
                    Online (Zoom)
                  </dd>
                </dl>
                <p>
                  Please fill in the Google Form to help us gauge your interest in the SIGs. Your responses will help us better understand the scope of the SIGs and enable us to develop meaningful activities for them.
                </p>
                <p className="event-actions">
                  <a className="event-poster-btn" href="https://iiitd-ac-in.zoom.us/j/94327035439?pwd=xsH9qyEAaw06NawgiGPxvaCKpmhBLg.1" target="_blank" rel="noopener">
                    Join via Zoom
                  </a>
                  {" "}
                  <a className="event-poster-btn" href="https://docs.google.com/forms/d/e/1FAIpQLSdPZszVfFi6JCnBbqNcnDhxQ9_MiSO1vuMUsMkj5AkWjvPnjA/viewform" target="_blank" rel="noopener">
                    SIGs interest form{" "}
                    <span className="ihern-file-note">
                      (Google Form)
                    </span>
                  </a>
                </p>
              </div>
              <div className="sec-title2 mb-30 event-card">
                <p className="event-badge">
                  IHERN Webinar
                </p>
                <h4>
                  Introducing the Emerging &apos;Components Toward an Indigenous Inclusive College Readiness Framework&apos; for Tribal Youth in India- Plus, Steps Forward
                </h4>
                <p>
                  A session of the IHERN Higher Education Research Webinar Series, featuring a talk on Introducing the Emerging &apos;Components Toward an Indigenous Inclusive College Readiness Framework&apos; for Tribal Youth in India- Plus, Steps Forward. The talk will unpack the nuances of what it means to be &apos;college ready&apos; among the tribal youth of Odisha and Jharkhand, and how the knowledge gained can help them build a bridge program between the tribal communities and colleges.
                </p>
                <dl className="event-meta">
                  <dt>
                    Date
                  </dt>
                  <dd>
                    Friday, 29 May 2026
                  </dd>
                  <dt>
                    Time
                  </dt>
                  <dd>
                    10:30 AM IST
                  </dd>
                  <dt>
                    Venue
                  </dt>
                  <dd>
                    Online (Zoom)
                  </dd>
                </dl>
                <p className="event-speakers">
                  <strong>
                    Speakers
                  </strong>
                  <br />
                  <strong>
                    Matthew A. Witenstein
                  </strong>
                  , Associate Professor of Educational Leadership and Policy, University of New Mexico
                  <br />
                  {" "}Anthony J. Chipre, EdD Student, University of New Mexico
                </p>
                <p className="event-actions">
                  <a className="event-poster-btn" href={u("/IHERN%20Webinar%2029%20May%202026.pdf")} target="_blank" rel="noopener">
                    View webinar poster{" "}
                    <span className="ihern-file-note">
                      (PDF)
                    </span>
                  </a>
                </p>
                <hr />
              </div>
              <div className="sec-title2 mb-30 event-card">
                <p className="event-badge">
                  IHERN Webinar
                </p>
                <h4>
                  Integrating Research into Undergraduate Teacher Education
                </h4>
                <p>
                  A session of the IHERN Higher Education Research Webinar Series, featuring a talk on Integrating Research into Undergraduate Teacher Education. The talk will delve into the nature of integrating research into higher education with special reference to initial teacher education, and an empirical study of a project(s) in the B.El.Ed teacher education degree programme of University of Delhi.
                </p>
                <dl className="event-meta">
                  <dt>
                    Date
                  </dt>
                  <dd>
                    Thursday, 23 April 2026
                  </dd>
                  <dt>
                    Time
                  </dt>
                  <dd>
                    3:00 PM IST
                  </dd>
                  <dt>
                    Venue
                  </dt>
                  <dd>
                    Online (Zoom)
                  </dd>
                </dl>
                <p className="event-speakers">
                  <strong>
                    Speakers
                  </strong>
                  <br />
                  <strong>
                    Dr. Gunjan Sharma
                  </strong>
                  , Associate Professor, School of Education Studies, Dr. B.R. Ambedkar University Delhi
                  <br />
                  <strong>
                    Prof. Jyoti Raina
                  </strong>
                  , Professor of Education, Gargi College, University of Delhi
                </p>
                <p className="event-actions">
                  <a className="event-poster-btn" href={u("/23rd%20Webinar%20Final%20IHERN.pdf")} target="_blank" rel="noopener">
                    View webinar poster{" "}
                    <span className="ihern-file-note">
                      (PDF)
                    </span>
                  </a>
                </p>
                <hr />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="rs-about style1 pt-20 pb-20 md-pt-70 md-pb-70" id="activities">
        <div className="container-xxl">
          <div className="row">
            <div className="col-lg-12 pr-5 md-pr-2 md-mb-50">
              <div className="sec-title mb-30">
                <h2 className="title mb-23">
                  Main Activities of{" "}
                  <span>
                    IHERN
                  </span>
                </h2>
              </div>
            </div>
            <div className="col-lg-12 pr-5 md-pr-2 md-mb-50">
              <div className="sec-title2 mb-30">
                <p align="justify">
                  Currently there are a few focused activities which are planned to establish and grow IHERN. Each activity is being led by a Member (for the next few years these members are likely to be recipients of fellowships) For each of these activities, the lead forms a small team. Support for these will be provided by IHERN Steering Committee.
                </p>
                <ol className="ihern-activities">
                  <li>
                    <strong>
                      Online Seminars on Higher Education:
                    </strong>
                    {" "}As a research network, one of the key activities is to promote good research by having virtual seminars by researchers from India and abroad. Notice for the Seminars will be posted on the website, and emails will be sent to all Members with details of the Seminar presenter and the topic.
                  </li>
                  <li>
                    <strong>
                      IHERN Annual Conference (Led by: Debanand Misra, IIT Delhi):
                    </strong>
                    {" "}IHERN&apos;s first Annual Conference on Higher Education in India (IHERC 2025) was held on 21-22 November 2025 at the R&amp;I Park, IIT Delhi. The conference aims to be self-supporting through sponsorships and registration fees, with initial support provided by IHERN. Prof. Philip Altbach (Boston College, USA) and Prof. Pankaj Chandra (Ahmedabad University) are serving as General Chairs of the conference. Dr. Debananda Misra (IHERN Fellow) and Dr. Camille B. Kandiko Howson(Imperial College London, UK) have taken on the role of Program chair for the conference.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
