import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { u } from "@/lib/paths";

export const metadata: Metadata = pageMeta(
  "sig",
  "SIGs",
  "Special Interest Groups (SIGs)",
  "The Special Interest Groups (SIGs) of the India Higher Education Research Network (IHERN), their themes, coordinators and activities."
);

export default function SigsPage() {
  return (
    <main id="main">
      <div className="container-fluid bg-primary py-5 mb-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white animated slideInDown">
                Special Interest Groups (SIGs)
              </h1>
            </div>
          </div>
        </div>
      </div>
      <div className="rs-about ihern-full style2 pt-100 pb-100 md-pt-70 md-pb-70">
        <div className="container-xxl">
          <div className="row">
            <div className="col-lg-12 ">
              <div className="sec-title">
                <h2 className="title pb-22">
                  Special Interest Groups (SIGs)
                </h2>
                <p align="justify">
                  As a part of our efforts to foster collaboration and scholarly engagement among researchers, students, practitioners and policymakers, IHERN is pleased to announce the formation of four Special Interest Groups (SIGs) on key themes of higher education. The individual SIGs will be in-charge of their respective aims, scope, vision and functioning, with IHERN providing a collaborative platform to get the process off the ground.
                </p>
                <h3>
                  1. Leadership in Higher Education: An impetus for national development
                </h3>
                <p align="justify">
                  Higher Education research serves as the primary engine for translating theoretical frameworks into societal progress. The correlation between higher education and development of the nation is extremely high. By systematically investigating the nexus of leadership, governance and outcomes, we can move beyond conventional thinking and make the sector more robust. Leadership is the cornerstone for all aspects of higher education, the deficit of which leads to further deficits in allied areas. Effective and impactful leadership creates a domino effect, fostering knowledge creation, skill development and employability options. Further, it strengthens a nation’s research capacity through global collaboration and evidence-based insights. Consequently, these outcomes empower policymakers to build a resilient, future-ready society, where informed decision-making enhances both institutional excellence and an onward march for humankind.
                  <br />
                  <br />
                  {" "}The SIG will function through a series of activities such as webinars, lectures by the group leaders, case study preparations, and dissemination and discussion forums.
                </p>
                <p className="sig-leads">
                  <strong>
                    <span className="sig-lead-role">
                      Coordinator:
                    </span>
                    {" "}Prof. Aarti Srivastava, National Institute of Educational Planning and Administration (NIEPA), New Delhi.
                    <br />
                    {" "}
                    <span className="sig-lead-role">
                      Co-Lead:
                    </span>
                    {" "}Prof. Kavita Gupta, Rishihood University, Sonipat.
                  </strong>
                </p>
                <h3>
                  2. Equity, Access and Inclusion in Higher Education
                </h3>
                <p align="justify">
                  India is one of the largest higher education systems in the world, enrolling over 4.3 crore students. Despite rapid expansion especially at the turn of the new century, higher education access, participation and outcome remain deeply unequal. Income, family background, pre-college educational backgrounds, gender, and physical ability continue to remain as factors shaping equitable distribution of higher educational opportunities. Further, the growth of the private sector and gradual state withdrawal from public funding are known factors shaping the unequal trajectory of higher education development. Scholarly knowledge suggests that as the society progresses, inequality takes new forms and processes to reinforce continuity in social reproduction, especially at the higher education level that holds the keys to upward economic and presumably, social mobility. Breaking this vicious circle of inequality is the foundational goal of equity policies. In this regard, the National Education Policy (NEP) 2020 emphasizes &quot;inclusive and equitable quality of education for all”. Taking a note of simultaneous global technological advancements, the policy has duly acknowledged and accepted integration of technology with education at all the levels as a part of imparting 21st century skills.{" "}
                  <br />
                  <br />
                  {" "}The most prominent technology with transformative impact is Artificial Intelligence (AI). It has been proposed to provide a bridge towards inclusionary higher education. Whether the introduction of technology produces normative educational outcomes for those belonging to the disadvantaged communities or converges with traditional exclusionary markers to yield ever existing disparity (largely on primordial lines), is a concerning content of research on inclusion in higher education institutions in India.
                  <br />
                  <br />
                  {" "}This Special Interest Group (SIG) as a network of scholars on equity and inclusion provides a platform for discussing and debating theoretical developments, methodological innovations and empirical realities on access, equity and inclusion.{" "}
                  <br />
                  <br />
                  {" "}The SIG will focus on the entire spectrum of higher education, from access and enrolment to retention, success, and career outcomes. It will include conducting events such as webinars to share research and inform practice, hosting of policy dialogues, and exploring avenues for joint research and knowledge dissemination.
                </p>
                <p className="sig-leads">
                  <strong>
                    <span className="sig-lead-role">
                      Coordinators:
                    </span>
                    {" "}Dr. Malish C.M., Ashank Desai Centre for Policy Studies, IIT Bombay.
                    <br />
                    {" "}
                    <span className="sig-lead-role">
                      Co-Leads:
                    </span>
                    {" "}Dr. Dharma Rakshit Gautam, National Institute of Educational Planning and Administration (NIEPA), New Delhi.
                  </strong>
                </p>
                <h3>
                  3. Economics of Higher Education
                </h3>
                <p align="justify">
                  While the contributions of higher education (HE) to the economy and society are well recognised in research and policy, relatively little is known about new mechanisms for measuring its productivity. An important development that has often been discussed in the recent upsurge of higher education research is the generation of new empirical evidence on the contributions of HE using big data. Rigorous empirical studies in the economics of higher education help build clear causal evidence on how HE improves the economy and society, thereby contributing to evidence-based policymaking. For example, changes in the nature of work due to structural changes in the economy and the integration of technology, continuous changes in the skill sets in the work space, and, more importantly, global demographic shifts frequently alter the relationship between higher education and labour market, which urges us to generate a new discussion on this issue in the domain of economics of higher education.
                  <br />
                  <br />
                  {" "}Connecting higher education to behavioural economics is another emerging research area in the economics of higher education domain. With an increasing emphasis on new evidence-based research in the economics of higher education, we need trained graduates who can handle big data to problematise the emerging complexities between higher education and development. An important and growing body of teaching and research in the economics of education focuses on causal inference as a method for establishing evidence using big economic and social data. However, a major share of new research in this domain comes from the developed world. In India, we find few places for teaching and research in the empirical economics of higher education.{" "}
                  <br />
                  <br />
                  {" "}The SIG on economics of higher education aims to generate a new teaching and research discourse on higher education and human capital, with a clear focus on developing analytical and data skills among graduates. The SIG has three core objectives-{" "}
                  <br />
                  {" "}● To introduce the exciting developments, in both teaching and research in economics of higher education
                  <br />
                  {" "}● To develop methodological skills among early and mid-career researchers to use big data to study first-order issues in economics of higher education research
                  <br />
                  {" "}● To connect learners with practitioners in higher education, so as to bridge the gap between research and policy in economics of higher education.{" "}
                  <br />
                  <br />
                  {" "}We aim to achieve these objectives through policy webinars and round tables, invited talks, workshops on data and analytical skills, organising seminars and conferences, and publishing working papers in applied economics of higher education.
                </p>
                <p className="sig-leads">
                  <strong>
                    <span className="sig-lead-role">
                      <span className="sig-lead-role">
                        Coordinator:
                      </span>
                    </span>
                    {" "}Dr. Pradeep Kumar Choudhury, Zakir Husain Centre for Educational Studies, Jawaharlal Nehru University (JNU), New Delhi.
                    <br />
                    {" "}
                    <span className="sig-lead-role">
                      Co-Lead:
                    </span>
                    {" "}Dr. Jnyanranjan Sahoo, Consultant, National Council for Teacher Education (NCTE), New Delhi.
                  </strong>
                </p>
                <h3>
                  4. Doctoral Education
                </h3>
                <p align="justify">
                  Since the beginning of the 21st century, globalization and governments’ aspirations to transform their countries into knowledge societies have brought significant changes to doctoral education worldwide. In many countries, including India, the number of doctoral candidates and doctoral-granting institutions has increased, with the intention of strengthening national innovation and improving the research performance of individual institutions.
                  <br />
                  <br />
                  {" "}New approaches to doctoral education emphasize multidisciplinary or interdisciplinary research, often involving more than one principal investigator or supervisor and collaboration with other universities and with institutions outside academia, such as industry, hospitals, and NGOs. Doctoral students are increasingly expected to develop professional competencies in interdisciplinary and intersectoral communication, grant writing, and translating research into socially useful products, practices, and policies.
                  <br />
                  <br />
                  {" "}Scholarship on doctoral education has proliferated over the past two decades. Yet, despite the growing policy attention to and reform of doctoral education, these changes have received relatively little systematic scholarly attention in India.
                  <br />
                  <br />
                  {" "}It is time for India to examine the forces driving changes in doctoral education and to understand the forms these changes are taking.
                  <br />
                  <br />
                  {" "}The SIG on Doctoral Education intends to support research on the various dimensions of doctoral education while also providing guidance and mentoring to current doctoral students.
                  <br />
                </p>
                <p>
                  <strong>
                    Specifically, it intends to:
                  </strong>
                </p>
                <p>
                  (i) Advance research on doctoral education by calling for research paper submissions on a broad range of topics relevant to doctoral education in India. Examples include:
                </p>
                ● the motivations of Indian students for pursuing doctoral education in specific disciplines;
                <br />
                {" "}● the challenges doctoral students face at different stages of doctoral programs at Indian universities;
                <br />
                {" "}● the professional training doctoral students receive during their PhD programs to prepare them for academic and non-academic careers;
                <br />
                {" "}● institutional mechanisms for the inclusion of minority and marginalized groups;
                <br />
                {" "}● the labor market for doctorate holders in India; and
                <br />
                {" "}● basic data on doctoral students by discipline, class, caste, gender, time-to-degree, completion rates, marital status, and parental status;
                <br />
                {" "}● AI and the evolving landscape of doctoral education.
                <br />
                <br />
                <p>
                  (ii) Guide and mentor current doctoral students by sponsoring Zoom mock presentations to help students prepare for conference presentations; organizing a breakfast exclusively for doctoral students at the conference; and facilitating informal meetings during the conference to help students develop peer networks.
                </p>
                <p>
                  (iii) Highlight the importance of effective doctoral supervision by encouraging mandatory doctoral supervisor training at universities and offering workshops on doctoral supervision and supervisor training as part of the pre-conference program of the annual meetings.
                </p>
                <p>
                  (iv) Initiate the development of a book on Indian doctoral education, tentatively titled What Every Doctoral Student in India Needs to Know, written collaboratively with doctoral students, postdoctoral researchers, mid-career scholars, and senior professors.
                </p>
                <p className="sig-leads">
                  <strong>
                    <span className="sig-lead-role">
                      <span className="sig-lead-role">
                        Coordinator:
                      </span>
                    </span>
                    {" "}Prof. Maresi Nerad, Professor of Higher Education, University of Washington, Seattle
                    <br />
                    {" "}
                    <span className="sig-lead-role">
                      Co-Leads:
                    </span>
                    {" "}Prof. Mousumi Mukherjee, Professor and Deputy Director, IIHEd, O.P. Jindal Global University
                    <br />
                    {" "}Prof. Neeta Inamdar, Jean Monnet Chair and Professor, Symbiosis International (Deemed University).
                  </strong>
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
