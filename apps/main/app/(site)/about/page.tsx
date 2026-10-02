import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { u } from "@/lib/paths";

export const metadata: Metadata = pageMeta(
  "about",
  "About",
  "About IHERN",
  "Why India needs a research network for higher education, the scope of IHERN's areas of interest, and how the network is supported."
);

export default function AboutPage() {
  return (
    <main id="main">
      <div className="container-fluid bg-primary py-5 mb-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white animated slideInDown">
                About IHERN
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
                  ABOUT IHERN
                </h2>
                <p align="justify">
                  Higher Education (HE) in itself is a subject for research. The breadth of potential research in HE is quite extensive and there are multiple relevant top-quality international journals and conferences. Many countries like the US, UK and Australia have research centers on HE. India has one of the largest higher education systems in the world with 1000+ universities / institutions with degree granting powers, and over 40,000 colleges. Despite such a vast system with huge investments, there are very few research centers and probably none in main research universities on this topic. There is also no scholarly conference in HE in India. Clearly, there is a need to enhance research on the Indian HE system which can help gain a better understanding of the system, its evolution, its drivers etc., and provide good research input for people involved in policy making and governing academia.
                </p>
                <p align="justify">
                  Given that the small number of researchers engaged in research in HE are distributed across HEIs, and the fact that, due to lack of academic programs in HE, no one institution will have sufficient strength of researchers/faculty in HE, one strategy for achieving the goal of enhancing research is to bring together HE researchers from different academic institutions to form a network for HE researchers/scholars in India.
                </p>
                <p align="justify">
                  The IHERN may define scope of areas of interest in a participative approach, which will evolve with time. Initially the scope includes:
                </p>
                <ul className="ihern-scope-list">
                  <li>
                    <span className="ihern-scope-key">
                      (a)
                    </span>
                    {" "}evolutionary studies
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (b)
                    </span>
                    {" "}governance / leadership of HE and training for it
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (c)
                    </span>
                    {" "}financing of HE and funding models
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (d)
                    </span>
                    {" "}research management and frameworks for promoting research excellence
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (e)
                    </span>
                    {" "}PhDs programs
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (f)
                    </span>
                    {" "}professionalization of HE administration
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (g)
                    </span>
                    {" "}enhancing linkages with industry and society including innovation and economic development
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (h)
                    </span>
                    {" "}internationalization of HE
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (i)
                    </span>
                    {" "}pathways towards multidisciplinary universities
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (j)
                    </span>
                    {" "}understanding of current HE system and its drivers
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (k)
                    </span>
                    {" "}classification of universities (like the Carnegie Classification)
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (l)
                    </span>
                    {" "}education quality and its improvement
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (m)
                    </span>
                    {" "}university cultures in India and their relationship to learning and research
                  </li>
                  <li>
                    <span className="ihern-scope-key">
                      (n)
                    </span>
                    {" "}Governmental oversight of HEIs
                  </li>
                </ul>
                <p align="justify">
                  The main goal “India Higher Education Research Network” (IHERN) is to bring together researchers in this area to form a global force. The Network will aim to enhance research and studies in HE in India, strengthen the research capacity and ecosystem in HE in India, and promote research/studies so that research outcomes can be used in decision making.
                </p>
                <p align="justify">
                  <strong>
                    IHERN is currently being supported through private donations by Ashish Dhawan, the Founder-Trustee of The Convergence Foundation; Hemant Kanakia, Chairman and Founder of Maker Bhavan Foundation; and Pankaj Jalote, currently a Distinguished Professor at IIIT-Delhi and its Founding Director (2008-2018). The funds have been committed for the initial three years, and the project is housed under IIIT-Delhi
                  </strong>
                  . It is hoped that in a few years IHERN will be firmly established and will become a self-supporting, self-governing body (e.g. formally become a society or a foundation, or become an arm of an existing society / foundation.
                </p>
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
