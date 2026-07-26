"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  "mono block w-full px-2.5 py-1.5 text-left text-[9px] uppercase tracking-[0.14em] text-muted hover:bg-wash hover:text-accent disabled:pointer-events-none disabled:opacity-40";

/** Only these blocks are gated by a viewport media query rather than the
 * config's `hidden` list — whichever the current width doesn't render
 * measures zero and never gets a handle, so they need a way in regardless
 * of hidden state. */
const VIEWPORT_GATED: readonly BlockId[] = ["livestrip", "rail"];

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
function editCopy(el: HTMLElement, send: (op: EditorOp) => Promise<boolean>) {
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
    // Every copy key is a single line (kicker, title, tagline — see
    // COPY_DEFAULTS), so Shift+Enter commits exactly like plain Enter
    // rather than inserting a newline: a <br> here would live in the DOM
    // but vanish the moment anything reads el.textContent (the save path,
    // and the restore-on-reject path below), silently desyncing the two.
    if (ev.key === "Enter") {
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
    if (cancelled || value === before.trim()) return;
    void send({ op: "copy", key, value }).then((ok) => {
      // router.refresh() re-renders the same server string React already
      // has committed, so on a rejected save nothing else will put the old
      // text back — this has to do it explicitly.
      if (!ok) el.textContent = before;
    });
  };

  el.addEventListener("keydown", onKey);
  el.addEventListener("blur", finish, { once: true });
}

export default function PageEditor({ hidden }: { hidden: BlockId[] }) {
  const router = useRouter();
  const [on, setOn] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [railBoxes, setRailBoxes] = useState<
    { slug: string; top: number; left: number; width: number; height: number }[]
  >([]);
  const [menu, setMenu] = useState<BlockId | null>(null);
  const [note, setNote] = useState<{ text: string; bad: boolean } | null>(null);
  // A ref (not just the `busy` state below) so the reentrancy check inside
  // `send` always reads the live value — `send` is memoized once with
  // `[router]`, so a stale `busy` closure would never see a later op arrive.
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const send = useCallback(
    async (op: EditorOp): Promise<boolean> => {
      // Two rapid clicks (e.g. two "move" presses) would otherwise both
      // read the config before either write lands, and the second save
      // clobbers the first. Block a second op until this one settles.
      if (busyRef.current) return false;
      busyRef.current = true;
      setBusy(true);
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
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
      setNote({ text, bad });
      // Refresh either way: on failure the page must resynchronise with
      // whatever the store actually holds.
      router.refresh();
      return !bad;
    },
    [router],
  );

  // The rail's order lives in a different store from the front-page config,
  // so it gets its own call. Current order is read from the DOM, which is
  // the rendered truth, then two neighbours swap.
  const moveRail = useCallback(
    async (slug: string, dir: -1 | 1) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      let text = "Saved";
      let bad = false;
      try {
        const order = [...document.querySelectorAll<HTMLElement>("[data-rail]")]
          .map((el) => el.dataset.rail!)
          .filter(Boolean);
        const i = order.indexOf(slug);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= order.length) {
          busyRef.current = false;
          setBusy(false);
          return;
        }
        [order[i], order[j]] = [order[j], order[i]];
        const railEl = document.querySelector<HTMLElement>('[data-block="rail"]');
        const hiddenSlugs = (railEl?.dataset.railHidden || "")
          .split(",")
          .filter(Boolean);
        const res = await fetch("/api/admin/projects/live-sites/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order, hidden: hiddenSlugs }),
        });
        if (!res.ok) {
          bad = true;
          const data = await res.json().catch(() => null);
          text = data?.error || `Save failed (${res.status})`;
        }
      } catch (err) {
        bad = true;
        text = err instanceof Error ? err.message : "Network error";
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
      setNote({ text, bad });
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

      const rails = [...document.querySelectorAll<HTMLElement>("[data-rail]")]
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            slug: el.dataset.rail!,
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
          };
        })
        .filter((b) => b.width && b.height);
      setRailBoxes((prev) =>
        JSON.stringify(prev) === JSON.stringify(rails) ? prev : rails,
      );
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
      if (busyRef.current) return; // a save is already in flight
      const el = target?.closest<HTMLElement>("[data-copy]");
      if (!el || el.isContentEditable) return;
      // Several editable strings sit inside links.
      ev.preventDefault();
      ev.stopPropagation();
      editCopy(el, send);
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
  // renders nothing when hidden), plus the viewport-gated pair that is
  // never both on screen at once, would otherwise be unreachable.
  const offPage = [...new Set([...hidden, ...VIEWPORT_GATED])].filter(
    (id) => !boxes.some((b) => b.id === id),
  );

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
              {railBoxes.map((b, i) => (
                <div
                  key={b.slug}
                  className="absolute flex flex-col"
                  style={{ top: b.top + 2, left: b.left + b.width - 15 }}
                >
                  <button
                    onClick={() => void moveRail(b.slug, -1)}
                    disabled={busy || i === 0}
                    aria-label={`Move ${b.slug} up`}
                    className="mono pointer-events-auto flex h-[13px] w-[15px] items-center justify-center border border-rule bg-paper text-[8px] leading-none text-accent hover:bg-wash disabled:pointer-events-none disabled:opacity-30"
                  >
                    &#9650;
                  </button>
                  <button
                    onClick={() => void moveRail(b.slug, 1)}
                    disabled={busy || i === railBoxes.length - 1}
                    aria-label={`Move ${b.slug} down`}
                    className="mono pointer-events-auto flex h-[13px] w-[15px] items-center justify-center border border-rule border-t-0 bg-paper text-[8px] leading-none text-accent hover:bg-wash disabled:pointer-events-none disabled:opacity-30"
                  >
                    &#9660;
                  </button>
                </div>
              ))}

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
                      disabled={busy}
                      className="mono pointer-events-auto absolute right-0 top-0 border border-accent bg-paper px-1.5 py-[3px] text-[8.5px] uppercase tracking-[0.14em] text-accent hover:bg-wash disabled:pointer-events-none disabled:opacity-40"
                    >
                      Show
                    </button>
                  ) : (
                    <button
                      onClick={() => setMenu(menu === b.id ? null : b.id)}
                      disabled={busy}
                      aria-label={`Edit ${b.id} block`}
                      className="mono pointer-events-auto absolute right-0 top-0 flex h-[19px] w-[19px] items-center justify-center border border-rule bg-paper text-[12px] leading-none text-accent hover:bg-wash disabled:pointer-events-none disabled:opacity-40"
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
                        disabled={busy}
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
                            disabled={busy}
                            className={ITEM}
                          >
                            Move up
                          </button>
                          <button
                            onClick={() =>
                              void send({ op: "move", block: b.id, dir: 1 })
                            }
                            disabled={busy}
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
              {(busy || note) && (
                <div
                  className={`mono border-b border-hairline px-2.5 py-1.5 text-[9px] uppercase tracking-[0.14em] ${
                    !busy && note?.bad ? "text-accent" : "text-muted"
                  }`}
                >
                  {busy ? "Saving…" : note!.text}
                </div>
              )}
              <button
                onClick={() =>
                  window.dispatchEvent(new Event(EDIT_ABOUT_EVENT))
                }
                disabled={busy}
                className={ITEM}
              >
                Edit about text
              </button>
              {offPage.map((id) => {
                const isHidden = hidden.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() =>
                      void send({ op: isHidden ? "show" : "hide", block: id })
                    }
                    disabled={busy}
                    className={ITEM}
                  >
                    {isHidden ? "Show" : "Hide"} {id}
                    {/* The rail is on every page, so hiding it from here is
                        not a front-page-only edit. */}
                    {!isHidden && id === "rail" ? " (site-wide)" : ""}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  if (confirm("Restore the front page to its code defaults?"))
                    void send({ op: "reset" });
                }}
                disabled={busy}
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
