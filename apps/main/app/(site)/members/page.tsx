import type { Metadata } from "next";
import MemberDirectory from "@/components/MemberDirectory";
import { cachedMemberDirectory } from "@/lib/cached";
import { pageMeta } from "@/lib/seo";
import { u } from "@/lib/paths";

export const metadata: Metadata = pageMeta(
  "members",
  "Members",
  "Members",
  "Senior Scholars, Fellows and Members of the India Higher Education Research Network (IHERN), with a searchable member directory."
);

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  // ihern2024.studentregistration, ordered by name; null when unreachable.
  const members = await cachedMemberDirectory();

  return (
    <main id="main">
      <div className="container-fluid bg-primary py-5 mb-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white animated slideInDown">
                IHERN Members
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
                  Senior Scholars
                </h2>
                <div className="tab-pane active" id="tab_one">
                  <div id="rs-team" className="rs-team style2 pb-100 md-pt-70 md-pb-70">
                    <div className="container">
                      <div className="row">
                        <div className="col-lg-4 col-md-6 mb-30">
                          <div className="team-item">
                            <div className="team-img">
                              <a href="https://web.iitd.ac.in/~rrao/" target="_blank">
                                <img src={u("/assets/images/team/portrait/prof-v-ramgopal-rao-ihern.jpg")} alt="Prof. V. Ramgopal Rao" loading="lazy" decoding="async" />
                              </a>
                            </div>
                            <div className="team-content">
                              <div className="team-info">
                                <div className="name">
                                  <a href="https://web.iitd.ac.in/~rrao/" target="_blank">
                                    Prof. V. Ramgopal Rao
                                  </a>
                                </div>
                                <span className="post">
                                  Vice-Chancellor, Birla Institute of Technology &amp; Science (Pilani, Hyderabad, Goa, Dubai &amp; Mumbai)
                                </span>
                                <br />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-30">
                          <div className="team-item">
                            <div className="team-img">
                              <a href="https://iihed.edu.in/professor-dr-n-v-varghese/">
                                <img src={u("/assets/images/team/portrait/prof-varghese-ihern.jpg")} alt="Prof. N.V. Varghese" loading="lazy" decoding="async" />
                              </a>
                            </div>
                            <div className="team-content">
                              <div className="team-info">
                                <div className="name">
                                  <a href="https://iihed.edu.in/professor-dr-n-v-varghese/">
                                    Prof. N.V. Varghese
                                  </a>
                                </div>
                                <span className="post">
                                  Distinguished Visiting Professor, IIT Bombay; Former Vice chancellor, NIEPA, New Delhi
                                </span>
                                <br />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-30">
                          <div className="team-item">
                            <div className="team-img">
                              <a href="https://jmi.ac.in/ACADEMICS/Departments/Department-Of-Management-Studies/Faculty-Members/1532/Furqan_Qamar">
                                <img src={u("/assets/images/team/portrait/prof-furqan-ihern.jpg")} alt="Prof. Furqan Qamar" loading="lazy" decoding="async" />
                              </a>
                            </div>
                            <div className="team-content">
                              <div className="team-info">
                                <div className="name">
                                  <a href="https://jmi.ac.in/ACADEMICS/Departments/Department-Of-Management-Studies/Faculty-Members/1532/Furqan_Qamar">
                                    Prof. Furqan Qamar
                                  </a>
                                </div>
                                <span className="post">
                                  Professor of Management - Jamia Millia Islamia
                                </span>
                                <br />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-30">
                          <div className="team-item">
                            <div className="team-img">
                              <a href="https://pankajchandra.com/" target="_blank">
                                <img src={u("/assets/images/team/portrait/prof-pankajchandra-ihern.jpg")} alt="Prof. Pankaj Chandra" loading="lazy" decoding="async" />
                              </a>
                            </div>
                            <div className="team-content">
                              <div className="team-info">
                                <div className="name">
                                  <a href="https://pankajchandra.com/" target="_blank">
                                    Prof. Pankaj Chandra
                                  </a>
                                </div>
                                <span className="post">
                                  Professor of Operations &amp; Technology Management at Amrut Mody School of Management and Vice-Chancellor, Ahmedabad University
                                </span>
                                <br />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-30">
                          <div className="team-item">
                            <div className="team-img">
                              <a href="https://plaksha.edu.in/faculty-details/dr-m-balakrishnan" target="_blank">
                                <img src={u("/assets/images/team/portrait/prof-mbalakrishna-ihern.jpg")} alt="Prof. M. Balakrishna" loading="lazy" decoding="async" />
                              </a>
                            </div>
                            <div className="team-content">
                              <div className="team-info">
                                <div className="name">
                                  <a href="https://www.cse.iitd.ernet.in/~mbala/" target="_blank">
                                    Prof. M. Balakrishna
                                  </a>
                                </div>
                                <span className="post">
                                  Distinguished Visiting Professor,{" "}
                                  <a href="https://plaksha.edu.in/faculty-details/dr-m-balakrishnan" target="_blank">
                                    Plaksha University
                                  </a>
                                  <br />
                                  Honorary Professor, CSE,{" "}
                                  <a href="https://www.cse.iitd.ernet.in/~mbala/" target="_blank">
                                    IIT Delhi
                                  </a>
                                </span>
                                <br />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h2 className="title pb-22">
                  Fellows
                </h2>
                <div className="tab-pane active" id="tab_f">
                  <div className="rs-team style2 pb-100 md-pt-70 md-pb-70">
                    <div className="container">
                      <div className="row">
                        <div className="col-lg-4 col-md-6 mb-30">
                          <div className="team-item">
                            <div className="team-img">
                              <a href="#">
                                <img src={u("/assets/images/team/portrait/debananda.jpg")} alt="Dr. Debananda Misra" loading="lazy" decoding="async" />
                              </a>
                            </div>
                            <div className="team-content">
                              <div className="team-info">
                                <div className="name">
                                  <a href="#">
                                    Dr. Debananda Misra
                                  </a>
                                </div>
                                <span className="post">
                                  IIT Delhi
                                </span>
                                <br />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-30">
                          <div className="team-item">
                            <div className="team-img">
                              <a href="#">
                                <img src={u("/assets/images/team/portrait/neetainamdar.jpg")} alt="Dr. Neeta Inamdar" loading="lazy" decoding="async" />
                              </a>
                            </div>
                            <div className="team-content">
                              <div className="team-info">
                                <div className="name">
                                  <a href="#">
                                    Dr. Neeta Inamdar
                                  </a>
                                </div>
                                <span className="post">
                                  Jean Monnet Chair, Research Professor at Symbiosis Centre for Higher Education Research and Policy Advocacy (SCHERPA), Pune
                                </span>
                                <br />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h2 className="title pb-22">
                  Members
                </h2>
                <div className="tab-pane active" id="tab_members">
                  <div className="rs-team style2 pb-100 md-pt-70 md-pb-70">
                    <div className="container-xxl">
                      {members === null ? (
                        <div className="alert alert-warning" role="alert">
                          The member directory is temporarily unavailable. Please try again shortly.
                        </div>
                      ) : members.length > 0 ? (
                        <MemberDirectory members={members} />
                      ) : (
                        <div className="alert alert-info" role="alert">
                          No members are listed yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="rs-animation">
        <div className="animate-style">
          <img className="scale" src={u("/assets/images/about/tri-circle-1.png")} alt="About" />
        </div>
      </div>
    </main>
  );
}
