/**
 * ─────────────────────────────────────────────────────────────────────
 *  IHERN INITIATIVES — EDIT THIS FILE TO UPDATE THE INITIATIVES PAGE
 * ─────────────────────────────────────────────────────────────────────
 *  To add an initiative : copy a block below and change the values.
 *  To edit one          : change its text here.
 *  To remove one        : delete its block (or set status: "hidden").
 *  To reorder           : move blocks up or down.
 *
 *  Fields:
 *    title     name of the initiative
 *    status    "active" shows it; "hidden" keeps it here but off the page
 *    summary   one short line shown under the title
 *    body      the full description (plain text; blank line = new paragraph)
 *    facts     optional label/value pairs shown as a small detail list
 *
 *  Same content as includes/initiatives-data.php on the PHP site.
 * ─────────────────────────────────────────────────────────────────────
 */

export type Initiative = {
  title: string;
  status: "active" | "hidden";
  summary?: string;
  facts?: [label: string, value: string][];
  body: string;
};

export const INITIATIVES: Initiative[] = [
  {
    title: "Fellowship",
    status: "active",
    summary: "Annual fellowships for Members actively researching higher education in India.",
    facts: [
      ["Value", "Rs 3 lakh per year"],
      ["Duration", "Two years"],
      ["Status", "First round floated March 2024 — three fellowships awarded"],
    ],
    body: `For the first three years, each year a limited number of Members who are active researchers in higher education in India will be granted Fellowships.

The main expectation for granting the Fellowship is that the member will publish at least one good quality research paper on higher education in India in a reputed journal/conference. He/she is also expected to lead one of the key activities of IHERN.

These Fellowships are of Rs 3 Lac/year which can be used for any professional higher education research work, including attending a reputed international conference for presenting a paper. The Fellowship will be for a period of two years. For an international Member, the Fellowship can be used to visit some Member(s) in India.

The first round for Fellowships was floated in March 2024, and three fellowships were awarded.`,
  },
  {
    title: "Senior Scholar Program",
    status: "active",
    summary: "Senior academic thinkers author in-depth Reports on matters of high importance in Indian higher education.",
    facts: [
      ["Honorarium", "Rs 1.5 lakh per Report"],
      ["Support", "Up to Rs 1.5 lakh for travel / secretarial assistance"],
      ["Who", "Members with experience in higher education leadership"],
    ],
    body: `Some Members, who are senior academic thinkers with experience in higher education leadership are invited to take charge as Senior Scholars of IHERN.

The main expectation from Senior Scholars is to write a well-researched and detailed Report on matters of high importance in Indian higher education.

For writing a Report, a Senior Scholar will be paid an honorarium of Rs 1.5 Lac and may be provided with support for travel/secretarial assistance of up to Rs 1.5 Lac.`,
  },
  {
    title: "Research Grant for Human Resources",
    status: "active",
    summary: "One grant a year to fund research manpower — a PhD student, an overseas research stay, or a research associate.",
    facts: [
      ["Value", "About Rs 15 lakh, one grant per year"],
      ["Eligibility", "All Members may apply"],
      ["Applications", "To open later — announced on this website; Members will be notified"],
    ],
    body: `One Grant a year of about Rs 15 Lac for human resource will be granted by IHERN.

It is expected that this Grant be used to recruit a PhD student or support a PhD student to spend some time in a reputed higher education research centre overseas, but can also be used to hire a research associate/assistant.

All members will be eligible to apply for this Grant. Applications for this will be opened later and will be announced on the website and Members will be notified.`,
  },
];
