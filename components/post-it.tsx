"use client";

import { useEffect, useState } from "react";

const KEY = "postit-composerdle-dismissed";

/** A little sticky note stuck in the left rail, inviting you to play Composerdle. */
export default function PostIt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(localStorage.getItem(KEY) !== "1");
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setShow(false);
  };

  return (
    <div className="postit relative mx-auto mt-8 w-fit">
      <a
        href="https://composerdle.andypandy.org"
        target="_blank"
        rel="noopener"
        className="postit-note block"
        aria-label="Play Composerdle, a daily classical-composer guessing game"
      >
        <span className="postit-tape" aria-hidden="true" />
        <span className="hand block text-[19px] leading-[1.15]">psst! guess today&apos;s composer</span>
        <span className="hand mt-1.5 block text-[15px] leading-tight opacity-80">
          a new piece every day &#9835;
        </span>
        <span className="hand mt-2 block text-[17px] underline decoration-[1.5px] underline-offset-[3px]">
          play Composerdle &rarr;
        </span>
      </a>
      <button type="button" onClick={dismiss} className="postit-close" aria-label="Dismiss note">
        &times;
      </button>
    </div>
  );
}
