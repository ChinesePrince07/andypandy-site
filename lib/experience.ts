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
      "The part that rewired me was the keystone-species logic. I used to think people devoting their lives to fragile little animals was a kind of myth; then someone walks you through what happens when the bees, the ants, and the coral go, and you realize we're quietly sawing at the branch we're all sitting on. Watching a professional ecologist get genuinely excited about finding a small bug stops being funny and starts being contagious.",
      "The researchers were the other education. Jim has been doing this for over a decade, chronically underfunded — field biologists who knew more than anyone I'd met, earning less than my school's janitors, the kind of people who kneel closer to a fer-de-lance to check what it is. One evening a speaker from a reef-restoration NGO came through: twenty years old, deep in student debt, working an unpaid and physically brutal job, zero regrets. His line stuck: if you know you like it and want to do it, you don't need everything planned out.",
      "And the people my own age were the best part. My roommate beat me at chess, repeatedly — which, after years of being the chess guy, was genuinely refreshing. Between the surveys and the root-pulling, the long unstructured conversations were where I figured out how much of what I enjoy is simply talking with people who listen.",
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
      "I'd been reading philosophy on my own for a couple of years before this — mostly at 2 a.m., mostly unsupervised. PHIL 20218, Philosophy of Life and Death, was the first time anyone made me do it rigorously, with a grade attached.",
      "The autumn air outside the heavy stone windows of Hyde Park was already turning sharp when I first cracked open Plato. Sitting at a scuffed oak desk with a lukewarm coffee, I remember reading the Republic and feeling the weird, uncomfortable prickle of the Cave allegory sinking in. Suddenly, walking across campus wasn’t just walking to class anymore—it felt like watching shadows dance across a wall, wondering if anyone around me was actually seeing the light. A few weeks later, Aristotle forced me into an internal audit, making me look at my own daily routines to figure out whether I was actually practicing virtue or just going through the motions of being a good student.",
      "By the time the mid-semester rain set in, we had moved into the 17th century, and the readings started haunting my late nights. I remember sitting under a desk lamp at 2 a.m., reading René Descartes by the hum of the radiator. He was huddled by his fireplace four hundred years ago, methodically stripping away every belief he had until he was left with nothing but his own doubting mind. For an hour, I stared at my own hands, genuinely wondering if I was dreaming. Then came Hobbes, Locke, and Hume—a chaotic intellectual free-for-all. Hobbes made me look at my peers with sudden suspicion during chaotic group assignments, Locke made me question where my identity even lived, and Hume calmly dismantled the concept of cause and effect until I half-expected the sun to forget to rise the next morning.",
      "Then came the mountain: Immanuel Kant. Trying to hack my way through his endless, dense sentences felt like trying to swim through wet concrete. But somewhere around page forty, in the middle of a silent library study room, something clicked. Kant’s idea of the categorical imperative—that you can never treat another human being as a mere stepping stone for your own goals—hit like a physical weight. Philosophy was no longer just an academic exercise; it was a mirror held up to every choice I made.",
      "The best hour of the course wasn't a reading at all. A CS student and a theology student got into it over whether consciousness could be computed, and stopped hearing each other entirely — same words, two languages. I spent the rest of the seminar translating between them, and enjoyed that more than winning any argument of my own. It's still the role I want: the person fluent in both rooms.",
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
      "The year before, my grandfather had a stroke. He survived, but it took his speech and most of his recognition of the family. That's what put me on this project.",
      "Research on stroke-risk prediction under Dr. Shalaginov, building neural-network models over clinical biomarker datasets.",
      "I owned the data preprocessing pipeline — the unglamorous half, where most of the signal is won or lost — and built the clinician-facing web application that put the model in front of someone who could actually use it.",
      "The model reached 89.3% test accuracy. Digging into why, I found the training data underrepresented whole groups of patients — my first real lesson in asking \"accurate for whom?\". The work became a research paper, which I co-authored.",
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
      "It was also a reality check. I was sixteen — the youngest in the programme — and nearly every clever idea we pitched, the owner had already tried or considered. Running a business, especially a non-profit, is far harder than any classroom version of it.",
    ],
    media: [],
  },
];

export function getExperience(slug: string): Experience | undefined {
  return experience.find((e) => e.slug === slug);
}
