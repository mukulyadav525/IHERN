import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { u } from "@/lib/paths";

export const metadata: Metadata = pageMeta(
  "stc",
  "Steering Committee",
  "Steering Committee",
  "The Steering Committee of the India Higher Education Research Network (IHERN), which formulates policies and procedures and provides overall guidance to the network."
);

export default function SteeringCommitteePage() {
  return (
    <main id="main">
      <div className="container-fluid bg-primary py-5 mb-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white animated slideInDown">
                Steering Committee
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
                  Steering Committee
                </h2>
                <p align="justify">
                  There will be Steering Committee (SC) with a coordinator. This SC will formulate policies and procedures, and will provide overall guidance / direction to this initiative. The SC will have representatives of the supporters/funders, two senior scholars, two fellows, and a few external members. The fellows and senior scholars will elect/choose a coordinator for their activities and meetings, and will nominate members to the SC.
                </p>
              </div>
            </div>
          </div>
          <div className="tab-pane active" id="tab_one">
            <div id="rs-team" className="rs-team style2 pb-100 md-pt-70 md-pb-70">
              <div className="container">
                <div className="row">
                  <div className="col-lg-4 col-md-6 mb-30">
                    <div className="team-item">
                      <div className="team-img">
                        <a href="#">
                          <img src={u("/assets/images/team/portrait/pankaj-jalote1.jpg")} alt="Pankaj Jalote" loading="lazy" decoding="async" />
                        </a>
                      </div>
                      <div className="team-content">
                        <div className="team-info">
                          <div className="name">
                            <a href="https://iiitd.ac.in/jalote" target="_blank">
                              Pankaj Jalote
                            </a>
                          </div>
                          <span className="post">
                            Emeritus Professor at IIIT-Delhi and its Founding Director
                          </span>
                          {" "}
                          <span className="post">
                            (Founder)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6 mb-30">
                    <div className="team-item">
                      <div className="team-img">
                        <a href="#">
                          <img src={u("/assets/images/team/portrait/ashish-dhawan1.jpg")} alt="Ashish Dhawan" loading="lazy" decoding="async" />
                        </a>
                      </div>
                      <div className="team-content">
                        <div className="team-info">
                          <div className="name">
                            <a href="#">
                              Ashish Dhawan
                            </a>
                          </div>
                          <span className="post">
                            Founder - Trustee of The Convergence Foundation
                          </span>
                          {" "}
                          <span className="post">
                            (Founder)
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
                          <img src={u("/assets/images/team/portrait/hemant-kanakia1.jpg")} alt="Hemant Kanakia" loading="lazy" decoding="async" />
                        </a>
                      </div>
                      <div className="team-content">
                        <div className="team-info">
                          <div className="name">
                            <a href="#">
                              Hemant Kanakia
                            </a>
                          </div>
                          <span className="post">
                            Chairman and Founder of Maker Bhavan Foundation
                          </span>
                          {" "}
                          <span className="post">
                            (Founder)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6 mb-30">
                    <div className="team-item">
                      <div className="team-img">
                        <a href="#">
                          <img src={u("/assets/images/team/portrait/claire.jpg")} alt="Claire Loughlin-Chow" loading="lazy" decoding="async" />
                        </a>
                      </div>
                      <div className="team-content">
                        <div className="team-info">
                          <div className="name">
                            <a href="#">
                              Claire Loughlin-Chow
                            </a>
                          </div>
                          <span className="post">
                            CEO, Society for Research into Higher Education
                          </span>
                          {" "}
                          <br />
                          <br />
                        </div>
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
      </div>
    </main>
  );
}
