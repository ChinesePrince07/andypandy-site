# Front-page visual editor

**Date:** 2026-07-26
**Status:** approved, not yet implemented

## Problem

The site already has a CMS underneath it. Bio, education, skills, travel, posts,
photos, and project pin/delete/live-ordering all live in R2 and have admin
editors. What has no editing story is the page furniture: "Specification",
"Correspondence", "From the notebook", the portrait plate, the rail. Those are
TSX, so removing one means a code change and a deploy.

Andy asked for "an editor like Wix to edit/delete elements I don't like".

## Goals

On the front page (`/`), while logged in as admin:

- Hide and restore named blocks.
- Reorder blocks within their column.
- Rewrite any fixed wording in place, seeing it in the real typeface at the
  real size.
- Saves go live immediately.

## Non-goals

Stated explicitly so the boundary does not erode:

- **No freeform canvas.** No drag-anywhere, no per-element fonts, colours, or
  spacing. Wix owns its rendering stack; this site's look comes from a tight
  design system, and a generic canvas would let the Broadsheet grid break.
- **No new blocks.** Only blocks that exist in the code can be hidden, moved,
  or reworded. Adding blocks is the "page-as-data" approach, deliberately
  deferred.
- **Other pages are out of scope.** `/projects`, `/blog`, `/travels`,
  `/photos` are untouched.
- **No moving blocks between columns.** Up/down among siblings only. The
  three-column band is what makes the page fit one screen; cross-column moves
  are where this class of editor starts fighting the layout.
- **No draft state.** Single user, single site. Save is publish.

## Blocks

| id | where | notes |
|----|-------|-------|
| `hero` | masthead band | contains `portrait` |
| `portrait` | inside hero | hideable independently |
| `about` | column 1 | bio text is data, see below |
| `spec` | column 1 | values are derived, not editable |
| `notebook` | column 2 | only block in its column, so no reorder |
| `schooling` | column 3 | |
| `correspondence` | column 3 | |
| `pictures` | column 3 | |
| `livestrip` | below band | mobile only (`lg:hidden`) |
| `rail` | shared layout | **hiding it applies site-wide**, labelled as such in the menu |

Reorderable groups, named so `order` keys are unambiguous:

- `main` — `about`, `spec`
- `sidebar` — `schooling`, `correspondence`, `pictures`

The notebook column holds one block, so it has no group. `hero`, `portrait`,
`livestrip` and `rail` are fixed in place: hideable, not movable.

## Text: three kinds, three homes

The split matters more than anything else in this design.

**Code literals** — overridden in the new config file, keyed by block:

```
hero.kicker            "About the author"
hero.title             "Andy Zhang"
hero.tagline           "Developer, tinkerer, and builder of things"
hero.badge             "Currently into"
hero.status            "Available for projects"
portrait.caption       "The author"
about.kicker           "About"
spec.kicker            "Specification"
notebook.kicker        "From the notebook"
schooling.kicker       "Schooling"
correspondence.kicker  "Correspondence"
pictures.kicker        "Pictures"
pictures.title         "pics.andypandy.org"
pictures.sub           "Albums, EXIF, map — kept on its own host."
livestrip.kicker       "Live now"
```

The code keeps the default. The file holds only what changed.

**Existing data** — bio paragraphs, school names, post titles, project names.
Clicking these edits routes to the store they already live in
(`content/about.json` via the existing `/api/admin/about`). They are *not*
duplicated into the new file; two sources of truth for the bio would drift.

**Derived** — Specification values (`13 projects, 8 live`), post dates, the
archive count. Not editable. They are computed from real content, so an edit
would be a lie that silently un-lies itself on the next render.

## Data model

One file, `content/front-page.json` in R2:

```json
{
  "hidden": ["spec"],
  "order": {
    "sidebar": ["correspondence", "schooling", "pictures"]
  },
  "copy": {
    "hero.tagline": "Developer and builder of things"
  }
}
```

All three keys optional. An absent file is a valid empty config and yields
exactly what the code says.

## Rendering

New `lib/front-page.ts`, mirroring `lib/about.ts`:

- `getFrontPageConfig()` — `unstable_cache`, tag `front-page`, `revalidate: 60`,
  try/catch returning the empty config on any failure.
- `visibleBlocks(ids, config)` — pure. Filters hidden, applies order, drops
  unknown ids.
- `copyFor(key, codeDefault, config)` — pure. Returns the override or the
  code default.

`app/page.tsx` calls those helpers; nothing else knows the config exists.
A small server component `<Copy k="hero.tagline">default text</Copy>` renders
the resolved string and emits `data-copy="hero.tagline"` for the overlay to
find. Each block wrapper emits `data-block="<id>"`.

## Editor overlay

`components/page-editor.tsx`, a client component mounted only when
`isAdmin()` is true.

A single pill sits bottom-right: `✎ Edit page`. It **replaces** the pencil FAB
the About editor currently renders — otherwise two floating buttons would do
overlapping jobs. The About editor's fields are absorbed into inline editing.

In edit mode:

- Each `[data-block]` gets a dashed accent outline and a `⋮` menu:
  Hide · Move up · Move down.
- Hidden blocks stay visible **to the admin**, ghosted, with a `[Show]` chip.
  That is the undo story: a hidden block never disappears from your own view,
  only from visitors'.
- Each `[data-copy]` gets a dotted underline on hover; click makes it editable
  in place. Enter or blur saves, Escape reverts. Multi-paragraph text keeps
  its breaks.
- The pill's menu carries `Restore defaults`, which clears the file.

Every action saves immediately; a brief `Saved` chip confirms and the page
refreshes so the admin sees what a visitor gets.

**Reveal-effect interaction.** `broadsheet-fx.tsx` sets `[data-reveal]`
elements to `opacity: 0` until they scroll into view. In edit mode that would
mean clicking invisible things, so edit mode disables the reveal and parallax
FX and paints everything at full opacity.

## API

`POST /api/admin/front-page`, guarded by `isAdmin()` like every other admin
route. The body is an *operation*, not the whole config, so a stale client
cannot clobber the file:

```
{ op: "hide",  block: "spec" }
{ op: "show",  block: "spec" }
{ op: "move",  block: "schooling", dir: -1 | 1 }
{ op: "copy",  key: "hero.tagline", value: "…" }
{ op: "reset" }
```

On success: write to R2, `revalidateTag("front-page")`.

Validation, all server-side:

1. **Allowlist.** Block ids and copy keys are checked against constants
   compiled from the code. Unknown key → 400. Without this the file fills with
   garbage from renamed blocks.
2. **Copy values** are plain strings, capped at 500 characters, control
   characters stripped.
3. **Copy renders as a React text node** — never `dangerouslySetInnerHTML`.
   Even if something malicious reached the file it renders as visible text,
   not markup.

## Failure modes

| Condition | Behaviour |
|---|---|
| R2 unreachable | empty config → code defaults. The editor can never 500 the front page. |
| Corrupt JSON | caught → code defaults. |
| Block id renamed in code | ignored on read; pruned on next write. |
| Every block hidden | allowed. The pill lives outside the blocks, so `Restore defaults` stays reachable. |
| Two tabs editing | last write wins. Single-user site; locking is not worth it. |

## Testing

`lib/front-page.test.ts` in the existing vitest setup, against the pure
functions only — no browser harness:

- unknown block ids and copy keys are rejected
- hide then show round-trips to the original order
- `move` clamps at the first and last position
- `copyFor` falls back to the code default when unset
- corrupt/absent config yields defaults

The overlay itself is verified in the browser.

## Files

New: `lib/front-page.ts`, `lib/front-page.test.ts`,
`app/api/admin/front-page/route.ts`, `components/page-editor.tsx`,
`components/copy.tsx`.

Changed: `app/page.tsx` (block labels, config consumption),
`components/rail.tsx` (respect `hidden`), `components/broadsheet-fx.tsx`
(skip FX in edit mode), `components/about-editor.tsx` (drop its FAB).

## Rollout

Everything is admin-gated; visitors see only the resolved page. Ships by push
to `main`, which redeploys `personal-site` → www.andypandy.org.
