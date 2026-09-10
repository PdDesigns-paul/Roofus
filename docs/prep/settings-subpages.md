# Prep: settings / user-data sub pages

Design only. Do not merge until the feature is built. Do not implement in a QoL chat.

## Why this exists

Presets is one long page: You, Counties, Zips, Hours, website, warranty, Reminders, Mindset worksheets, Notion, Memory FAQs, tour replay. Hash jumps (`#you`, `#mindset`) already exist. Home setup rows and reminders deep-link into those hashes.

They asked to separate settings / user data better — make sub pages. QoL already let Roofus **write** those fields (he is "self-aware"). Sub pages are chrome: Back, titles, coach deep-links. That is why it waits.

RAG / RAPTOR is not the answer to a long settings page. The fields still fit in the coach prompt. Split the **UI**, not the store.

## What is already true

- One Zustand book. Coach writes it from Live and Setup when they clearly set a field.
- Back shows on Cards, Reference, Presets, and Streets. Nested routes will need Back too (`showBack` in chrome).
- Streets is already its own route (`/streets`). Do not pull zip cards back into Presets.
- Website + Read the site lives under You.

## Open questions (answer these before code)

1. **Index vs stack.** Is `/settings` a menu of rows, or do we keep the long page and peel the heavy ones (Mindset, Backup) first?
2. **You vs company.** Name is the canvasser. Company name, website, warranty are the office. One page or two?
3. **Coach deep-links.** Setup rows and "go to Presets" must land on the sub page, not a hash that no longer exists. Help copy and `DOCTRINE.md` product map change in the same slice.
4. **Mindset.** Worksheets are long. They already feel like a page. Chat still opens from the orange fan, not from a new tab.
5. **Backup.** Notion + Memory FAQs are optional and dangerous (Restore onto a full phone). They deserve a door that says so.
6. **Do not split stores.** Sub pages are routes over the same persist keys. Three sources of truth is how the book dies.

## Suggested IA (not this PR)

| Route | What |
| --- | --- |
| `/settings` | Index. Rows only. No 400px of forms. |
| `/settings/you` | First name, company, website, Read the site, warranty |
| `/settings/territory` | Counties, state. Link to Streets. |
| `/settings/hours` | Knock window, morning work, hard stop |
| `/streets` | Unchanged. Town · zip cards. |
| `/settings/mindset` | Why, demon, Pace, stack |
| `/settings/reminders` | The four nags |
| `/settings/backup` | Notion connect / backup / restore. Memory FAQs. |

Home setup bar points at these routes. `Tell Roofus` still writes the same fields. Back on every sub page.

## Hard no

- Login / "my profile" as a reason to add auth (auth stays OFF until the backend PR)
- Moving Streets cards into a settings nested list
- A second copy of the fields "for the coach"
- Splitting chrome (tabs, FAB, header/footer) without updating `page-help.ts`, `coach-system.ts`, and `DOCTRINE.md` in the same change
