# Prep: settings / user-data sub pages

Design only. Do not merge until the feature is built.

Presets is still one long page. Streets is already its own route. Sub pages are chrome: Back, titles, Home deep-links. Split the **UI**, not the store.

## Calls (answered)

1. **Index, not a long page with peels.** `/settings` becomes rows only — same pattern as Home. One slice, not Mindset-first then the rest later. Half-hash / half-route is how people get lost.

2. **You + company stay one page.** Home’s You row is name, company, website, warranty. Coach writes those together. A second “office” page is extra chrome with no new store.

3. **Coach deep-links become paths.** `SETUP_ROWS.hash` turns into a route. `#you` on the old page redirects to `/settings/you`. Help, doctrine, and the coach prompt change in the same slice.

4. **Mindset is its own page.** Worksheets live there. Chat still opens from the orange fan. Not a tab.

5. **Backup is its own page with a door.** Notion + Memory FAQs. Copy on that page: do not Restore onto a full phone; do not Backup from an empty one.

6. **Do not split Zustand keys.** Same persist. Three sources of truth is how the book dies.

## IA

| Route | What |
| --- | --- |
| `/settings` | Index. Rows. Tour + sample day stay here (phone-level, not a field). |
| `/settings/you` | First name, company, website, Read the site, warranty |
| `/settings/territory` | Counties, state. Link to Streets. |
| `/settings/hours` | Knock window, morning work, hard stop |
| `/streets` | Unchanged. Park-once loops. Not nested under Presets. |
| `/settings/mindset` | Why, demon, Pace, stack |
| `/settings/reminders` | The four nags |
| `/settings/backup` | Notion connect / backup / restore. Memory FAQs. |

Home setup bar points at these routes (`You` → `/settings/you`, `Territory` → `/settings/territory`, `Zips` → `/streets`, `Hours` → `/settings/hours`, mindset rows → `/settings/mindset`). Tell Roofus still writes the same fields. Back on every sub page.

`showBack` already returns true for `/settings/*`. `helpPageFor` already maps those to `settings`. Nested help copy can stay one Presets article unless a sub page actually needs its own.

## What is already true

- One Zustand book. Coach writes it from Live and Setup when they clearly set a field.
- Hash jumps (`#you`, `#mindset`) exist today. Replace them; do not leave both.
- Streets rebuilt to park-once loops. Do not pull those cards back into Presets.
- Website + Read the site lives under You.
- Reminders nag on open. Toggles belong with the nag copy, not on Today.

## Build order (when they say start)

1. Route files + index rows. Old `#hash` redirects. `SETUP_ROWS` paths. `app-chrome` test for `/settings/you`.
2. Move sections from `settings.tsx` — no new stores, no new fields.
3. Home setup links + More menu hint. `page-help.ts`, `DOCTRINE.md` product map, `coach-system.ts` Presets paragraph in the **same** change.
4. Backup door copy. Sample day / tour stay on the index.

Do not ship a nested Mindset page while You is still a hash.

## Hard no

- Login / “my profile” as a reason to add auth (auth stays OFF until the backend PR)
- Moving Streets cards into a settings nested list
- A second copy of the fields “for the coach”
- Splitting chrome (tabs, FAB, header/footer) without updating `page-help.ts`, `coach-system.ts`, and `DOCTRINE.md` in the same change
- RAG / RAPTOR as the answer to a long settings page
