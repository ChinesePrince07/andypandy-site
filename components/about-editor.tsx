"use client";

import { useState } from "react";
import type { AboutData } from "@/lib/about";

type Section = null | "bio" | "education" | "skills" | "timeline";

const inputClass =
  "w-full border border-rule bg-wash px-3 py-2 text-sm ";

export default function AboutEditor({ data }: { data: AboutData }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Section>(null);
  const [draft, setDraft] = useState<AboutData>(data);
  const [saving, setSaving] = useState(false);

  function startEdit(section: Section) {
    setDraft(data);
    setEditing(section);
    setOpen(false);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/about/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        setEditing(null);
        window.location.reload();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[190] flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper transition-transform hover:scale-105 active:scale-95 "
        aria-label="Edit page"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
          />
        </svg>
      </button>

      {/* FAB menu */}
      {open && (
        <div className="fixed bottom-20 right-6 z-[190] flex flex-col gap-2 border border-rule bg-paper p-2 ">
          {(["bio", "education", "skills", "timeline"] as const).map((s) => (
            <button
              key={s}
              onClick={() => startEdit(s)}
              className="px-4 py-2 text-left text-sm font-medium text-muted hover:bg-wash capitalize"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/40 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto border border-rule bg-paper p-6 shadow-2xl ">
            <button
              onClick={() => setEditing(null)}
              className="absolute right-4 top-4 text-faint hover:text-accent"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="headline mb-4 text-[21px] capitalize">
              Edit {editing}
            </h2>

            {editing === "bio" && (
              <div className="space-y-3">
                {draft.bio.map((p, i) => (
                  <div key={i}>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-xs font-medium text-muted">
                        Paragraph {i + 1}
                      </label>
                      {draft.bio.length > 1 && (
                        <button
                          onClick={() =>
                            setDraft({
                              ...draft,
                              bio: draft.bio.filter((_, j) => j !== i),
                            })
                          }
                          className="text-xs text-accent text-accent"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={p}
                      onChange={(e) => {
                        const bio = [...draft.bio];
                        bio[i] = e.target.value;
                        setDraft({ ...draft, bio });
                      }}
                      className={inputClass}
                    />
                  </div>
                ))}
                <button
                  onClick={() =>
                    setDraft({ ...draft, bio: [...draft.bio, ""] })
                  }
                  className="text-xs text-faint hover:text-accent"
                >
                  + Add paragraph
                </button>
              </div>
            )}

            {editing === "education" && (
              <div className="space-y-4">
                {draft.education.map((entry, i) => (
                  <div
                    key={i}
                    className="border border-rule p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-faint uppercase tracking-wider">
                        Entry {i + 1}
                      </span>
                      {draft.education.length > 1 && (
                        <button
                          onClick={() =>
                            setDraft({
                              ...draft,
                              education: draft.education.filter(
                                (_, j) => j !== i,
                              ),
                            })
                          }
                          className="text-xs text-accent text-accent"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        School
                      </label>
                      <input
                        value={entry.school}
                        onChange={(e) => {
                          const education = [...draft.education];
                          education[i] = {
                            ...education[i],
                            school: e.target.value,
                          };
                          setDraft({ ...draft, education });
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        Location
                      </label>
                      <input
                        value={entry.location}
                        onChange={(e) => {
                          const education = [...draft.education];
                          education[i] = {
                            ...education[i],
                            location: e.target.value,
                          };
                          setDraft({ ...draft, education });
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        Year
                      </label>
                      <input
                        value={entry.year}
                        onChange={(e) => {
                          const education = [...draft.education];
                          education[i] = {
                            ...education[i],
                            year: e.target.value,
                          };
                          setDraft({ ...draft, education });
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">
                        Logo URL (optional)
                      </label>
                      <input
                        value={entry.logo || ""}
                        onChange={(e) => {
                          const education = [...draft.education];
                          education[i] = {
                            ...education[i],
                            logo: e.target.value || undefined,
                          };
                          setDraft({ ...draft, education });
                        }}
                        placeholder="https://example.com/logo.png"
                        className={inputClass}
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setDraft({
                      ...draft,
                      education: [
                        ...draft.education,
                        { school: "", location: "", year: "" },
                      ],
                    })
                  }
                  className="text-xs text-faint hover:text-accent"
                >
                  + Add entry
                </button>
              </div>
            )}

            {editing === "skills" && (
              <div className="space-y-4">
                {draft.skills.map((group, gi) => (
                  <div
                    key={gi}
                    className="border border-rule p-3 "
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={group.category}
                        onChange={(e) => {
                          const skills = [...draft.skills];
                          skills[gi] = {
                            ...skills[gi],
                            category: e.target.value,
                          };
                          setDraft({ ...draft, skills });
                        }}
                        className="flex-1 border border-rule bg-wash px-2 py-1 text-xs font-semibold uppercase "
                      />
                      <button
                        onClick={() =>
                          setDraft({
                            ...draft,
                            skills: draft.skills.filter((_, i) => i !== gi),
                          })
                        }
                        className="text-xs text-accent text-accent"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={group.items.join(", ")}
                      onChange={(e) => {
                        const skills = [...draft.skills];
                        skills[gi] = {
                          ...skills[gi],
                          items: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        };
                        setDraft({ ...draft, skills });
                      }}
                      placeholder="Comma-separated skills"
                      className="mt-2 w-full border border-rule bg-wash px-2 py-1 text-xs "
                    />
                  </div>
                ))}
                <button
                  onClick={() =>
                    setDraft({
                      ...draft,
                      skills: [...draft.skills, { category: "New", items: [] }],
                    })
                  }
                  className="text-xs text-faint hover:text-accent"
                >
                  + Add category
                </button>
              </div>
            )}

            {editing === "timeline" && (
              <div className="space-y-2">
                {draft.timeline.map((entry, i) => (
                  <div key={i}>
                    {/* Insert above button */}
                    <button
                      onClick={() => {
                        const timeline = [...draft.timeline];
                        timeline.splice(i, 0, {
                          year: "",
                          title: "",
                          description: "",
                        });
                        setDraft({ ...draft, timeline });
                      }}
                      className="mb-1 flex w-full items-center justify-center gap-1 border border-dashed border-rule py-1 text-[10px] text-faint hover:border-accent hover:text-accent"
                    >
                      + Insert here
                    </button>
                    <div className="border border-rule p-3 ">
                      <div className="mb-2 flex items-center gap-2">
                        <input
                          value={entry.year}
                          onChange={(e) => {
                            const timeline = [...draft.timeline];
                            timeline[i] = {
                              ...timeline[i],
                              year: e.target.value,
                            };
                            setDraft({ ...draft, timeline });
                          }}
                          placeholder="Year"
                          className="w-28 border border-rule bg-wash px-2 py-1 text-xs font-mono "
                        />
                        <input
                          value={entry.title}
                          onChange={(e) => {
                            const timeline = [...draft.timeline];
                            timeline[i] = {
                              ...timeline[i],
                              title: e.target.value,
                            };
                            setDraft({ ...draft, timeline });
                          }}
                          placeholder="Title"
                          className="flex-1 border border-rule bg-wash px-2 py-1 text-xs "
                        />
                        <button
                          onClick={() =>
                            setDraft({
                              ...draft,
                              timeline: draft.timeline.filter(
                                (_, j) => j !== i,
                              ),
                            })
                          }
                          className="text-xs text-accent text-accent"
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={entry.description}
                        onChange={(e) => {
                          const timeline = [...draft.timeline];
                          timeline[i] = {
                            ...timeline[i],
                            description: e.target.value,
                          };
                          setDraft({ ...draft, timeline });
                        }}
                        placeholder="Description"
                        className="w-full border border-rule bg-wash px-2 py-1 text-xs "
                      />
                    </div>
                  </div>
                ))}
                {/* Insert at end */}
                <button
                  onClick={() =>
                    setDraft({
                      ...draft,
                      timeline: [
                        ...draft.timeline,
                        { year: "", title: "", description: "" },
                      ],
                    })
                  }
                  className="flex w-full items-center justify-center gap-1 border border-dashed border-rule py-1.5 text-[10px] text-faint hover:border-accent hover:text-accent"
                >
                  + Insert at end
                </button>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="border border-rule px-4 py-2 text-sm text-muted hover:bg-wash"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
