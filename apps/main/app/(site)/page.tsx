import type { Metadata } from "next";
import Link from "next/link";
import EventCard from "@/components/EventCard";
import { publishedEvents } from "@/lib/events";
import { pageMeta } from "@/lib/seo";
import { u } from "@/lib/paths";

export const metadata: Metadata = pageMeta(
  "",
  null,
  "India Higher Education Research Network (IHERN)",
  "IHERN is a collective of scholars in higher education in India, working to enhance research and studies in higher education in the country and build a research ecosystem that can feed into policy making."
);

export const dynamic = "force-dynamic";

/** How many past events the home page shows after the upcoming ones (the Events page has them all). */
const RECENT_PAST = 3;

export default async function HomePage() {
  // From the events admin (cdnm.ihern_events), shared between visitors.
  const events = await publishedEvents();
  const shown = events ? [...events.upcoming, ...events.past.slice(0, RECENT_PAST)] : [];
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
                      Nomination for Fellowship for 2026 for members will open shortly. All members will be informed about it and the process via email.
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
              {events === null ? (
                <p className="ihern-events-note">The events could not be loaded just now. Please try again shortly.</p>
              ) : shown.length ? (
                shown.map((ev) => <EventCard key={ev.id} ev={ev} />)
              ) : (
                <p className="ihern-events-note">New events will be announced here.</p>
              )}
              {events && events.past.length > RECENT_PAST ? (
                <p className="ihern-events-more">
                  <Link className="ihern-pair-btn" href="/events">All IHERN events</Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="rs-about ihern-full style1 pt-20 pb-20 md-pt-70 md-pb-70" id="activities">
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
