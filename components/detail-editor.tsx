"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export interface DetailMedia {
  type: "image" | "video";
  src: string;
  caption?: string;
}

/**
 * Inline editor for a schooling or experience page: rewrite the prose,
 * attach images and video. Uploads go through the same /api/admin/upload-blob
 * the blog editor uses.
 *
 * `doc` is the whole stored document (the about payload, or the experience
 * array). It is sent back whole, with only this entry's body/media replaced,
 * so nothing else in the file is disturbed.
 */
export default function DetailEditor({
  kind,
  slug,
  doc,
  body,
  media,
}: {
  kind: "education" | "experience";
  slug: string;
  doc: unknown;
  body: string[];
  media: DetailMedia[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(body.join("\n\n"));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const endpoint =
    kind === "education" ? "/api/admin/about/" : "/api/admin/experience/";

  // Blank lines separate paragraphs — the same convention the prose renderer
  // uses, so what is typed is what appears.
  function paragraphs(value: string): string[] {
    return value
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  function withEntry(nextBody: string[], nextMedia: DetailMedia[]): unknown {
    if (kind === "experience") {
      return (doc as { slug: string }[]).map((e) =>
        e.slug === slug ? { ...e, body: nextBody, media: nextMedia } : e,
      );
    }
    const about = doc as {
      education: { school: string }[];
      [k: string]: unknown;
    };
    const slugify = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return {
      ...about,
      education: about.education.map((e) =>
        slugify(e.school) === slug
          ? { ...e, body: nextBody, media: nextMedia }
          : e,
      ),
    };
  }

  async function save(nextBody: string[], nextMedia: DetailMedia[]) {
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withEntry(nextBody, nextMedia)),
    });
    if (!res.ok) throw new Error(`Save failed (${res.status})`);
    router.refresh();
  }

  async function run(fn: () => Promise<void>, ok: string) {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      await fn();
      setNote(ok);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
      setTimeout(() => setNote(null), 2500);
    }
  }

  function moveMedia(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= media.length) return;
    const next = [...media];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    void run(() => save(paragraphs(text), next), "Reordered");
  }

  function updateCaption(index: number, caption: string) {
    if (media[index]?.caption === caption) return;
    const next = media.map((m, i) => (i === index ? { ...m, caption } : m));
    void run(() => save(paragraphs(text), next), "Caption updated");
  }

  return (
    <div className="mt-10 border-t border-rule pt-5">
      <div className="kicker">Admin</div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        spellCheck
        placeholder="One paragraph per block, separated by a blank line."
        className="mt-3 w-full max-w-[760px] border border-rule bg-paper p-3 text-[15px] leading-relaxed text-body focus:border-accent focus:outline-none"
      />

      <div className="mono mt-2 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.16em]">
        <button
          onClick={() => void run(() => save(paragraphs(text), media), "Saved")}
          disabled={busy}
          className="cursor-pointer border border-rule px-3 py-1.5 uppercase tracking-[0.14em] text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
        >
          {busy ? "Working…" : "Save text"}
        </button>

        <button
          onClick={() => input.current?.click()}
          disabled={busy}
          className="cursor-pointer border border-rule px-3 py-1.5 uppercase tracking-[0.14em] text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
        >
          Add images / video
        </button>

        {note && <span className="text-faint">{note}</span>}

        <input
          ref={input}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => {
            const files = e.target.files;
            if (!files?.length) return;
            void run(async () => {
              const added: DetailMedia[] = [];
              for (const file of Array.from(files)) {
                const form = new FormData();
                form.append("file", file, `${kind}-${slug}-${file.name}`);
                const res = await fetch("/api/admin/upload-blob/", {
                  method: "POST",
                  body: form,
                });
                if (!res.ok) throw new Error(`Upload failed (${res.status})`);
                const { url } = (await res.json()) as { url: string };
                added.push({
                  type: file.type.startsWith("video/") ? "video" : "image",
                  src: url,
                });
              }
              // Save the edited text alongside, so an upload never silently
              // discards prose typed but not yet saved.
              await save(paragraphs(text), [...media, ...added]);
            }, "Uploaded");
            if (input.current) input.current.value = "";
          }}
        />
      </div>

      {media.length > 0 && (
        <div className="mt-5 max-w-[760px] space-y-2">
          <div className="mono text-[10px] uppercase tracking-[0.16em] text-faint">
            Re-order & Edit Media Plates ({media.length})
          </div>
          <ul className="space-y-2">
            {media.map((m, i) => (
              <li
                key={m.src}
                className="mono flex flex-wrap items-center justify-between gap-3 border border-rule bg-paper p-2.5 text-[11px] text-body"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.src}
                    alt=""
                    className="h-10 w-12 border border-rule object-cover shrink-0"
                  />
                  <div className="truncate min-w-0 flex-1">
                    <span className="font-semibold text-ink block truncate">
                      {m.src.split("/").pop()}
                    </span>
                    <input
                      type="text"
                      defaultValue={m.caption ?? ""}
                      placeholder="Add caption..."
                      onBlur={(e) => updateCaption(i, e.target.value)}
                      className="mt-1 w-full border-b border-hairline bg-transparent text-[10px] text-faint focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => moveMedia(i, "up")}
                    disabled={busy || i === 0}
                    className="cursor-pointer border border-rule px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-ink hover:border-accent hover:text-accent disabled:opacity-30"
                    title="Move Up"
                  >
                    ↑ Up
                  </button>
                  <button
                    onClick={() => moveMedia(i, "down")}
                    disabled={busy || i === media.length - 1}
                    className="cursor-pointer border border-rule px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-ink hover:border-accent hover:text-accent disabled:opacity-30"
                    title="Move Down"
                  >
                    ↓ Down
                  </button>
                  <button
                    onClick={() =>
                      confirm("Remove this plate?") &&
                      void run(
                        () =>
                          save(
                            paragraphs(text),
                            media.filter((_, idx) => idx !== i),
                          ),
                        "Removed",
                      )
                    }
                    disabled={busy}
                    className="cursor-pointer border border-rule px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-accent hover:bg-accent hover:text-paper disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
