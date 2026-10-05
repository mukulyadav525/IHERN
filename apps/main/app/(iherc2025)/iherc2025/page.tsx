import type { Metadata } from "next";
import Countdown from "@/components/iherc/Countdown";
import { pageMeta } from "@/lib/seo";
import { u } from "@/lib/paths";

export const metadata: Metadata = pageMeta(
  "iherc2025",
  "India Higher Education Research Conference 2025",
  "India Higher Education Research Conference 2025",
  // From the page's own "About The Conference".
  "India Higher Education Research Conference (IHERC) 2025, organised by the India Higher Education Research Network (IHERN), held on 21–22 November 2025 at IIT Delhi."
);

/** The page's own styles (inline <style> blocks in the original HTML). */
const PAGE_CSS = `
li { list-style: none;}
      .nav-link {
    display: ruby-text !important;
    padding: 20px;
    font-weight: bold;
}

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

.team-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .team-item {
    flex: 1;
    margin: 10px;
    text-align: center;
  }

  .team-img img {
    max-width: 100%;
    height: auto;
  }

  .info-text h3 a {
    color: #333;
    text-decoration: none;
  }

  .info-text p {
    color: #777;
  }

/* inline !important styles from the original markup */

.ih-imp-b22855{ font-size: 26px !important; }

.ih-imp-77c5e4{ font-size: 20px !important; }
`;

export default function Iherc2025Home() {
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
                <li className="nav-item active">
                  <a className="nav-link" href="#header-wrap">
                    Home
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#about">
                    About
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href={u("/iherc2025/program")}>
                    Program
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
                  <a className="nav-link" href={u("/iherc2025/abstract")}>
                    Abstract Submission
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#sponsors">
                    Sponsors
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
            <section id="register" style={{ "padding": "0", "margin": "0" }}>
              <div className="row" style={{ "margin": "0" }}>
                <div className="col-12" style={{ "padding": "0" }}>
                  <br />
                  <center>
                    <a className="btn btn-common" href={u("/iherc%20report%202025-GK1812.pdf")} target="_blank">
                      Report 2025
                    </a>
                  </center>
                  <br />
                  <br />
                  <center>
                    <a className="btn btn-common" href={u("/iherc2025/accepted%20Papers%202.pdf")} target="_blank">
                      Accepted Papers
                    </a>
                  </center>
                  <br />
                </div>
              </div>
            </section>
            <br />
            <br />
            <br />
            <br />
          </div>
        </div>
      </header>
      <main id="main">
      <section id="count" style={{ "backgroundColor": "#F6F9F9", "padding": "1px 0" }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-10">
              <div className="count-wrapper text-center">
                <div className="time-countdown wow fadeInUp" data-wow-delay="0.2s">
                  <Countdown target="Nov 21, 2025 00:00:00" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {" "}
      <section id="about" className="section-padding">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12 col-xs-12">
              <div className="about-content">
                <div>
                  <div className="about-text">
                    <h2>
                      About The Conference
                    </h2>
                    <p align="justify">
                      India Higher Education Research Network (IHERN) is organizing the flagship higher education research conference. The India Higher Education Research Conference (IHERC) will be conducted on 21-22 November, 2025 at IIT Delhi. The conference will serve as a platform for presenting high-quality research of relevance to Indian higher education, and also for discussing practice and policy issues relating to Indian higher education. The conference will enable and promote research in the scholarly field of higher education, and linking the same with the practice and policy of higher education in India.
                      <br />
                      <br />
                      IHERC 2025 will be at the intersection of various scholarly fields, including but not limited to higher education studies, the empirical context of higher education in India, and the practice and policy of higher education in India. The conference expects to have participation from the global scholarly community, with interests in Indian higher education.
                    </p>
                    <h3>
                      About Higher Education Research
                    </h3>
                    <p align="justify">
                      Higher education research is a growing field that explores how universities and colleges function, evolve, and impact society. It draws from disciplines like sociology, economics, public policy, and education studies to understand how students learn, how institutions are governed, how policies are shaped, and how teaching and research can be made more inclusive, equitable, and effective.
                      <br />
                      <br />
                      This area of research helps us ask important questions about access, quality, funding, innovation, and purpose in higher education—questions that are central to shaping the future of learning and knowledge creation in India and across the world.
                    </p>
                    <h3>
                      Themes
                    </h3>
                    <p>
                      <strong>
                        The conference will be organized around contemporary topics about higher education in India, including but not limited to the below
                      </strong>
                    </p>
                    <ul>
                      <li>
                        » Employability and student success
                      </li>
                      <li>
                        » Equitable Access and Success in Higher Education: India and the Rest of the World (session by World Access to Higher Education Network (WAHEN), University of West London, UK)
                      </li>
                      <li>
                        » Expansion, Access, and Participation in Higher Education
                      </li>
                      <li>
                        » Financing in Higher Education
                      </li>
                      <li>
                        » Higher education and development
                      </li>
                      <li>
                        » Industry academia relationship
                      </li>
                      <li>
                        » Internationalisation of higher education
                      </li>
                      <li>
                        » Policy in higher education
                      </li>
                      <li>
                        » Privatization and marketisation
                      </li>
                      <li>
                        » Research excellence and global competitiveness
                      </li>
                      <li>
                        » Sustainability in higher education
                      </li>
                      <li>
                        » Teaching quality and learning outcomes
                      </li>
                      <li>
                        » Technology integration or online higher education (Special session by NIEPA, Delhi)
                      </li>
                      <li>
                        » Probing Interdisciplinarity: Goals, Contours and Response (Special session by IIM, Ahmedabad)
                      </li>
                      <li>
                        » Third mission of universities
                      </li>
                      <li>
                        » Other topics of relevance to higher education in India
                      </li>
                    </ul>
                    <br />
                    <h3 className="ih-imp-b22855">
                      Special Sessions
                    </h3>
                    <p align="justify">
                      Special sessions will focus on specific thematic areas within the broader conference topics. Authors submitting their abstracts to the conference will have the option to submit their papers under a relevant special session. Details of the special sessions are provided below.
                    </p>
                    <h3 className="ih-imp-77c5e4">
                      Transnational Education (TNE) Development in India (by: Commonwealth Tertiary Education Facility (CTEF), c/o Universiti Sains Malaysia (USM), Penang, Malaysia)
                    </h3>
                    <p align="justify">
                      The proposer for this special session is The Commonwealth Tertiary Education Facility (CTEF) (https://ctef.com.my/v2/) , which is a collaborative entity between the Ministry of Higher Education Malaysia and the Commonwealth Secretariat in London (https://thecommonwealth.org/). CTEF role is to share best practices in the development of Malaysia higher education system with other developing countries in the Commonwealth. In Malaysia, Transnational education (TNE) in the form of partnerships with foreign institutions, started in the early 1950s. Over the decades, Malaysia has developed a robust TNE framework, hosting numerous international branch campuses and fostering collaborations with foreign universities. Arguably, TNE has become a key driver for Malaysia’s engagement in global higher education, enabling Malaysians and other students in Asia to access international qualifications. Over the years, Malaysia has and continues to host numerous international branch campuses, collaborates with prestigious universities from the UK, Australia, Japan, and China, and promotes blended learning models to enhance accessibility and quality. In 1998, the first branch campus, Monash University Malaysia, was established, followed quickly by the University of Nottingham Malaysia Campus in 2000. These international branch campuses have set a benchmark for quality assurance and institutional collaboration, reinforced by a proactive approach and regulatory regime by the Malaysian Qualifications Agency (MQA).{" "}
                      <br />
                      <br />
                      {" "}In India, the development of TNE is still at an early stage. However, the National Education Policy (NEP) 2020 encourages international collaboration and allows foreign universities to establish campuses in India. The increasing demand for higher education in India presents an opportunity to structure the TNE expansion, particularly in technology, healthcare, and management. By leveraging Malaysia’s experiences, potential research areas for India’s TNE development are wide-ranging, such as developing policy framework for sustainable TNE growth, curriculum development, enhanced student mobility and employability, and public-private partnerships in the provision of TNE.
                    </p>
                    <h3 className="ih-imp-77c5e4">
                      Digital Technology Integration in Teaching and Learning in Indian Higher Education (by Centre for Policy Research in Higher Education (CPRHE), National Institute of Educational Planning and Administration (NIEPA), New Delhi)
                    </h3>
                    <p align="justify">
                      Digital technology has emerged as a viable tool to support teaching and learning in higher education globally. The role of digital technology becomes much more vital for the Indian higher education sector, which is the second-largest higher education system in the world with an enrolment of 43.3 million and a Gross Enrolment Ratio (GER) of 28.4%, which National Education Policy 2020 (NEP) aims to increase to 50% by 2035. There are three vital aspects of digital technology in Indian higher education. The first is understanding how higher education institutions (HEIs) in India integrate digital technology into teaching and learning. The second is institutional policies and mechanisms regarding the use of digital technology. The third significant aspect is understanding the factors that work as promoters and inhibitors. This special session will specifically answer three vital questions
                    </p>
                    <ul>
                      <li>
                        1. How do India HEIs integrate digital technologies in teaching and learning?
                      </li>
                      <li>
                        2. What are institutional mechanisms to promote the integration of digital technology in teaching and learning in Indian HEIs?
                      </li>
                      <li>
                        3. What are the factors (promoters, inhibitors) in integrating digital technology in teaching and learning in Indian HEIs?
                      </li>
                    </ul>
                    <br />
                    <h3 className="ih-imp-77c5e4">
                      Probing Interdisciplinarity: Goals, Contours and Responses (by: Indian Institute of Management, Ahmedabad)
                    </h3>
                    <p align="justify">
                      Research on interdisciplinarity highlights both its potential benefits and inherent complexities. While challenges such as the ongoing climate catastrophe, transformational changes in technology and geopolitics risks abound, critical questions on the ability of higher education systems to respond to them are being raised (Miotto et al., 2020). The need for interdisciplinarity has been a much-cited reform (Gibbons et al., 1994). Along these lines, India&apos;s National Education Policy (NEP) 2020 advocates a shift toward flexible, multidisciplinary learning, recommending Multidisciplinary Education and Research Universities to embed interdisciplinarity structurally (NEP, 2020). Similarly, the University Grant Commission&apos;s (UGC) (2022) guidelines emphasize curricular flexibility, cross-disciplinary collaboration, and institutional integration. However, scholars note that translating these policy aspirations into practice remains uneven as Indian universities continue to navigate structural constraints and entrenched disciplinary boundaries (Chandra, 2017; Jalote, 2021). Literature suggests that while structural commitments often increase interdisciplinary outputs, they may not consistently translate into greater scholarly impact, especially across cognitively distant fields (Leahey et al., 2017; Leahey &amp; Barringer, 2020).{" "}
                      <br />
                      <br />
                      {" "}This special session at IHERC 2025 invites theoretical contributions, empirical studies, institutional case analyses, and practitioner insights examining how interdisciplinarity is conceptualized, structured, and experienced within Indian higher education. Submissions may address governance models, curriculum design, faculty and student experiences, institutional practices, and stakeholder perspectives. Key questions include: How is interdisciplinarity implemented beyond policy rhetoric? What institutional structures and practices facilitate or hinder interdisciplinary integration? How do faculty and students navigate interdisciplinary identities, and what are the implications for knowledge legitimacy, professional careers, and graduate pathways? How do external stakeholders perceive interdisciplinary qualifications, and how might global practices and experiences inform India&apos;s evolving interdisciplinary strategies?
                    </p>
                    <h3 className="ih-imp-77c5e4">
                      Equitable access and success in higher education: India and the rest of the world ( By: World Access to Higher Education Network (WAHEN) @ University of West London, UK)
                    </h3>
                    <p align="justify">
                      The session will examine connections between the key challenges and opportunities to extend access to higher education for those from low income and other marginalised communities in India and the rest of the world. India has ambitions to extend participation in its higher education system whilst also creating opportunities for those from lower caste and income groups as well as rural, disabled and other groups who face difficulties in entering higher education. Achieving these goals will be challenging. There is no country in the world where inequalities in access and success by social background do not exist. However, there is a growing community of researchers, policymakers academics and leaders who are working individually and together on ways of meeting this challenge. It is vital that work in India can be strengthened by deepening the theoretical basis and practical knowledge relating to equity work through dialogue nationally and globally. The session will include a keynote address which brings the present Indian context together with the global picture now. We would then like to feature papers that examined the equitable access and success issue in India from a thematic perspective (e.g. looking at financial barriers and access: how higher education is understood in different communities, student experiences of specific student populations); a policy perspective at ether the national, regional or institutional level and potentially a paper the includes content from India and another country(ies). We will be keen in the session to ensure that there is time for discussion to explore bridging and common points emerging from across the papers and in particular looking to establish several areas where further enquiry and collaboration would be valuable. Given the present geo-political climate a session that looks at equity in higher education placing India in the global context that is knowledge and solution focused could be extremely valuable.
                    </p>
                    <br />
                    <h3>
                      Keydates
                    </h3>
                    <ul>
                      <li>
                        <strong>
                          »
                        </strong>
                        {" "}Abstract submission opens:{" "}
                        <strong>
                          21 April 2025
                        </strong>
                      </li>
                      <li>
                        <strong>
                          »
                        </strong>
                        {" "}Deadline for abstract submission:{" "}
                        <strong>
                          10 August 2025
                        </strong>
                      </li>
                      <li>
                        <strong>
                          »
                        </strong>
                        {" "}Registration open:{" "}
                        <strong>
                          20 September, 2025
                        </strong>
                      </li>
                      <li>
                        <strong>
                          »
                        </strong>
                        {" "}Conference dates:{" "}
                        <strong>
                          21-22 November, 2025
                        </strong>
                      </li>
                    </ul>
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
                  Keynote Speakers
                </h2>
              </div>
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="governance-content">
                <div className="row">
                  <div className="col-md-4">
                    <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                      <div className="team-img">
                        <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/profvramgopalrao.jpg")} alt="profvramgopalrao" width="240" height="309" />
                        <div className="team-overlay">
                          <div className="overlay-social-icon text-center"></div>
                        </div>
                      </div>
                      <div className="info-text">
                        <h3>
                          <a href="#">
                            Prof. V. Ramgopal Rao
                          </a>
                        </h3>
                        <p>
                          Vice Chancellor, BITS Pilani, India
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                      <div className="team-img">
                        <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/proffazal.jpg")} alt="proffazal" width="240" height="309" />
                        <div className="team-overlay">
                          <div className="overlay-social-icon text-center"></div>
                        </div>
                      </div>
                      <div className="info-text">
                        <h3>
                          <a href="#">
                            Prof. Fazal Rizvi
                          </a>
                        </h3>
                        <p>
                          Professor, University of Melbourne, Australia
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                      <div className="team-img">
                        <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/profabhay.jpg")} alt="proffazal" width="240" height="309" />
                        <div className="team-overlay">
                          <div className="overlay-social-icon text-center"></div>
                        </div>
                      </div>
                      <div className="info-text">
                        <h3>
                          <a href="#">
                            Prof. Abhay Karandikar
                          </a>
                        </h3>
                        <p>
                          Secretary, Department of Science &amp; Technology (DST), Government of India
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
                <h4>
                  General Chairs
                </h4>
                <div className="row">
                  <div className="col-md-6">
                    <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                      <div className="team-img">
                        <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/pankajchandra.jpg")} alt="Pankaj Chandra" width="240" height="309" />
                        <div className="team-overlay">
                          <div className="overlay-social-icon text-center"></div>
                        </div>
                      </div>
                      <div className="info-text">
                        <h3>
                          <a href="#">
                            Pankaj Chandra
                          </a>
                        </h3>
                        <p>
                          Ahmedabad University, India
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                      <div className="team-img">
                        <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/philipaltbach.jpeg")} alt="PHILIP-G.-ALTBACH" width="240" height="309" />
                        <div className="team-overlay">
                          <div className="overlay-social-icon text-center"></div>
                        </div>
                      </div>
                      <div className="info-text">
                        <h3>
                          <a href="#">
                            Philip Altbach
                          </a>
                        </h3>
                        <p>
                          Boston College, USA
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <hr />
                <h4>
                  Program Chairs
                </h4>
                <div className="row">
                  <div className="col-md-6">
                    <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                      <div className="team-img">
                        <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/camille.jpg")} alt="Camille B. Kandiko Howson" width="240" height="309" />
                        <div className="team-overlay">
                          <div className="overlay-social-icon text-center"></div>
                        </div>
                      </div>
                      <div className="info-text">
                        <h3>
                          <a href="#">
                            Camille B. Kandiko Howson
                          </a>
                        </h3>
                        <p>
                          Imperial College London, UK
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                      <div className="team-img">
                        <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/debananda.jpg")} alt="Debananda Misra" width="240" height="309" />
                        <div className="team-overlay">
                          <div className="overlay-social-icon text-center"></div>
                        </div>
                      </div>
                      <div className="info-text">
                        <h3>
                          <a href="#">
                            Debananda Misra
                          </a>
                        </h3>
                        <p>
                          Indian Institute of Technology Delhi, India
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="team" className="section-padding text-center back">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="governance-content">
                <h4>
                  Program Committee
                </h4>
              </div>
            </div>
          </div>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                  <div className="team-img">
                    <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/ankursarin.jpg")} alt="ankursarin" />
                    <div className="team-overlay">
                      <div className="overlay-social-icon text-center"></div>
                    </div>
                  </div>
                  <div className="info-text">
                    <h3>
                      <a href="#">
                        Ankur Sarin
                      </a>
                    </h3>
                    <p>
                      Indian Institute of Management, Ahmedabad
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                  <div className="team-img">
                    <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/gitanjalisen.jpg")} alt="gitanjalisen" />
                    <div className="team-overlay">
                      <div className="overlay-social-icon text-center"></div>
                    </div>
                  </div>
                  <div className="info-text">
                    <h3>
                      <a href="#">
                        Gitanjali Sen
                      </a>
                    </h3>
                    <p>
                      Shiv Nadar Institution of Eminence, Delhi
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                  <div className="team-img">
                    <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/guilio.jpg")} alt="guilio" />
                    <div className="team-overlay">
                      <div className="overlay-social-icon text-center"></div>
                    </div>
                  </div>
                  <div className="info-text">
                    <h3>
                      <a href="#">
                        Giulio Marini
                      </a>
                    </h3>
                    <p>
                      University of Catania
                      <br />
                      Italy
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                  <div className="team-img">
                    <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/gwilym.jpg")} alt="gwilym" />
                    <div className="team-overlay">
                      <div className="overlay-social-icon text-center"></div>
                    </div>
                  </div>
                  <div className="info-text">
                    <h3>
                      <a href="#">
                        Gwilym Croucher
                      </a>
                    </h3>
                    <p>
                      University of Melbourne
                      <br />
                      Australia
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                  <div className="team-img">
                    <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/hamish.jpg")} alt="hamish" />
                    <div className="team-overlay">
                      <div className="overlay-social-icon text-center"></div>
                    </div>
                  </div>
                  <div className="info-text">
                    <h3>
                      <a href="#">
                        Hamish Coates
                      </a>
                    </h3>
                    <p>
                      Australian National University, Australia
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                  <div className="team-img">
                    <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/miguil.jpg")} alt="miguil" />
                    <div className="team-overlay">
                      <div className="overlay-social-icon text-center"></div>
                    </div>
                  </div>
                  <div className="info-text">
                    <h3>
                      <a href="#">
                        Miguel Antonio Lim
                      </a>
                    </h3>
                    <p>
                      Manchester Institute of Education
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                  <div className="team-img">
                    <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/morshidi.jpg")} alt="morshidi" />
                    <div className="team-overlay">
                      <div className="overlay-social-icon text-center"></div>
                    </div>
                  </div>
                  <div className="info-text">
                    <h3>
                      <a href="#">
                        Morshidi Sirat
                      </a>
                    </h3>
                    <p>
                      University Sains Malaysia (USM)
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                  <div className="team-img">
                    <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/saumen.jpg")} alt="Saumen" />
                    <div className="team-overlay">
                      <div className="overlay-social-icon text-center"></div>
                    </div>
                  </div>
                  <div className="info-text">
                    <h3>
                      <a href="#">
                        Saumen Chattopadhyay
                      </a>
                    </h3>
                    <p>
                      Jawaharlal Nehru Univ, India
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="team-item wow fadeInUp" data-wow-delay="0.2s">
                  <div className="team-img">
                    <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/abinandanan.jpg")} alt="abinandanan" />
                    <div className="team-overlay">
                      <div className="overlay-social-icon text-center"></div>
                    </div>
                  </div>
                  <div className="info-text">
                    <h3>
                      <a href="#">
                        T. A. Abinandanan
                      </a>
                    </h3>
                    <p>
                      Indian Institute of Science, Bengaluru
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="team" className="section-padding text-center">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="governance-content">
                <h4>
                  Organizing Committee
                </h4>
                <div className="team-row">
                  <div className="team-item">
                    <div className="team-img">
                      <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/bikrama.jpg")} alt="Bikrama" />
                      <div className="team-overlay">
                        <div className="overlay-social-icon text-center"></div>
                      </div>
                    </div>
                    <div className="info-text">
                      <h3>
                        <a href="#">
                          Bikrama Daulet Singh
                        </a>
                      </h3>
                      <p>
                        The Convergence Foundation
                      </p>
                    </div>
                  </div>
                  <div className="team-item">
                    <div className="team-img">
                      <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/mousumi.jpg")} alt="mousumi" />
                      <div className="team-overlay">
                        <div className="overlay-social-icon text-center"></div>
                      </div>
                    </div>
                    <div className="info-text">
                      <h3>
                        <a href="#">
                          Mousumi Mukherjee
                        </a>
                      </h3>
                      <p>
                        O P Jindal Global University
                      </p>
                    </div>
                  </div>
                  <div className="team-item">
                    <div className="team-img">
                      <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/aartisrivastava.jpg")} alt="Aarti Srivastava" />
                      <div className="team-overlay">
                        <div className="overlay-social-icon text-center"></div>
                      </div>
                    </div>
                    <div className="info-text">
                      <h3>
                        <a href="#">
                          Prof. Aarti Srivastava
                        </a>
                      </h3>
                      <p>
                        NIEPA
                      </p>
                    </div>
                  </div>
                  <div className="team-item">
                    <div className="team-img">
                      <img className="img-fluid" src={u("/iherc2025/assets/img/speaker/rathinbiswas.jpg")} alt="Rathin Biswas" />
                      <div className="team-overlay">
                        <div className="overlay-social-icon text-center"></div>
                      </div>
                    </div>
                    <div className="info-text">
                      <h3>
                        <a href="#">
                          Dr. Rathin Biswas
                        </a>
                      </h3>
                      <p>
                        IIT Delhi
                      </p>
                    </div>
                  </div>
                </div>
                <div className="team-row">
                  <div className="team-item">
                    <div className="team-img">
                      <img className="img-fluid" src={u("/iherc2025/narendra.jpg")} alt="Narender Thakur" />
                      <div className="team-overlay">
                        <div className="overlay-social-icon text-center"></div>
                      </div>
                    </div>
                    <div className="info-text">
                      <h3>
                        <a href="#">
                          Dr. Narender Thakur
                        </a>
                      </h3>
                      <p>
                        Professor, University of Delhi
                      </p>
                    </div>
                  </div>
                  <div className="team-item">
                    <div className="team-img">
                      <img className="img-fluid" src={u("/iherc2025/mansi.jpg")} alt="Mansi Bhat" />
                      <div className="team-overlay">
                        <div className="overlay-social-icon text-center"></div>
                      </div>
                    </div>
                    <div className="info-text">
                      <h3>
                        <a href="#">
                          Mansi Bhat
                        </a>
                      </h3>
                      <p>
                        PhD Candidate, IIT Delhi
                      </p>
                    </div>
                  </div>
                  <div className="team-item">
                    <div className="team-img">
                      <img className="img-fluid" src={u("/iherc2025/pic.jpeg")} alt="Gauri Khanna" />
                      <div className="team-overlay">
                        <div className="overlay-social-icon text-center"></div>
                      </div>
                    </div>
                    <div className="info-text">
                      <h3>
                        <a href="#">
                          Gauri Khanna
                        </a>
                      </h3>
                      <p>
                        Co-ordinator, IHERC 2025
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="sponsors" className="section-padding">
        <div className="overlay"></div>
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="section-title-header text-center">
                <h2 className="section-title wow fadeInUp" data-wow-delay="0.2s">
                  Sponsors
                </h2>
                <p className="wow fadeInDown" data-wow-delay="0.2s">
                  We welcome sponsorship support to help make IHERC 2025 a success. Partnering with us is a great opportunity to align with the goals of the India Higher Education Research Network (IHERN) and connect with a vibrant community of researchers, policymakers, and institutions.
                  <br />
                  <br />
                  {" "}Interested in sponsoring IHERC 2025?
                  <br />
                  <br />
                  To learn more about sponsorship opportunities, please email us at gauri@iiitd.ac.in
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="contact" className="section-padding"></section>
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
        <div className="row">
          <div className="col-4"></div>
          <div className="col-4">
            <div className="team-row">
              <div className="team-item">
                <div className="team-img">
                  <img className="img-fluid" src={u("/iherc2025/pic.jpeg")} alt="" />
                  <div className="team-overlay">
                    <div className="overlay-social-icon text-center"></div>
                  </div>
                </div>
                <div className="info-text">
                  <h3>
                    <a href="#">
                      Gauri Khanna
                    </a>
                  </h3>
                  <p style={{ "color": "#000" }}>
                    Conference Manager
                  </p>
                  <p style={{ "color": "#000" }}>
                    iherc2025@iiitd.ac.in
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
      <section id="travel" style={{ "padding": "0", "margin": "0" }}>
        <div className="row" style={{ "margin": "0" }}>
          <div className="col-12" style={{ "padding": "0" }}>
            <br />
            <center>
              <a className="btn btn-common" href={u("/iherc2025/Conference%20Travel%20Information.pdf")} target="_blank">
                Travel &amp; Accommodation Guidelines
              </a>
            </center>
            <br />
          </div>
        </div>
      </section>
      <section id="google-map-area" style={{ "padding": "0", "margin": "0" }}>
        <div className="row" style={{ "margin": "0" }}>
          <div className="col-12" style={{ "padding": "0" }}>
            <object aria-label="Map: IIT Delhi, New Delhi" style={{ "border": "0", "height": "450px", "width": "100%" }} data="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3504.8256707125306!2d77.19167081202747!3d28.544959175611382!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1df6be7e6a75%3A0x8b149c3feb567bb1!2sIIT%20Delhi%20Main%20Rd%2C%20New%20Delhi%2C%20Delhi%20110016%2C%20India!5e0!3m2!1sen!2sus!4v1744785856665!5m2!1sen!2sus"></object>
          </div>
        </div>
      </section>
      <section id="contact-text">
        <div className="container">
          <div className="row contact-wrapper">
            <div className="col-lg-2 col-md-5 col-xs-12"></div>
            <div className="col-lg-4 col-md-5 col-xs-12">
              <ul>
                <li>
                  <i className="lni-home"></i>
                </li>
                <li>
                  <span>
                    IIT Delhi India
                  </span>
                </li>
              </ul>
            </div>
            <div className="col-lg-4 col-md-3 col-xs-12">
              <ul>
                <li>
                  <i className="lni-envelope"></i>
                </li>
                <li>
                  <span>
                    iherc2025@iiitd.ac.in
                  </span>
                </li>
              </ul>
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
