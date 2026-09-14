# Roofus — project instructions

You are editing **an existing app**. Never scaffold a blank one. Never rebrand it. Never add login or a database.

This file is for any agent (Grok Build, Cursor, Copilot). Porch doctrine is [`DOCTRINE.md`](./DOCTRINE.md). Phone chrome and tap-clues are [`SIGNIFIERS.md`](./SIGNIFIERS.md). Those files win over Drive, chat history, and summaries. If you also see `AGENTS.md`, that is Grok sandbox chrome (ports, preview, platform plugins) — do not grow Roofus rules there.

## One source of truth

| Live | Dead |
| --- | --- |
| This repo (`DOCTRINE.md`, `SIGNIFIERS.md`, this file, `README.md`, the code) | Google Drive “Alpha Exteriors” / Sept 2026 zip |
| Settings + Truck on **their** phone | Anything you assume about Paul, Alpha, West Shore, or a 3:30 start |
| Storms they **Keep** in the app | `STORM_LOG.md` from the archive |

The Drive folder is a research archive. Do not copy Alpha phones, PAHIC numbers, Paul/Ari territory, named subdivisions, or live storm rows into the app. Generic canvasser. Name / company / counties / hours come from Settings.

If `DOCTRINE.md` and a button disagree, fix both in the same change.
If `SIGNIFIERS.md` and a control disagree after a chrome slice, fix both in the same change.

## Resume (fresh Build chat)

1. This workspace may already have the app. If it looks like a blank template, **pull** [PdDesigns-paul/Roofus](https://github.com/PdDesigns-paul/Roofus) before you write code.
2. Read `DOCTRINE.md` only when the slice touches porch words. Read `SIGNIFIERS.md` when the slice touches tabs, the FAB, Truck actions, setup rows, or `src/components/ui/`. Do not reread the coach prompt “just in case.”
3. Do only the slice they asked. Push back to that repo when it works.
4. Do not paste the old chat. Do not dump the archive playbooks into new files.

GitHub (`PdDesigns-paul/Roofus`) is the book. Live phone URL is Vercel Hobby at **roofus.coach**. Do **not** create a second Vercel project. Do not move the custom domain onto grok.me unless they ask.

## Product (short)

Phone-first PWA. First screen is Truck. Bottom bar: Truck · Door · Roof · After. Help and Menu live in the header; one tab bar; Back only on Settings, Reference, and nested settings pages. Do not invent a third layout.

Settings holds the book (You, territory, hours, mindset, reminders, backup). Empty book: setup card on Truck (name, company, counties). Reminders nag on open: morning storm, evening journal, Sundays pace, the 1st stack — only if that box is empty. Finish-setup is Settings, not a nag. No lock-screen.

Orange tap fans Live / Roleplay / Mindset — each pick is a new chat. Hold starts Live. Roof hides the dog so it does not cover the shutter. History is the clock in the chat. New Live lives on the History sheet.

- After = **park-once loops** grouped by county then township (not named subdivisions, not one card per zip, not one card per block group). Headline is cluster · zip. Township is the folder. Open from the After tab. Night: finish After Action Report (same store as Truck) and pick tomorrow. Settings is a Go at the bottom of After, not a fifth tab. Process-day chips (week-1): Left on time · Working loop set · AAR written · Tomorrow picked. Look / Set are bonus. Not appointments. Not Script B.
- Door = five pocket cards with a one-line formula (hook → honest reason → one open question). Compass stays visible — read it in the truck.
- Door / Live first starter = million-dollar **retail / age** script (Script B). Script A = claim talk after Keep.
- Auth OFF. Database OFF. localStorage / Zustand only. Notion is optional backup in **their** workspace.
- No CRM, takeoff, listing lookup, notes app, or apartment flow.

The product path is this phone’s journal. Do not wire `better-auth`, `src/lib/db.ts`, or `src/lib/auth/*` into routes; `AuthProvider` in the root is a Grok-host passthrough. `npm run build` is Vite only — never chain `db:migrate`. What stayed for the host, and why: [`PLATFORM.md`](./PLATFORM.md).

## Signifiers (short)

Full book: [`SIGNIFIERS.md`](./SIGNIFIERS.md). Five types. No sixth.

| Type | Promise |
| --- | --- |
| **Place** | Tab. I am in a place. Truck · Door · Roof · After. |
| **Do** | Pill, 48–56px. Something happens here. One filled primary per screen. |
| **Toggle a token** | Chip. Outline off, accent fill on. |
| **Go** | Underlined text, or a row with a chevron. Leaves this screen. |
| **Talk** | Orange FAB. Dog face. Fan for mode. Hold starts Live. |

Buttons do. Links go. Chips fork the current task. Ban ghost text (`Ask`, `Did it`, `Pocket cards` as 12px muted captions) in content. Always underline Go links — `hover:underline` is a desktop lie.

Do not add a design-token package or 19 button variants. Do not make everything orange. Do not restyle a page before the kit in Slice 1 exists.

Squint test: blur the screenshot. If the action disappears, it was never signified.

## Hard no

- Fake storm, fake neighbor, “working next door” unless true today
- Invented years, prices, squares, hail, license, phone
- Recording a homeowner
- High-pressure one-call close as the default
- “This phone is the book” jargon in UI copy — say After Action Report, Truck, Settings
- Changing doctrine in the coach prompt without changing `DOCTRINE.md` (and the other way around)
- A new control type that is not Place / Do / Chip / Go / Talk
- Growing Roofus chrome rules in `AGENTS.md`

## Keep in sync when you touch porch words

- `DOCTRINE.md`
- `src/lib/coach-prompt.ts`
- `src/lib/coach-modes.ts`
- `src/lib/porch-faqs.ts`
- `src/lib/page-help.ts`

The long coach prompt lives in `src/lib/coach-prompt.ts` — edit there, not `coach-system.ts`.

## Keep in sync when you touch chrome or tap-clues

- `SIGNIFIERS.md`
- `DOCTRINE.md` product map
- this file
- `src/lib/page-help.ts`
- `src/lib/coach-prompt.ts` (only if the coach names a button that moved)

Follow the slice order in `SIGNIFIERS.md`. One slice per chat. Do not implement the whole plan because you read the file.

## How we write code

Comments explain a trap, not the line. One short why is enough (`Zip when we have one — that’s the card now.`). Do not JSDoc `bump()`. Do not narrate `// increment knocks`. Do not comment-out dead code. Do not sweep old files adding comments.

Tests live in `src/lib/*.test.ts` (`node:test`). Pure functions: labels, hail grade, county parse, Notion merge, Roof-walk blank. No live xAI, Notion, Census, or NWS. A slice that changes those rules **ships a test in the same change**. Do not add Playwright / browser suites to CI. Phone UI is them tapping roofus.coach.

`npm run test:app` is the product suite. `npm test` also runs Grok platform script tests — CI must not use that.

Do not add login, Postgres, new API keys, Codecov, Husky, or commitlint. Conventional-commit prefixes are optional; a sentence that says what the phone does is better.

Coach context is today’s log + streets + weather + mindset + Memory FAQs + MRI titles + company site notes. Do not add RAG / RAPTOR until a real backend (Prep to Launch). If a field is on the phone, Roofus may write it when they clearly set it.

## After a slice

Push to `PdDesigns-paul/Roofus` on `main` as **pauldevey91@gmail.com**. Vercel blocks `paul@roofus.coach` and will not launch. GitHub Action + Vercel are the gate. Do not run build, browser-smoke, or a second preview unless this slice moves chrome (tabs, FAB, header/footer, chat sheet) or they say “QA”. If a lib rule changed, run `test:app` only. One working slice per chat is enough.
