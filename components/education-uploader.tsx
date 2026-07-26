"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { AboutData, EducationMedia } from "@/lib/about";
import { educationSlug } from "@/lib/about";

/**
 * Admin-only uploader for a school's plates. Uses the same endpoint the blog
 * editor uses (/api/admin/upload-blob), then writes the resulting URL onto
 * the matching education entry and saves the whole about payload back.
 *
 * The full payload goes back because /api/admin/about takes the whole object;
 * spreading `about` here keeps every other field intact.
 */
export default function EducationUploader({
  about,
  slug,
}: {
  about: AboutData;
  slug: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const entry = about.education.find((e) => educationSlug(e.school) === slug);
  if (!entry) return null;

  async function persist(media: EducationMedia[]) {
    const next: AboutData = {
      ...about,
      education: about.education.map((e) =>
        educationSlug(e.school) === slug ? { ...e, media } : e,
      ),
    };
    const res = await fetch("/api/admin/about/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!res.ok) throw new Error(`Save failed (${res.status})`);
    router.refresh();
  }

  async function onPick(files: FileList | null) {
    if (!files?.length || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const added: EducationMedia[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        // Namespaced so two schools can both have a "campus.jpg".
        form.append("file", file, `education-${slug}-${file.name}`);
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
      await persist([...(entry?.media ?? []), ...added]);
      setNote(`Added ${added.length}`);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
      setTimeout(() => setNote(null), 2500);
    }
  }

  async function remove(src: string) {
    if (busy || !confirm("Remove this plate?")) return;
    setBusy(true);
    try {
      await persist((entry?.media ?? []).filter((m) => m.src !== src));
      setNote("Removed");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
      setTimeout(() => setNote(null), 2500);
    }
  }

  return (
    <div className="mt-8 border-t border-rule pt-5">
      <div className="mono flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.16em]">
        <span className="text-accent">Admin</span>
        <button
          onClick={() => input.current?.click()}
          disabled={busy}
          className="mono cursor-pointer border border-rule px-3 py-1.5 uppercase tracking-[0.14em] text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
        >
          {busy ? "Working…" : "Upload plates"}
        </button>
        {note && <span className="text-faint">{note}</span>}
        <input
          ref={input}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => onPick(e.target.files)}
        />
      </div>

      {(entry.media ?? []).length > 0 && (
        <ul className="mono mt-3 flex flex-col gap-1 text-[9.5px] text-faint">
          {(entry.media ?? []).map((m) => (
            <li key={m.src} className="flex items-center gap-3">
              <span className="truncate">{m.src.split("/").pop()}</span>
              <button
                onClick={() => remove(m.src)}
                disabled={busy}
                className="shrink-0 cursor-pointer uppercase tracking-[0.14em] text-accent disabled:opacity-40"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
