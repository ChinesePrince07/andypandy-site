"use client";

import { useState, useRef } from "react";
import type { Place, TravelData, TravelDay, Trip } from "@/lib/travel";

/* ------------------------------ helpers -------------------------------- */

function genId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* ignore */
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

async function uploadFile(file: File): Promise<string> {
  // Uniquify the name so two "IMG_0001.jpg" uploads don't overwrite each other.
  const unique = `travel-${genId()}-${file.name}`;
  const renamed = new File([file], unique, { type: file.type });
  const form = new FormData();
  form.append("file", renamed);
  const res = await fetch("/api/admin/upload-blob/", { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { url: string };
  return data.url;
}

function emptyTrip(): Trip {
  return {
    id: genId(),
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    cover: "",
    summary: "",
    days: [],
  };
}

function emptyDay(): TravelDay {
  return {
    id: genId(),
    date: "",
    title: "",
    notes: "",
    hotel: undefined,
    restaurants: [],
    photos: [],
  };
}

function emptyPlace(): Place {
  return { name: "", dish: "", note: "", image: "", url: "" };
}

const inputClass =
  "w-full border border-rule bg-wash px-3 py-2 text-sm ";
const labelClass = "mb-1 block text-xs font-medium text-muted";

/* --------------------------- image field ------------------------------- */

function ImageField({
  value,
  onChange,
  label = "Image",
  aspect = "h-28 w-full",
}: {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: string;
}) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (err) {
      alert("Upload failed: " + (err as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="flex items-start gap-3">
        <div
          className={`${aspect} max-w-[120px] shrink-0 overflow-hidden border border-rule bg-wash `}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-faint">
              none
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="border border-rule px-3 py-1.5 text-xs font-medium text-muted hover:bg-wash disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Upload"}
          </button>
          <input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image URL"
            className={inputClass}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-accent text-accent"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- photo strip ------------------------------- */

function PhotoStrip({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (next: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        urls.push(await uploadFile(file));
      }
      onChange([...photos, ...urls]);
    } catch (err) {
      alert("Upload failed: " + (err as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <span className={labelClass}>Photos</span>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {photos.map((src, i) => (
          <div
            key={i}
            className="group relative aspect-square overflow-hidden border border-rule "
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/60 text-xs text-paper opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="flex aspect-square items-center justify-center border border-dashed border-rule text-xs text-faint hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {busy ? "…" : "+ Add"}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
    </div>
  );
}

/* --------------------------- place editor ------------------------------ */

function PlaceFields({
  place,
  onChange,
  kind,
}: {
  place: Place;
  onChange: (patch: Partial<Place>) => void;
  kind: "hotel" | "restaurant";
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className={labelClass}>Name</label>
        <input
          value={place.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={kind === "hotel" ? "Hotel name" : "Restaurant name"}
          className={inputClass}
        />
      </div>
      {kind === "restaurant" && (
        <div>
          <label className={labelClass}>What you ate</label>
          <input
            value={place.dish || ""}
            onChange={(e) => onChange({ dish: e.target.value })}
            placeholder="The dish / order"
            className={inputClass}
          />
        </div>
      )}
      <div>
        <label className={labelClass}>Note</label>
        <input
          value={place.note || ""}
          onChange={(e) => onChange({ note: e.target.value })}
          placeholder={kind === "hotel" ? "Vibe, view, rating…" : "How was it?"}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Link (optional)</label>
        <input
          value={place.url || ""}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="Maps / website URL"
          className={inputClass}
        />
      </div>
      <ImageField
        label="Photo"
        value={place.image}
        onChange={(url) => onChange({ image: url })}
      />
    </div>
  );
}

/* ------------------------------ editor --------------------------------- */

export default function TravelEditor({ data }: { data: TravelData }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TravelData>(data);
  const [saving, setSaving] = useState(false);

  function open() {
    setDraft(structuredClone(data));
    setEditing(true);
  }

  /* ---- immutable update helpers, keyed by id ---- */

  function patchTrip(tripId: string, patch: Partial<Trip>) {
    setDraft((d) => ({
      trips: d.trips.map((t) => (t.id === tripId ? { ...t, ...patch } : t)),
    }));
  }
  function patchDay(tripId: string, dayId: string, patch: Partial<TravelDay>) {
    setDraft((d) => ({
      trips: d.trips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              days: t.days.map((day) =>
                day.id === dayId ? { ...day, ...patch } : day,
              ),
            }
          : t,
      ),
    }));
  }
  function mutateRestaurants(
    tripId: string,
    dayId: string,
    fn: (list: Place[]) => Place[],
  ) {
    setDraft((d) => ({
      trips: d.trips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              days: t.days.map((day) =>
                day.id === dayId
                  ? { ...day, restaurants: fn(day.restaurants ?? []) }
                  : day,
              ),
            }
          : t,
      ),
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/travel/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (res.ok) {
        setEditing(false);
        window.location.reload();
      } else {
        alert("Save failed: " + (await res.text()));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={open}
        className="fixed bottom-6 right-6 z-[190] flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper transition-transform hover:scale-105 active:scale-95 "
        aria-label="Edit travels"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      </button>

      {editing && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-ink/40 p-3 backdrop-blur-sm sm:p-6">
          <div className="relative my-4 w-full max-w-lg border border-rule bg-paper p-5 shadow-2xl ">
            <button
              onClick={() => setEditing(false)}
              className="absolute right-4 top-4 text-faint hover:text-accent"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="headline mb-4 text-[21px]">Edit travels</h2>

            <div className="space-y-3">
              {draft.trips.map((trip) => (
                <details
                  key={trip.id}
                  className="border border-rule "
                >
                  <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-semibold hover:bg-wash">
                    {trip.title || "Untitled trip"}
                    <span className="ml-2 font-normal text-faint">
                      {trip.location}
                    </span>
                  </summary>

                  <div className="space-y-3 border-t border-rule p-3 ">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className={labelClass}>Title</label>
                        <input
                          value={trip.title}
                          onChange={(e) => patchTrip(trip.id, { title: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={labelClass}>Location</label>
                        <input
                          value={trip.location}
                          onChange={(e) => patchTrip(trip.id, { location: e.target.value })}
                          placeholder="City, Country"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Start date</label>
                        <input
                          type="date"
                          value={trip.startDate}
                          onChange={(e) => patchTrip(trip.id, { startDate: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>End date</label>
                        <input
                          type="date"
                          value={trip.endDate || ""}
                          onChange={(e) => patchTrip(trip.id, { endDate: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Summary</label>
                      <textarea
                        rows={2}
                        value={trip.summary || ""}
                        onChange={(e) => patchTrip(trip.id, { summary: e.target.value })}
                        className={inputClass}
                      />
                    </div>

                    <ImageField
                      label="Cover image"
                      value={trip.cover}
                      aspect="h-20 w-full"
                      onChange={(url) => patchTrip(trip.id, { cover: url })}
                    />

                    {/* Days */}
                    <div className="space-y-2 bg-wash p-2 ">
                      <div className="mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                        Days
                      </div>
                      {trip.days.map((day) => (
                        <details
                          key={day.id}
                          className="border border-rule bg-paper "
                        >
                          <summary className="cursor-pointer select-none px-3 py-2 text-sm hover:bg-wash">
                            {day.date || "New day"}
                            {day.title ? ` · ${day.title}` : ""}
                          </summary>
                          <div className="space-y-3 border-t border-rule p-3 ">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Date</label>
                                <input
                                  type="date"
                                  value={day.date}
                                  onChange={(e) => patchDay(trip.id, day.id, { date: e.target.value })}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Title</label>
                                <input
                                  value={day.title || ""}
                                  onChange={(e) => patchDay(trip.id, day.id, { title: e.target.value })}
                                  placeholder="Headline"
                                  className={inputClass}
                                />
                              </div>
                            </div>
                            <div>
                              <label className={labelClass}>What you did</label>
                              <textarea
                                rows={3}
                                value={day.notes || ""}
                                onChange={(e) => patchDay(trip.id, day.id, { notes: e.target.value })}
                                className={inputClass}
                              />
                            </div>

                            {/* Hotel */}
                            <div className="border border-rule p-2.5 ">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                                  Hotel
                                </span>
                                {day.hotel ? (
                                  <button
                                    type="button"
                                    onClick={() => patchDay(trip.id, day.id, { hotel: undefined })}
                                    className="text-xs text-accent text-accent"
                                  >
                                    Remove
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => patchDay(trip.id, day.id, { hotel: emptyPlace() })}
                                    className="text-xs text-accent hover:underline"
                                  >
                                    + Add hotel
                                  </button>
                                )}
                              </div>
                              {day.hotel && (
                                <PlaceFields
                                  kind="hotel"
                                  place={day.hotel}
                                  onChange={(patch) =>
                                    patchDay(trip.id, day.id, {
                                      hotel: { ...(day.hotel as Place), ...patch },
                                    })
                                  }
                                />
                              )}
                            </div>

                            {/* Restaurants */}
                            <div className="border border-rule p-2.5 ">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                                  Restaurants
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    mutateRestaurants(trip.id, day.id, (l) => [...l, emptyPlace()])
                                  }
                                  className="text-xs text-accent hover:underline"
                                >
                                  + Add
                                </button>
                              </div>
                              <div className="space-y-3">
                                {(day.restaurants ?? []).map((r, ri) => (
                                  <div
                                    key={ri}
                                    className="bg-wash p-2.5 "
                                  >
                                    <div className="mb-1 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          mutateRestaurants(trip.id, day.id, (l) =>
                                            l.filter((_, j) => j !== ri),
                                          )
                                        }
                                        className="text-xs text-accent text-accent"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                    <PlaceFields
                                      kind="restaurant"
                                      place={r}
                                      onChange={(patch) =>
                                        mutateRestaurants(trip.id, day.id, (l) =>
                                          l.map((item, j) => (j === ri ? { ...item, ...patch } : item)),
                                        )
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Photos */}
                            <PhotoStrip
                              photos={day.photos ?? []}
                              onChange={(next) => patchDay(trip.id, day.id, { photos: next })}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                patchTrip(trip.id, {
                                  days: trip.days.filter((dd) => dd.id !== day.id),
                                })
                              }
                              className="text-xs text-accent text-accent"
                            >
                              Delete this day
                            </button>
                          </div>
                        </details>
                      ))}
                      <button
                        type="button"
                        onClick={() => patchTrip(trip.id, { days: [...trip.days, emptyDay()] })}
                        className="w-full border border-dashed border-rule py-1.5 text-xs text-faint hover:border-accent hover:text-accent"
                      >
                        + Add day
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ trips: d.trips.filter((t) => t.id !== trip.id) }))
                      }
                      className="text-xs text-accent text-accent"
                    >
                      Delete trip
                    </button>
                  </div>
                </details>
              ))}

              <button
                type="button"
                onClick={() => setDraft((d) => ({ trips: [...d.trips, emptyTrip()] }))}
                className="w-full border border-dashed border-rule py-2.5 text-sm font-medium text-muted hover:border-accent hover:text-accent"
              >
                + Add trip
              </button>
            </div>

            <div className="sticky bottom-0 mt-5 flex justify-end gap-3 border-t border-rule bg-paper pt-4 ">
              <button
                onClick={() => setEditing(false)}
                className="border border-rule px-4 py-2 text-sm text-muted hover:bg-wash"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
