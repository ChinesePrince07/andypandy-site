"use client";

import { useEffect, useRef } from "react";

/**
 * Renders HTML in Andy's handwriting: every letter is drawn from one of 8 fonts, each
 * built from a different handwritten sample. Within a word the same letter never reuses
 * a sample (so "coffee" has two different e's), and each glyph gets a small random tilt,
 * size and baseline wobble. Seeded by `seed`, so a page looks the same on every visit.
 * Runs after hydration, so the server HTML (and RSS / search engines) stays plain text.
 */
const SKIP = new Set(["PRE", "CODE", "SCRIPT", "STYLE", "KBD", "SVG"]);

type SampleMap = Record<string, (number | null)[]>;
let samplesPromise: Promise<SampleMap> | null = null;
const loadSamples = () =>
  (samplesPromise ??= fetch("/fonts/andyhand/samples.json").then((r) => r.json()));

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function handwrite(root: HTMLElement, samples: SampleMap, rand: () => number) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      for (let p = n.parentElement; p && p !== root; p = p.parentElement)
        if (SKIP.has(p.tagName) || p.dataset.hw) return NodeFilter.FILTER_REJECT;
      return n.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    for (const token of node.nodeValue!.split(/(\s+)/)) {
      if (!token) continue;
      if (/^\s+$/.test(token)) {
        frag.append(token);
        continue;
      }
      const word = document.createElement("span");
      word.dataset.hw = "1";
      word.style.whiteSpace = "nowrap";
      const used: Record<string, Set<number>> = {};
      for (const ch of token) {
        const options = samples[ch];
        const g = document.createElement("span");
        g.textContent = ch;
        g.style.display = "inline-block";
        if (options) {
          const ok = options.flatMap((s, v) => (s === null ? [] : [v]));
          const seen = (used[ch] ??= new Set());
          const fresh = ok.filter((v) => !seen.has(options[v]!));
          const pool = fresh.length ? fresh : ok;
          const v = pool[Math.floor(rand() * pool.length)];
          seen.add(options[v]!);
          const extra = fresh.length ? 1 : 2; // out of distinct samples: disguise the repeat more
          g.style.fontFamily = `AndyHand${v}, var(--font-serif, serif)`;
          g.style.transform = `translateY(${((rand() - 0.5) * 0.08 * extra).toFixed(3)}em) rotate(${((rand() - 0.5) * 4 * extra).toFixed(2)}deg)`;
          g.style.fontSize = `${(0.96 + rand() * 0.08 * extra).toFixed(3)}em`;
        }
        word.append(g);
      }
      frag.append(word);
    }
    node.replaceWith(frag);
  }
}

export default function Handwritten({
  seed,
  html,
  as: Tag = "div",
  className,
  style,
}: {
  seed: string;
  html: string;
  as?: "div" | "h1" | "p";
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    loadSamples().then((samples) => {
      if (!cancelled) handwrite(el, samples, rng(seed));
    });
    return () => {
      cancelled = true;
    };
  }, [seed, html]);
  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`handwritten ${className ?? ""}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
