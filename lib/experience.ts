export interface ExperienceMedia {
  type: "image" | "video";
  /** Anything the browser can load: /experience/foo.jpg, an R2 URL, an mp4. */
  src: string;
  caption?: string;
}

export interface Experience {
  /** Local file under public/logos/. Omitted orgs fall back to a monogram. */
  logo?: string;
  slug: string;
  role: string;
  org: string;
  /** Shown in the timeline, e.g. "Summer 2025". */
  when: string;
  location?: string;
  /** One line, shown on the front page. */
  note: string;
  /** Paragraphs for the detail page. */
  body: string[];
  /** Drop files in public/experience/ or paste R2 URLs. Empty is fine. */
  media: ExperienceMedia[];
}

/**
 * Newest first — the order the timeline renders. Sorted by end date, so an
 * ongoing role would lead; everything here is finished.
 */
export const experience: Experience[] = [
  {
    slug: "biosur-costa-rica",
    logo: "/logos/biosur.png",
    role: "Conservation Intern",
    org: "BioSur Foundation",
    when: "Summer 2025",
    location: "Osa Peninsula, Costa Rica",
    note: "Biodiversity surveys and habitat monitoring in the Osa Peninsula.",
    body: [
      "A three-week field internship in the Osa Peninsula — a strip of Costa Rican rainforest holding roughly 2.5% of the planet's biodiversity — working under Jim Córdoba-Alfaro, founder and president of the BioSur Foundation.",
      "The work was field ecology rather than a classroom: biodiversity surveys, habitat monitoring, and data collection across survey sites, plus the physical side of restoration — planting new trees and clearing invasive roots that crowd out native growth.",
      "The internship closed with a final presentation, which passed with distinction, and earned 2 university credits through Portland State University (INTL 404, grade A).",
    ],
    media: [],
  },
  {
    slug: "uchicago-summer-immersion",
    logo: "/logos/uchicago.svg",
    role: "Summer Immersion",
    org: "University of Chicago",
    when: "Summer 2025",
    location: "Chicago, Illinois",
    note: "PHIL 20218, Philosophy of Life and Death. Grade A.",
    body: [
      "A university-level philosophy seminar taken alongside undergraduates: PHIL 20218, Introduction to the Philosophy of Life and Death.",
      "Finished with a grade of A and a 4.0 GPA for the programme.",
    ],
    media: [],
  },
  {
    slug: "innobridge-mit",
    logo: "/logos/mit.svg",
    role: "Research Intern",
    org: "InnoBridge Institute & MIT",
    when: "Summer 2024",
    location: "Cambridge, Massachusetts",
    note: "Neural-network models predicting stroke risk from clinical biomarkers.",
    body: [
      "Research on stroke-risk prediction under Dr. Shalaginov, building neural-network models over clinical biomarker datasets.",
      "I owned the data preprocessing pipeline — the unglamorous half, where most of the signal is won or lost — and built the clinician-facing web application that put the model in front of someone who could actually use it.",
      "The work became a research paper, which I co-authored.",
    ],
    media: [],
  },
  {
    slug: "pwc-youplus",
    logo: "/logos/pwc.svg",
    role: "Summer Intern",
    org: "PricewaterhouseCoopers",
    when: "Summer 2023",
    location: "Shanghai",
    note: "Accounting fundamentals, Power BI and Excel modelling.",
    body: [
      "The PwC YouPlus Programme: accounting fundamentals, Power BI, and advanced Excel for business analysis.",
      "The main project was a business plan for Buy42, a donation-based charity shop in Shanghai that employs people with disabilities. I ran market surveys with the owners and their customers, then presented the recommendations to PwC mentors.",
    ],
    media: [],
  },
];

export function getExperience(slug: string): Experience | undefined {
  return experience.find((e) => e.slug === slug);
}
