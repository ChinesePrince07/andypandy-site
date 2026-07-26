"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Every scroll/pointer effect in the Broadsheet layout, driven off data
 * attributes so the pages themselves stay server-rendered:
 *
 *   [data-reveal]    fades + rises into view
 *   [data-rule]      section rule draws in from the left
 *   [data-progress]  reading-progress bar width
 *   [data-parallax]  masthead drifts against the scroll
 *   [data-glow]      paper light tracks the cursor
 *   [data-ghost]     accent ghost type offsets from the pointer
 *   [data-plate]     second ink plate misregisters the other way
 *   [data-tilt]      portrait tips toward the cursor
 *
 * Nothing here is required for the page to be readable — with JS off
 * everything stays in its painted resting state.
 */
export default function BroadsheetFx() {
  const pathname = usePathname();
  // The editor overlay flips body[data-editing]; re-run the effect on it.
  const [editing, setEditing] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setEditing((n) => n + 1));
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-editing"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (document.body.dataset.editing) {
      // Reveals hold at opacity:0 until scrolled into view; in edit mode
      // that would mean clicking invisible blocks.
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    const cleanups: (() => void)[] = [];
    const onScreen = (el: Element) =>
      el.getBoundingClientRect().top < window.innerHeight - 40;

    /* ---- reveals ---- */
    const revealIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const stagger = Number(el.dataset.stagger || 0) * 55;
          setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
          }, stagger);
          revealIo.unobserve(el);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el, i) => {
      el.style.transition =
        "opacity .62s cubic-bezier(.2,.7,.3,1), transform .62s cubic-bezier(.2,.7,.3,1)";
      if (onScreen(el)) return; // above the fold paints immediately
      el.dataset.stagger = String(i % 6);
      el.style.opacity = "0";
      el.style.transform = "translateY(14px)";
      el.style.willChange = "opacity, transform";
      revealIo.observe(el);
    });
    cleanups.push(() => revealIo.disconnect());

    /* ---- section rules ---- */
    const ruleIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).style.transform = "scaleX(1)";
          ruleIo.unobserve(entry.target);
        });
      },
      { threshold: 0.5 },
    );
    document.querySelectorAll<HTMLElement>("[data-rule]").forEach((el) => {
      if (onScreen(el)) return;
      el.style.transform = "scaleX(0)";
      ruleIo.observe(el);
    });
    cleanups.push(() => ruleIo.disconnect());

    /* ---- scroll: progress + masthead parallax ---- */
    const progresses =
      document.querySelectorAll<HTMLElement>("[data-progress]");
    const parallax = document.querySelectorAll<HTMLElement>("[data-parallax]");
    // Parallax owns the Y offset, the pointer pass owns X — keep them apart
    // so neither clobbers the other when both write `translate`.
    const offsets = new WeakMap<HTMLElement, { x: string; y: string }>();
    const offsetOf = (el: HTMLElement) => {
      let o = offsets.get(el);
      if (!o) offsets.set(el, (o = { x: "0px", y: "0px" }));
      return o;
    };

    const applyScroll = () => {
      const y = window.scrollY;
      const max =
        Math.max(
          document.documentElement.scrollHeight,
          document.body.scrollHeight,
        ) - window.innerHeight;
      const pct = max > 0 ? Math.max(0, Math.min(100, (y / max) * 100)) : 0;
      progresses.forEach((p) => {
        p.style.width = pct.toFixed(2) + "%";
      });
      parallax.forEach((el) => {
        const f = parseFloat(el.dataset.parallax || "0");
        const o = offsetOf(el);
        o.y = (-y * f).toFixed(1) + "px";
        el.style.translate = `${o.x} ${o.y}`;
      });
    };
    window.addEventListener("scroll", applyScroll, { passive: true });
    applyScroll();
    cleanups.push(() => window.removeEventListener("scroll", applyScroll));

    /* ---- pointer: paper light + plate misregistration ---- */
    const glows = document.querySelectorAll<HTMLElement>("[data-glow]");
    const ghosts = document.querySelectorAll<HTMLElement>("[data-ghost]");
    const plates = document.querySelectorAll<HTMLElement>("[data-plate]");
    const tilts = document.querySelectorAll<HTMLElement>("[data-tilt]");

    let px = window.innerWidth * 0.3;
    let py = 260;
    let gx = px;
    let gy = py;

    const paint = () => {
      glows.forEach((g) => {
        g.style.translate = `${gx.toFixed(1)}px ${gy.toFixed(1)}px`;
      });
      const nx = px / window.innerWidth - 0.5; // -0.5 … 0.5
      const ny = (py - window.scrollY) / Math.max(1, window.innerHeight) - 0.5;

      ghosts.forEach((el) => {
        el.style.translate = `${(nx * 22).toFixed(2)}px ${(ny * 10).toFixed(2)}px`;
      });
      plates.forEach((el) => {
        el.style.translate = `${(nx * -26).toFixed(2)}px ${(ny * -14).toFixed(2)}px`;
      });
      tilts.forEach((el) => {
        el.style.rotate = `${(nx * 2.4).toFixed(2)}deg`;
        el.style.translate = `${(nx * -14).toFixed(1)}px ${(ny * -8).toFixed(1)}px`;
      });
      parallax.forEach((el) => {
        const o = offsetOf(el);
        o.x = (nx * -18).toFixed(1) + "px";
        el.style.translate = `${o.x} ${o.y}`;
      });
    };

    const onMove = (ev: MouseEvent) => {
      px = ev.clientX;
      py = ev.clientY + window.scrollY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    cleanups.push(() => window.removeEventListener("mousemove", onMove));

    let frame = requestAnimationFrame(function loop() {
      gx += (px - gx) * 0.075;
      gy += (py - gy) * 0.075;
      paint();
      frame = requestAnimationFrame(loop);
    });
    cleanups.push(() => cancelAnimationFrame(frame));

    return () => cleanups.forEach((fn) => fn());
  }, [pathname, editing]);

  return null;
}
