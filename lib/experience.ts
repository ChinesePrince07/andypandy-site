export interface ExperienceMedia {
  type: "image" | "video";
  /** Anything the browser can load: /experience/foo.jpg, an R2 URL, an mp4. */
  src: string;
  caption?: string;
  position?: "center" | "top" | "bottom" | "left" | "right" | "contain";
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
      "The autumn air outside the heavy stone windows of Hyde Park was already turning sharp when I first cracked open Plato. Sitting at a scuffed oak desk with a lukewarm coffee, I remember reading the Republic and feeling the weird, uncomfortable prickle of the Cave allegory sinking in. Suddenly, walking across campus wasn’t just walking to class anymore—it felt like watching shadows dance across a wall, wondering if anyone around me was actually seeing the light. A few weeks later, Aristotle forced me into an internal audit, making me look at my own daily routines to figure out whether I was actually practicing virtue or just going through the motions of being a good student.",
      "By the time the mid-semester rain set in, we had moved into the 17th century, and the readings started haunting my late nights. I remember sitting under a desk lamp at 2 a.m., reading René Descartes by the hum of the radiator. He was huddled by his fireplace four hundred years ago, methodically stripping away every belief he had until he was left with nothing but his own doubting mind. For an hour, I stared at my own hands, genuinely wondering if I was dreaming. Then came Hobbes, Locke, and Hume—a chaotic intellectual free-for-all. Hobbes made me look at my peers with sudden suspicion during chaotic group assignments, Locke made me question where my identity even lived, and Hume calmly dismantled the concept of cause and effect until I half-expected the sun to forget to rise the next morning.",
      "Then came the mountain: Immanuel Kant. Trying to hack my way through his endless, dense sentences felt like trying to swim through wet concrete. But somewhere around page forty, in the middle of a silent library study room, something clicked. Kant’s idea of the categorical imperative—that you can never treat another human being as a mere stepping stone for your own goals—hit like a physical weight. Philosophy was no longer just an academic exercise; it was a mirror held up to every choice I made.",
      "By the final weeks of the course, we reached the modern agitators, and the room was electric. Karl Marx made me look at every commercial exchange on my walk to the train with a sharp, critical lens. Friedrich Nietzsche’s declaration that \"God is dead\" echoed in the back of my mind as the semester wound down, warning us of the terrifying vacuum left behind when old truths collapse. Finally, the existentialists left us standing at the edge of the cliff: the universe wasn't going to hand me a purpose, which meant I had to step up and forge one myself. Closing that final textbook on the last day felt less like finishing a class and more like stepping out of a long, transformative fever dream.",
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
