# Signifiers — phone chrome book

**This file is the UI contract.** Porch words stay in [`DOCTRINE.md`](./DOCTRINE.md). How a canvasser *sees* what to tap lives here.

Home, Today, and chrome now match this book: one setup card, five control types, Help/Menu in the header, one tab bar, company in the day-book. Streets Near me / scout tags and Use today as a chip shipped. **Places on the phone are Today · Door · Roof · Plan.** Old route files may keep `/truck` and `/after`. UI copy does not say Truck or After. First-run is five job slides over the field log (who I am, pin, the door, the dog, age first) — no tab names on slide 1. Door pocket cards fill You and ship Hear this line. Settings index is chevron Go rows; tour and sample day are outlined pills under the list. Do not invent a sixth control type.

Agents: read this before you touch tabs, the FAB, Today links, setup rows, or `src/components/ui/`.

---

## Diagnosis (why the phone feels blah)

The facets work. The voice works. The actions already exist. What is missing is the **signifier** — the clue that says *this thing can be used, here, like this.*

On a screen every pixel already affords a tap. Fill, edge, size, underline, and the dog are how we advertise the tap. Right now almost every control is drawn with the same pencil: `text-sm`, `text-muted`, `text-faint`, 1px `border-border`, underline only on hover. Hover never fires on a thumb.

False signifiers that this plan already killed:

- `Ask`, `Did it`, `Pocket cards` as 12px muted captions (Home / Today).
- Setup rows that were links *and* carried a second ghost Ask.
- Home listing Today / Inspect / Streets under the fold.
- Help and Menu in a second bottom rail.
- Selected tab as “stroke 2.2 vs 1.8.”
- Settings rows that read as captions, with tour and sample day dressed as the first tap.

Score of the idea: fine. Score of “what do I tap”: the actual bug.

---

## Vocabulary — five types, no sixth

One shape, one promise. If you cannot name the type, the user cannot either.

| Type | Shape | Promise | Use for | Do not use for |
| --- | --- | --- | --- | --- |
| **Place** | Bottom tab. Selected = accent mark + `text-fg`. Idle = `text-faint`. | I am *in* a place. | Today · Door · Roof · Plan | Help, Back, Menu |
| **Do** | Pill, 48–56px. Primary = filled (`bg-fg text-paper`, or `bg-accent` when the verb is talk to Roofus). Secondary = outlined on a solid surface, same height. | One tap, something happens *here*. | Ask how today went, Pin, +, Got it, Tell Roofus, −, Load sample, Not now | Navigation a tab or Menu already owns |
| **Toggle a token** | Chip. Idle = outline + `text-fg`. Selected / done = `bg-accent` + black type. | A token I can snap on or dismiss. | Did it, Use today, loop on the plan, Live / Roleplay / Mindset fan | The screen’s primary close |
| **Go** | Always-underlined text, **or** a 56px row with title + hint + chevron. | I will *leave this screen*. | Plan, maps label, Settings (bottom of Plan), setup rows that open a page | Anything that writes today’s log |
| **Talk** | Gold FAB, 64–80px circle. Dog face (`RoofusFace`) fills it — FAB face ≥ 56px, tour face ≥ 160px. Not `size-10`. Not a generic chat bubble. Tap fans three chips. Hold starts Live. Hidden on Roof and while the sheet is open. | The coach. | Live / Roleplay / Mindset | A second FAB |

Buttons **do**. Links **go**. Chips **fork the current task**. Tabs **are places**. The FAB **is Roofus**.

Ban ghost text as an action in content. Text-only controls belong in a header toolbar after the tour has named them — not in a paragraph.

---

## Map — one door per room

Destinations live in four places. Pick this rule and stop adding a fifth.

- **Day work** = tabs (Today, Door, Roof, Plan).
- **Kit** = Menu (Reference, Settings).
- **Coach** = orange FAB only.
- **Help and Back** = header. Back only on Settings, Reference, nested settings pages. Not a second bottom rail.

If a screen needs a fourth way in, the first three already failed.

Do not list Door or Plan again as Menu rows. Settings is the book. Plan is the loops tab.

---

## How to exaggerate (on purpose)

- One filled control above the fold. A second filled pill at the same size means zero primaries.
- Selected state changes **category**, not degree. Outline → fill. Faint → accent mark. Not 1.8 vs 2.2 stroke.
- Fill beats stroke in sun and in dark mode. 1px `#2c2a26` dies in a driveway.
- Tap target is the *visible* body, 48–56px. Padding around 12px “Ask” does not count — the eye reads the glyph.
- Count tiles: the tile is the control. Tap the body to +1. Tiny − in the corner. Number in Fraunces, large.
- Group by container. Connected track = pick one. Separate chips = pick many.
- Motion only when it explains a relationship (FAB → three modes). No bounce on every pill.
- Hold-to-talk must look like a hold plate at rest, not a text field that also records.
- Empty circle, empty weather box, “Pick a zip on Streets” — absence is a clue. Do not also whisper a second muted sentence.

Do not make everything orange. Then you are back to blah, just warmer.

---

## Tests (no Playwright suite — look at the phone)

1. **Squint.** Blur the screenshot. Whatever still has a body is a control. If Ask / Did it / Pocket cards vanish and only the FAB and a white + remain, those strings were never signified.
2. **Grayscale.** The primary action must still be the darkest or largest object.
3. **Thumb + sun.** Bottom third of the screen, bright light. Stroke-only controls fail this. That is the real environment.

`npm run test:app` does not catch this. The live phone does.

---

## Implementation plan

Do these in order. One working slice per chat. Push to `main` when that slice is on the phone. Update `src/lib/page-help.ts` and `src/lib/coach-system.ts` in the **same** slice that changes a button that help or the coach names.

### Slice 1 — the kit — shipped

Chip next to Button. `default` / `outline` only. Ghost is not a content verb. Go links on Home / Today always underline.

### Slice 2 — chrome — shipped

Help (`?`) and Menu (`⋮`) in the header. One bottom bar: **Today · Door · Roof · Plan**. Today’s mark is a pickup. Pull down from the top of a page to refresh weather and geocode — not a full document reload. FAB uses `RoofusFace`. Hidden on Roof. Back is a header control on nested pages (Settings, Reference) — not on the four Places.

### Slice 3 — Home — shipped

One setup card. Empty book: name + company + counties/state. Website / Why behind More. Expanded rows are Go (chevron). Tell Roofus is the Do. No directory list. Tour does not auto-play.

### Slice 4 — Today — shipped

Count tiles: tap the card to +1. − is a small control. Pin status on a house writes the matching Today count once. Tiles still work without a pin. Two logs of the same talk is a bug. Cards and maps labels are underlined Go. Empty-book setup card on Today until name + company + one county exist. Night opens Finish the day on Plan. Today is this page (route `/truck`). **Pin** drops GPS and opens the house editor on that page (address, year, status, note, roof look). The map and the long board stay on Plan.

### Slice 5 — Streets hunt + Near me — shipped

- **Near me** is a chip. Sorts walks they already have. Empty book does not invent a zip.
- **Use today** is a chip on the card — not muted text.
- Maps label is an always-underlined Go. No `hover:underline`.
- Rebuild / Census hunt is dead. Plan is the map of pins they dropped.
- Help copy and coach prompt name Near me and Pins first.

### Slice 6 — Settings / Door sweep — shipped

- Door “Ask Roofus” stays an outlined pill. Hear this line is a second outlined Do on the filled SAY. Not a second FAB.
- Door fills [name]/[company] from You, [year] as the age-band window, [day] as tomorrow’s weekday. Empty You is a Go. Context strip: You · street or Working loop · roofs · Keep / Use-today. Claim path names the kept zip or stays hidden.
- Settings index: rows get chevrons. Plan is a tab, not a Settings row. “Show the tour” and “Load a sample day” stay secondary outlined pills, below the list, not dressed as the page’s primary.
- Help copy and coach prompt name the controls that actually exist after the sweep.

### Slice 7 — Plan — shipped

Tab word is **Plan**. Route stays `/after`. Hint: night-before + morning. Not a fifth Place. Keep / Toss lives on Plan. One Working loop is picked on Plan (Use today). Today is that loop line + counts + Pin (GPS drop opens the house editor on Today) + one kept sentence. Night opens Finish the day on Plan. Empty-book Setup leaves Today after name + company + one county.

### Slice 8 — first-run tour — shipped

Five job slides over the field log: who I am, drop a pin, what to say at the door, talk to the dog, age first. Do not list tab names on slide 1. Skip on every slide. Plays once when `roofus-onboard-v1` is missing. Replay is **Show the tour** in Settings. Last slide may offer Load a sample day on an empty book — lands on `/truck`, no sample storm. Replaces the 3-dot spotlight. Not a `/tour` route. Not the PWA install tutorial.

Out of scope for this plan: new facets, login, a design-token package, Playwright, restyling every page a different way.

---

## What not to do

- Do not add a 19-variant button system.
- Do not restyle pages before Slice 1 ships the kit.
- Do not hide setup behind a longer tour. The tour exists because the page is not self-explaining. Fix the page.
- Do not grow these rules in `AGENTS.md`. That file is Grok sandbox chrome. Project rules live here and in `AGENTS.project.md`.
- Do not change porch scripts, Script A/B, or mindset worksheets in a chrome slice.

---

## Keep in sync

When a slice ships a control the coach or Help names:

- this file
- `DOCTRINE.md` product map
- `AGENTS.project.md`
- `src/lib/page-help.ts`
- `src/lib/coach-system.ts`

README points here. It does not repeat the kit.
