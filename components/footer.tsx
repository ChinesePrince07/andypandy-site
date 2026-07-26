"use client";

import Link from "next/link";
import { useState } from "react";

const EMAIL = "zhangandy4321@gmail.com";

export default function Footer() {
  const [copied, setCopied] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <footer className="mono flex flex-col gap-3 border-t-[3px] border-double border-rule px-4 py-6 text-[10px] uppercase tracking-[0.14em] text-faint sm:flex-row sm:items-center sm:justify-between sm:px-11 sm:py-4">
      <span>Made with Love, Coffee and a bit of Opus</span>
      <div className="flex items-center gap-5">
        <a
          href="https://github.com/ChinesePrince07"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-accent"
        >
          GitHub
        </a>
        <button
          onClick={copyEmail}
          className="cursor-pointer uppercase tracking-[0.14em] transition-colors hover:text-accent"
        >
          {copied ? "Copied" : "Email"}
        </button>
        <Link href="/admin" className="transition-colors hover:text-accent">
          Desk
        </Link>
        <span>&copy; {new Date().getFullYear()} Andy Zhang</span>
      </div>
    </footer>
  );
}
