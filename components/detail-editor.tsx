"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export interface DetailMedia {
  type: "image" | "video";
  src: string;
  caption?: string;
  position?: "center" | "top" | "bottom" | "left" | "right" | "contain";
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

  function updatePosition(
    index: number,
    position: "center" | "top" | "bottom" | "left" | "right" | "contain",
  ) {
    if (media[index]?.position === position) return;
    const next = media.map((m, i) => (i === index ? { ...m, position } : m));
    void run(() => save(paragraphs(text), next), "Frame focus updated");
  }

  /* ── Crop modal state ─────────────────────────────────────────────── */
  const [cropIdx, setCropIdx] = useState<number | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [cropZoom, setCropZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ startX: number; startY: number; origPanX: number; origPanY: number } | null>(null);

  // Redraw preview whenever pan/zoom/bitmap changes
  const paint = useCallback(() => {
    const c = canvasRef.current;
    const b = bitmap;
    if (!c || !b) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);
    // "cover" fit then user zoom
    const scale = Math.max(W / b.width, H / b.height) * cropZoom;
    const dw = b.width * scale, dh = b.height * scale;
    const dx = (W - dw) / 2 + panX;
    const dy = (H - dh) / 2 + panY;
    ctx.drawImage(b, dx, dy, dw, dh);
  }, [bitmap, panX, panY, cropZoom]);

  useEffect(() => { paint(); }, [paint]);

  function openCrop(i: number) {
    setCropIdx(i);
    setPanX(0); setPanY(0); setCropZoom(1); setBitmap(null);
    // Same-origin fetch avoids CORS tainting the canvas
    fetch(media[i].src)
      .then(r => r.blob())
      .then(b => createImageBitmap(b))
      .then(bmp => setBitmap(bmp))
      .catch(() => alert("Could not load image"));
  }

  function closeCrop() { setCropIdx(null); setBitmap(null); }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, origPanX: panX, origPanY: panY };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    setPanX(d.origPanX + (e.clientX - d.startX));
    setPanY(d.origPanY + (e.clientY - d.startY));
  }
  function onPointerUp() { drag.current = null; }

  async function applyCrop() {
    if (cropIdx === null || !bitmap) return;
    const bmp = bitmap, idx = cropIdx;
    await run(async () => {
      const OW = 800, OH = 500;
      const cvs = document.createElement("canvas");
      cvs.width = OW; cvs.height = OH;
      const ctx = cvs.getContext("2d")!;
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, OW, OH);
      // Map preview pan to export dimensions
      const p = canvasRef.current;
      const pW = p?.width ?? OW, pH = p?.height ?? OH;
      const rx = OW / pW, ry = OH / pH;
      const scale = Math.max(OW / bmp.width, OH / bmp.height) * cropZoom;
      const dw = bmp.width * scale, dh = bmp.height * scale;
      ctx.drawImage(bmp, (OW - dw) / 2 + panX * rx, (OH - dh) / 2 + panY * ry, dw, dh);
      // Export
      const blob = await new Promise<Blob | null>(r => cvs.toBlob(r, "image/jpeg", 0.92));
      if (!blob) throw new Error("Export failed");
      const form = new FormData();
      form.append("file", new File([blob], `crop-${slug}-${Date.now()}.jpg`, { type: "image/jpeg" }));
      const res = await fetch("/api/admin/upload-blob/", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const { url } = (await res.json()) as { url: string };
      const next: DetailMedia[] = media.map((m, i) =>
        i === idx ? { ...m, src: url, position: "center" as const } : m,
      );
      await save(paragraphs(text), next);
      closeCrop();
    }, "Cropped & saved");
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
                  {m.type === "image" && (
                    <button
                      onClick={() => openCrop(i)}
                      disabled={busy}
                      className="cursor-pointer border border-rule px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-ink hover:border-accent hover:text-accent disabled:opacity-30"
                      title="Crop Photo"
                    >
                      ✂️ Crop
                    </button>
                  )}
                  <select
                    value={m.position ?? "center"}
                    onChange={(e) =>
                      updatePosition(
                        i,
                        e.target.value as
                          | "center"
                          | "top"
                          | "bottom"
                          | "left"
                          | "right"
                          | "contain",
                      )
                    }
                    className="cursor-pointer border border-rule bg-paper px-1.5 py-1 text-[9.5px] uppercase tracking-[0.08em] text-ink focus:border-accent focus:outline-none"
                    title="Choose frame focus / crop"
                  >
                    <option value="center">Crop: Center</option>
                    <option value="top">Crop: Top</option>
                    <option value="bottom">Crop: Bottom</option>
                    <option value="left">Crop: Left</option>
                    <option value="right">Crop: Right</option>
                    <option value="contain">Fit Entire Image</option>
                  </select>
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

      {/* ── Crop modal ──────────────────────────────────────────────── */}
      {cropIdx !== null && media[cropIdx] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="mono w-full max-w-[640px] border border-rule bg-paper p-5 shadow-2xl text-ink">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-rule pb-3 mb-3">
              <span className="text-[12px] font-bold uppercase tracking-[0.14em]">Crop Photo</span>
              <button onClick={closeCrop} className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-faint hover:text-accent">✕ Close</button>
            </div>

            <p className="text-[10px] text-faint uppercase tracking-[0.1em] mb-2">Drag to pan · Zoom slider below</p>

            {/* Canvas — WYSIWYG: what you see = what gets saved */}
            <canvas
              ref={canvasRef}
              width={576}
              height={360}
              className="w-full border border-rule cursor-grab active:cursor-grabbing touch-none"
              style={{ aspectRatio: "8/5", background: "#0a0a0a" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
            {!bitmap && <p className="mt-2 text-center text-[10px] text-faint uppercase tracking-[0.1em]">Loading…</p>}

            {/* Zoom */}
            <div className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.12em]">
              <span className="w-14 text-faint">Zoom</span>
              <input type="range" min="1" max="4" step="0.05" value={cropZoom} onChange={e => setCropZoom(parseFloat(e.target.value))} className="flex-1 accent-accent" />
              <span className="w-14 text-right">{Math.round(cropZoom * 100)}%</span>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between border-t border-rule pt-3">
              <button onClick={() => { setPanX(0); setPanY(0); setCropZoom(1); }} className="cursor-pointer text-[10px] uppercase tracking-[0.12em] text-faint hover:text-ink">↺ Reset</button>
              <div className="flex items-center gap-3">
                <button onClick={closeCrop} className="cursor-pointer border border-rule px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-faint hover:text-ink">Cancel</button>
                <button onClick={() => void applyCrop()} disabled={busy || !bitmap} className="cursor-pointer border border-accent bg-accent px-4 py-1.5 text-[10px] uppercase tracking-[0.14em] text-paper font-bold hover:opacity-90 disabled:opacity-40">
                  {busy ? "Saving…" : "Apply Crop"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
