# Signifiers — phone chrome book

**This file is the UI contract.** Porch words stay in [`DOCTRINE.md`](./DOCTRINE.md). How a canvasser *sees* what to tap lives here.

Home, Today, and chrome now match this book: one setup card, five control types, Help/Menu in the header, one tab bar, company in the day-book. Streets Near me / scout tags and Use today as a chip shipped. **Places are Truck · Door · Roof · Prep.** After became Prep. Truck is the field log. Settings / Door row restyle is still open. Do not invent a sixth control type.

Agents: read this before you touch tabs, the FAB, Truck links, setup rows, or `src/components/ui/`.

---

## Diagnosis (why the phone feels blah)

The facets work. The voice works. The actions already exist. What is missing is the **signifier** — the clue that says *this thing can be used, here, like this.*

On a screen every pixel already affords a tap. Fill, edge, size, underline, and the dog are how we advertise the tap. Right now almost every control is drawn with the same pencil: `text-sm`, `text-muted`, `text-faint`, 1px `border-border`, underline only on hover. Hover never fires on a thumb.

False signifiers that this plan already killed on Home / Today / chrome:

- `Ask`, `Did it`, `Pocket cards` as 12px muted captions (Home / Today).
- Setup rows that were links *and* carried a second ghost Ask.
- Home listing Today / Inspect / Streets under the fold.
- Help and Menu in a second bottom rail.
- Selected tab as “stroke 2.2 vs 1.8.”

Still on Settings / Door until that sweep:

- Settings rows that still read as captions.
- Accent used as a sticker on pages this slice did not touch.

Score of the idea: fine. Score of “what do I tap”: the actual bug.

---

## Vocabulary — five types, no sixth

One shape, one promise. If you cannot name the type, the user cannot either.

| Type | Shape | Promise | Use for | Do not use for |
| --- | --- | --- | --- | --- |
| **Place** | Bottom tab. Selected = accent mark + `text-fg`. Idle = `text-faint`. | I am *in* a place. | Truck · Door · Roof · Prep | Help, Back, Menu |
| **Do** | Pill, 48–56px. Primary = filled (`bg-fg text-paper`, or `bg-accent` when the verb is talk to Roofus). Secondary = outlined on a solid surface, same height. | One tap, something happens *here*. | Ask how today went, Pin, +, Got it, Tell Roofus, −, Load sample, Not now | Navigation a tab or Menu already owns |
| **Toggle a token** | Chip. Idle = outline + `text-fg`. Selected / done = `bg-accent` + black type. | A token I can snap on or dismiss. | Did it, Use today, loop on the plan, Live / Roleplay / Mindset fan | The screen’s primary close |
| **Go** | Always-underlined text, **or** a 56px row with title + hint + chevron. | I will *leave this screen*. | Prep, maps label, Settings (bottom of Prep), setup rows that open a page | Anything that writes today’s log |
| **Talk** | Gold FAB. Dog face (`RoofusFace`), not a generic chat bubble. Tap fans three chips. Hold starts Live. Hidden on Roof and while the sheet is open. | The coach. | Live / Roleplay / Mindset | A second FAB |

Buttons **do**. Links **go**. Chips **fork the current task**. Tabs **are places**. The FAB **is Roofus**.

Ban ghost text as an action in content. Text-only controls belong in a header toolbar after the tour has named them — not in a paragraph.

---

## Map — one door per room

Destinations live in four places. Pick this rule and stop adding a fifth.

- **Day work** = tabs (Truck, Door, Roof, Prep).
- **Kit** = Menu (Reference, Settings).
- **Coach** = orange FAB only.
- **Help and Back** = header. Back only on Settings, Reference, nested settings pages. Not a second bottom rail.

If a screen needs a fourth way in, the first three already failed.

Do not list Door or Prep again as Menu rows. Settings is the book. Prep is the loops tab.

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

Help (`?`) and Menu (`⋮`) in the header. One bottom bar: **Truck · Door · Roof · Prep**. FAB uses `RoofusFace`. Hidden on Roof. Back is a header control on nested pages (Settings, Reference) — not on the four Places.

### Slice 3 — Home — shipped

One setup card. Empty book: name + company + counties/state. Website / Why behind More. Expanded rows are Go (chevron). Tell Roofus is the Do. No directory list. Tour does not auto-play.

### Slice 4 — Today — shipped

Count tiles: tap the card to +1. − is a small control. Cards and maps labels are underlined Go. Empty-book setup card on Truck until name + company + one county exist. Night is a Go to Prep#finish. Truck is this page (formerly /today).

### Slice 5 — Streets hunt + Near me — shipped

- Streets card shows muted ageBand / stormBand / why when a scout card exists. Not a CRM row. Not porch copy.
- **Near me** is a chip. Sorts loops they already built. Empty book does not invent a zip. County folders stay when the chip is off.
- **Use today** is a chip on the card — not muted text.
- Maps label is an always-underlined Go. No `hover:underline`.
- Help copy and coach prompt name Near me and the hunt footnote.

### Slice 6 — Settings / Door sweep — open

- Door “Ask Roofus” is already an outlined pill — keep it. Do not demote it to text.
- Settings index: rows get chevrons. “Show the question-mark tour” and “Load a sample day” stay secondary outlined pills, below the list, not dressed as the page’s primary.
- Help copy and coach prompt name the controls that actually exist after the sweep.

### Slice 7 — Prep — shipped

Tab word is **Prep**. Route stays `/after`. Hint: night-before + morning. Not a fifth Place. Keep / Toss lives on Prep. One Working loop is picked on Prep (Use today). Truck is that loop line + counts + Pin + one kept sentence. Night is a Go to Prep#finish. Empty-book Setup leaves Truck after name + company + one county.

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
