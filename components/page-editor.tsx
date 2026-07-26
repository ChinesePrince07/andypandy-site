"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { EDIT_ABOUT_EVENT } from "@/components/about-editor";
import {
  GROUPS,
  type BlockId,
  type CopyKey,
  type EditorOp,
} from "@/lib/front-page";

/**
 * The owner's on-page editor. Everything it draws is fixed-position and
 * portalled onto <body>, and everything it paints onto the page itself is
 * outline / opacity / text-decoration — properties that cannot reflow.
 * Toggling edit mode must not move a single pixel of the page being edited,
 * or the layout under the handles is not the one visitors see.
 */

/** Only blocks inside a group can be reordered; the rest are hide-only. */
const GROUPED = new Set<string>([...GROUPS.main, ...GROUPS.sidebar]);

const EDIT_CSS = `
body[data-editing] [data-block]{outline:1px dashed var(--accent);outline-offset:4px}
body[data-editing] [data-block-hidden]{opacity:.35}
body[data-editing] [data-copy]{cursor:text}
body[data-editing] [data-copy]:hover{text-decoration:underline dotted var(--accent);text-underline-offset:3px}
body[data-editing] [data-copy][contenteditable]{outline:1px solid var(--accent);outline-offset:2px;text-decoration:none}
`;

const ITEM =
  "mono block w-full px-2.5 py-1.5 text-left text-[9px] uppercase tracking-[0.14em] text-muted hover:bg-wash hover:text-accent";

interface Box {
  id: BlockId;
  hidden: boolean;
  top: number;
  left: number;
  width: number;
  height: number;
}

function sameBoxes(a: Box[], b: Box[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (x, i) =>
        x.id === b[i].id &&
        x.hidden === b[i].hidden &&
        x.top === b[i].top &&
        x.left === b[i].left &&
        x.width === b[i].width &&
        x.height === b[i].height,
    )
  );
}

/** Edit one string in place. Enter or blur commits, Escape puts it back. */
function editCopy(el: HTMLElement, send: (op: EditorOp) => void) {
  const key = el.dataset.copy as CopyKey;
  const before = el.textContent ?? "";
  let cancelled = false;

  el.contentEditable = "true";
  el.spellcheck = false;
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  const onKey = (ev: KeyboardEvent) => {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      el.blur();
    } else if (ev.key === "Escape") {
      ev.preventDefault();
      cancelled = true;
      el.textContent = before;
      el.blur();
    }
  };

  const finish = () => {
    el.removeEventListener("keydown", onKey);
    el.removeAttribute("contenteditable");
    const value = (el.textContent ?? "").trim();
    // An emptied string is a deliberate "give me the code default back" —
    // applyOp drops the override for an empty value.
    if (!cancelled && value !== before.trim()) send({ op: "copy", key, value });
  };

  el.addEventListener("keydown", onKey);
  el.addEventListener("blur", finish, { once: true });
}

export default function PageEditor({ hidden }: { hidden: BlockId[] }) {
  const router = useRouter();
  const [on, setOn] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [menu, setMenu] = useState<BlockId | null>(null);
  const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null);

  const send = useCallback(
    async (op: EditorOp) => {
      setMenu(null);
      let text = "Saved";
      let bad = false;
      try {
        // Trailing slash: next.config sets trailingSlash, and a 308 on a
        // POST costs a second round trip with the body re-sent.
        const res = await fetch("/api/admin/front-page/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(op),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          bad = true;
          text = data?.error || `Save failed (${res.status})`;
        }
      } catch (err) {
        bad = true;
        text = err instanceof Error ? err.message : "Network error";
      }
      setNote({ text, bad });
      // Refresh either way: on failure the page must resynchronise with
      // whatever the store actually holds.
      router.refresh();
    },
    [router],
  );

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), note.bad ? 4000 : 1500);
    return () => clearTimeout(t);
  }, [note]);

  useEffect(() => {
    if (!on) return;
    document.body.dataset.editing = "1";

    const measure = () => {
      const seen = new Set<string>();
      const next: Box[] = [];
      document.querySelectorAll<HTMLElement>("[data-block]").forEach((el) => {
        const id = el.dataset.block as BlockId;
        const r = el.getBoundingClientRect();
        // The portrait is rendered twice behind a media query — the copy
        // that is display:none measures zero.
        if (!r.width || !r.height || seen.has(id)) return;
        seen.add(id);
        next.push({
          id,
          hidden: el.dataset.blockHidden === "1",
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        });
      });
      setBoxes((prev) => (sameBoxes(prev, next) ? prev : next));
    };

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // router.refresh() swaps blocks out from under the handles; watch the
    // page rather than guessing how long a refresh takes.
    const observer = new MutationObserver(schedule);
    const main = document.querySelector("main");
    if (main)
      observer.observe(main, {
        childList: true,
        subtree: true,
        // A hide/show only flips this attribute — nothing moves, so the
        // handles would otherwise keep offering the wrong action.
        attributeFilter: ["data-block-hidden"],
      });

    const onClick = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (target?.closest("[data-editor-ui]")) return; // our own chrome
      setMenu(null);
      const el = target?.closest<HTMLElement>("[data-copy]");
      if (!el || el.isContentEditable) return;
      // Several editable strings sit inside links.
      ev.preventDefault();
      ev.stopPropagation();
      editCopy(el, (op) => void send(op));
    };
    document.addEventListener("click", onClick, true);

    return () => {
      delete document.body.dataset.editing;
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
    };
  }, [on, send]);

  // Blocks hidden in the config that are not in the DOM at all (the rail
  // renders nothing when hidden) would otherwise be unreachable.
  const offPage = hidden.filter((id) => !boxes.some((b) => b.id === id));

  return (
    <>
      <style>{EDIT_CSS}</style>

      <button
        data-editor-ui
        onClick={() => setOn(!on)}
        className="mono fixed bottom-6 right-6 z-[190] border border-ink bg-ink px-3.5 py-2 text-[10px] uppercase tracking-[0.14em] text-paper hover:opacity-90"
      >
        {on ? "✕ Done" : "✎ Edit page"}
      </button>

      {on &&
        createPortal(
          <>
            {/* Handle layer: fixed, so nothing here is in document flow. */}
            <div
              data-editor-ui
              className="pointer-events-none fixed inset-0 z-[180]"
            >
              {boxes.map((b) => (
                <div
                  key={b.id}
                  className="absolute"
                  style={{
                    top: b.top,
                    left: b.left,
                    width: b.width,
                    height: b.height,
                  }}
                >
                  {b.hidden ? (
                    <button
                      onClick={() => void send({ op: "show", block: b.id })}
                      className="mono pointer-events-auto absolute right-0 top-0 border border-accent bg-paper px-1.5 py-[3px] text-[8.5px] uppercase tracking-[0.14em] text-accent hover:bg-wash"
                    >
                      Show
                    </button>
                  ) : (
                    <button
                      onClick={() => setMenu(menu === b.id ? null : b.id)}
                      aria-label={`Edit ${b.id} block`}
                      className="mono pointer-events-auto absolute right-0 top-0 flex h-[19px] w-[19px] items-center justify-center border border-rule bg-paper text-[12px] leading-none text-accent hover:bg-wash"
                    >
                      &#8942;
                    </button>
                  )}

                  {menu === b.id && (
                    <div className="pointer-events-auto absolute right-0 top-[21px] w-[136px] border border-rule bg-paper">
                      <div className="label border-b border-hairline px-2.5 py-1 text-[8.5px]">
                        {b.id}
                      </div>
                      <button
                        onClick={() => void send({ op: "hide", block: b.id })}
                        className={ITEM}
                      >
                        {/* The rail is on every page, so this is not a
                            front-page-only edit. */}
                        {b.id === "rail" ? "Hide (site-wide)" : "Hide"}
                      </button>
                      {GROUPED.has(b.id) && (
                        <>
                          <button
                            onClick={() =>
                              void send({ op: "move", block: b.id, dir: -1 })
                            }
                            className={ITEM}
                          >
                            Move up
                          </button>
                          <button
                            onClick={() =>
                              void send({ op: "move", block: b.id, dir: 1 })
                            }
                            className={ITEM}
                          >
                            Move down
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* The pill's own menu, stacked above it. */}
            <div
              data-editor-ui
              className="fixed bottom-[4.4rem] right-6 z-[190] w-[186px] border border-rule bg-paper"
            >
              {note && (
                <div
                  className={`mono border-b border-hairline px-2.5 py-1.5 text-[9px] uppercase tracking-[0.14em] ${
                    note.bad ? "text-accent" : "text-muted"
                  }`}
                >
                  {note.text}
                </div>
              )}
              <button
                onClick={() =>
                  window.dispatchEvent(new Event(EDIT_ABOUT_EVENT))
                }
                className={ITEM}
              >
                Edit about text
              </button>
              {offPage.map((id) => (
                <button
                  key={id}
                  onClick={() => void send({ op: "show", block: id })}
                  className={ITEM}
                >
                  Show {id}
                </button>
              ))}
              <button
                onClick={() => {
                  if (confirm("Restore the front page to its code defaults?"))
                    void send({ op: "reset" });
                }}
                className={`${ITEM} border-t border-hairline text-accent`}
              >
                Restore defaults
              </button>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
