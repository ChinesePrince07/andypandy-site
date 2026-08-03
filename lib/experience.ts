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
      "Half past five in the morning on the Osa Peninsula, and I was ankle-deep in wet ground, pulling white ginger lily out by the roots. The flower is beautiful — that's the problem. It was brought in as an ornamental, and it strangles everything native around it. In a strip of rainforest holding roughly 2.5% of the planet's biodiversity, beauty that doesn't belong is a slow-motion emergency.",
      "I spent three weeks there with the BioSur Foundation, under Jim Córdoba-Alfaro, its founder and president. The work was field ecology rather than a classroom: biodiversity surveys, habitat monitoring, camera traps set along the corridors where illegal logging squeezes wildlife into narrower and narrower paths, insect collection, planting native trees — and the lilies, every dawn.",
      "I'll be honest about where I started. People devoting their lives to fragile, insignificant-looking animals had always seemed like a myth to me. Then someone walks you through the keystone logic — what actually happens when the bees go, then the ants, then the coral — and you realize these creatures aren't beneath us on some pyramid; we're standing on them. Losing them is sawing at the branch we're all sitting on.",
      "The researchers taught me that just by being themselves. Watching a professional ecologist get genuinely giddy about finding a small bug stops being funny by day three and starts being contagious. Jim has been doing this work for over a decade, chronically underfunded, alongside field biologists who knew more than anyone I'd ever met and earned less than my school's janitors. When a fer-de-lance turned up, Jim's instinct was to kneel closer and look. Not a man who reads about snakes — a man who checks.",
      "One evening a speaker from a reef-restoration NGO came through camp: a twenty-year-old university student, deep in debt, doing physically brutal work for no pay, restoring coral reefs — another keystone species. Zero regrets, he said. If you know you like it and want to do it, you don't need everything planned out. I wrote that one down.",
      "And the people my own age were the best part. My roommate beat me at chess, repeatedly — which, after years of being the chess guy, was honestly a relief. There were peers from all over the States and a couple of European exchange students whose jokes had no business being that unhinged. Between the surveys and the root-pulling, the long unstructured conversations were where I figured out something about myself: what I enjoy most, more than winning or building anything, is talking with people who actually listen.",
      "The internship closed with a final presentation, which passed with distinction, and earned 2 university credits through Portland State University (INTL 404, grade A). The credits sit on a transcript somewhere. The lily grows back — that's the nature of the job. You pull it anyway.",
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
      "Three straight weeks of that summer went to a pipeline that kept dying on malformed records — the kind of debugging where every fix reveals two more. I came out with a lasting respect for anyone whose whole job is keeping data clean.",
      "The hardest part wasn't the model. It was a single number: the decision threshold. Set it low and you flood clinicians with false alarms; set it high and you miss strokes. Someone has to pick, and the picking is a moral choice wearing a parameter's clothes.",
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
      "I was sixteen, the youngest in the room, surrounded by people already holding college offers — and I'd taken exactly one economics course in my life. So I found a different job: I became the one who brought the coffee, asked the questions everyone else was too embarrassed to ask, and kept the room laughing. Inexperience makes decent armor if you wear it openly.",
      "It was also a reality check. Nearly every clever idea we pitched, the owner had already tried or considered — rent, salaries, logistics, revenue all pulling at once. Running a business, especially a non-profit, is far harder than any classroom version of it.",
      "I left half-convinced this is what schools should be teaching, instead of leaving it for a summer to reveal.",
    ],
    media: [],
  },
];

export function getExperience(slug: string): Experience | undefined {
  return experience.find((e) => e.slug === slug);
}
