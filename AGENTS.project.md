# Roofus — project instructions

You are editing **an existing app**. Never scaffold a blank one. Never rebrand it. Never add login or a database.

This file is for the Build agent. Porch doctrine is [`DOCTRINE.md`](./DOCTRINE.md). That file wins over Drive, chat history, and summaries.

## One source of truth

| Live | Dead |
| --- | --- |
| This repo (`DOCTRINE.md`, this file, `README.md`, the code) | Google Drive “Alpha Exteriors” / Sept 2026 zip |
| Presets + Today on **their** phone | Anything you assume about Paul, Alpha, West Shore, or a 3:30 start |
| Storms they **Keep** in the app | `STORM_LOG.md` from the archive |

The Drive folder is a research archive. Do not copy Alpha phones, PAHIC numbers, Paul/Ari territory, named subdivisions, or live storm rows into the app. Generic canvasser. Name / company / counties / hours come from Presets.

If `DOCTRINE.md` and a button disagree, fix both in the same change.

## Resume (fresh Build chat)

1. This workspace may already have the app. If it looks like a blank template, **pull** [PdDesigns-paul/Roofus](https://github.com/PdDesigns-paul/Roofus) before you write code.
2. Read `DOCTRINE.md` + `README.md` + `src/lib/coach-system.ts`. Confirm the prompt still matches the buttons.
3. Do only the slice they asked. Push back to that repo when it works.
4. Do not paste the old chat. Do not dump the archive playbooks into new files.

Publish from this Grok chat. Do **not** create or deploy a Vercel project unless they ask. GitHub (`PdDesigns-paul/Roofus`) is the book.

## Product (short)

Phone-first PWA. First screen is the porch. Bottom bar: Today · Streets · Inspect. More: Mindset, Reference, Presets. Orange button = Roofus the coach.

- Streets = **zip** cards grouped by county (not named subdivisions, not one card per block group).
- Door hat first starter = million-dollar **retail / age** script (Script B). Script A = claim talk after Keep.
- Auth OFF. Database OFF. localStorage / Zustand only. Notion is optional backup in **their** workspace.
- No CRM, takeoff, listing lookup, notes app, or apartment flow.

## Hard no

- Fake storm, fake neighbor, “working next door” unless true today
- Invented years, prices, squares, hail, license, phone
- Recording a homeowner
- High-pressure one-call close as the default
- “This phone is the book” jargon in UI copy — say After Action Report, Today, Presets
- Changing doctrine in the coach prompt without changing `DOCTRINE.md` (and the other way around)

## Keep in sync when you touch porch words

- `DOCTRINE.md`
- `src/lib/coach-system.ts`
- `src/lib/rufus-hats.ts`
- `src/lib/porch-faqs.ts`
- `src/lib/page-help.ts`

## After a slice

Commit in this repo and push to `PdDesigns-paul/Roofus` on `main`. One working slice per chat is enough.
