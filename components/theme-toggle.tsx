"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // The blocking script in layout.tsx already applied the stored theme —
    // read the result rather than re-deriving it.
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  // Reserve the slot pre-hydration so the masthead does not reflow.
  if (!mounted)
    return <span className="block h-[26px] w-[74px]" aria-hidden="true" />;

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light" : "Switch to dark"}
      className="mono cursor-pointer border border-rule px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em] text-ink transition-colors hover:border-accent hover:text-accent"
    >
      {dark ? "◑ Light" : "◐ Dark"}
    </button>
  );
}
