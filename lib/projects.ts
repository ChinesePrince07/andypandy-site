import { unstable_cache } from "next/cache";
import { r2GetText } from "./r2-storage";

export interface Project {
  name: string;
  slug: string;
  description: string;
  tags: string[];
  emoji: string;
  demo?: string;
  repo: string;
  pinned?: boolean;
}

export const projects: Project[] = [
  {
    name: "Composerdle",
    slug: "composerdle",
    repo: "ChinesePrince07/composerdle",
    description:
      "A daily classical-composer guessing game with fact clues and public-domain recordings with redacted scores.",
    tags: ["JavaScript", "Web", "Music"],
    emoji: "🎼",
    demo: "https://composerdle.andypandy.org",
  },
  {
    name: "AI Usage Monitor",
    slug: "ai-usage-monitor",
    repo: "ChinesePrince07/ai-usage-monitor",
    description:
      "An ESP32 desk dashboard that tracks Claude, Codex, and Gemini CLI usage alongside live host statistics.",
    tags: ["C", "ESP32", "Hardware"],
    emoji: "📟",
  },
  {
    name: "Cbum Transformation",
    slug: "cbum-transformation",
    repo: "ChinesePrince07/Andy-Cbum-Transformation",
    description:
      "A local-first iOS training system for programming workouts, logging sets, and measuring readiness against personal health baselines.",
    tags: ["TypeScript", "React Native", "iOS"],
    emoji: "💪",
  },
  {
    name: "Concert Creator",
    slug: "concert-creator",
    repo: "ChinesePrince07/concert-creator-ai",
    description:
      "Turns piano audio or MIDI into a locally rendered 3D virtual-pianist performance with automated fingering, choreography, and cameras.",
    tags: ["TypeScript", "Three.js", "Music"],
    emoji: "🎹",
    demo: "https://concert-creator-ai.vercel.app",
  },
  {
    name: "FitCheck",
    slug: "fitcheck",
    repo: "ChinesePrince07/fitcheck",
    description:
      "An AI virtual try-on app for previewing clothing on your own photo before you buy.",
    tags: ["JavaScript", "AI", "Web"],
    emoji: "👔",
    demo: "https://fitcheck.andypandy.org",
  },
  {
    name: "Andy's Swiss Knife",
    slug: "andy-swiss-knife",
    repo: "ChinesePrince07/Andy-Swiss-Knife",
    description:
      "A personal iOS Swiss-army app for todos, classes, dining, pomodoro, school events, and Canvas assignments.",
    tags: ["Swift", "iOS"],
    emoji: "🔪",
  },
  {
    name: "Servo Light Switch",
    slug: "servo-light-switch",
    repo: "ChinesePrince07/servo-light-switch",
    description:
      "A voice-controlled dorm light switch built with a XIAO ESP32C3, MG90S servo, and Apple HomeKit via HomeSpan.",
    tags: ["C++", "ESP32", "HomeKit"],
    emoji: "💡",
  },
  {
    name: "TI-84 GPT Hack",
    slug: "ti-84-gpt-hack",
    repo: "ChinesePrince07/TI-84-GPT-HACK",
    description:
      "A mod that gives a TI-84 Wi-Fi and ChatGPT. Reconstructed from Chromalock's original project after its repository was taken down.",
    tags: ["C", "ESP32", "Hardware"],
    emoji: "🧮",
  },
  {
    name: "Desmos Bezier Renderer",
    slug: "desmos-bezier-renderer",
    repo: "ChinesePrince07/DesmosBezierRenderer-mac",
    description:
      "Transforms images into Desmos art using Canny edge detection and Potrace to create parametric Bézier curves. Optimized for macOS.",
    tags: ["HTML", "Math", "macOS"],
    emoji: "📐",
    demo: "https://desmos-renderer.vercel.app",
  },
  {
    name: "Suffield Drive",
    slug: "suffield-drive",
    repo: "ChinesePrince07/andypandy-suffield-drive",
    description:
      "A drive for Suffield students to access and share school resources.",
    tags: ["TypeScript", "Web"],
    emoji: "☁️",
    demo: "https://suffield-drive.vercel.app",
  },
  {
    name: "Music Landing Page",
    slug: "music-landing-page",
    repo: "ChinesePrince07/music-landing-page-commissioned",
    description: "A commissioned landing page for a music artist.",
    tags: ["HTML", "Design"],
    emoji: "🎵",
    demo: "https://music-landing-page-commissioned.vercel.app",
  },
  {
    name: "Taylor Series Visualizer",
    slug: "taylor-series",
    repo: "ChinesePrince07/taylorseries-CALCBC",
    description:
      "An interactive visualization of Taylor series approximations for Calc BC.",
    tags: ["HTML", "Math"],
    emoji: "📊",
    demo: "https://taylorseries-calcbc.vercel.app",
  },
  {
    name: "Chatbot UI",
    slug: "chatbot-ui",
    repo: "ChinesePrince07/chatbot-ui",
    description: "A chat interface for interacting with AI models.",
    tags: ["TypeScript", "AI"],
    emoji: "💬",
    demo: "https://chatbot-ui-phi-one-74.vercel.app",
  },
];

export const PINNED_KEY = "content/pinned-projects.json";
export const DELETED_KEY = "content/deleted-projects.json";

const loadPinnedSlugs = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const text = await r2GetText(PINNED_KEY);
      if (!text) return [];
      return JSON.parse(text) as string[];
    } catch {
      return [];
    }
  },
  ["pinned-projects-slugs"],
  { tags: ["pinned-projects"], revalidate: 60 },
);

export async function getPinnedSlugs(): Promise<string[]> {
  return loadPinnedSlugs();
}

const loadDeletedSlugs = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const text = await r2GetText(DELETED_KEY);
      if (!text) return [];
      return JSON.parse(text) as string[];
    } catch {
      return [];
    }
  },
  ["deleted-projects-slugs"],
  { tags: ["deleted-projects"], revalidate: 60 },
);

export async function getDeletedSlugs(): Promise<string[]> {
  return loadDeletedSlugs();
}

// Public projects follow GitHub creation date (newest first), with soft-deleted projects hidden.
export async function getProjectsWithPins(): Promise<Project[]> {
  const [pinned, deleted] = await Promise.all([
    getPinnedSlugs(),
    getDeletedSlugs(),
  ]);
  const withPins = projects
    .filter((p) => !deleted.includes(p.slug))
    .map((p) => ({ ...p, pinned: pinned.includes(p.slug) }));
  return withPins;
}

// Admin view: every project with pinned + deleted flags (deleted shown last).
export async function getProjectsForAdmin(): Promise<
  (Project & { deleted: boolean })[]
> {
  const [pinned, deleted] = await Promise.all([
    getPinnedSlugs(),
    getDeletedSlugs(),
  ]);
  const all = projects.map((p) => ({
    ...p,
    pinned: pinned.includes(p.slug),
    deleted: deleted.includes(p.slug),
  }));
  return [
    ...all.filter((p) => p.pinned && !p.deleted),
    ...all.filter((p) => !p.pinned && !p.deleted),
    ...all.filter((p) => p.deleted),
  ];
}
