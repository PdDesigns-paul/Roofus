# Roofus — project instructions

You are editing **an existing app**. Never scaffold a blank one.

**Kernel** (do not swap per shop): four Places, five types, offline phone book, Talk FAB. **Tenant pack** may change brand, porch words, Script B, Keep, i35, inspect rows, and activity units. Roofus is pack `roofus` — first tenant, not the only one. An **owner key** may live on You as a chip. Account is a key, not a Place.

Still forbidden: `/login` as a Place, Stripe / pricing sheets, a sixth control type.

This file is for any agent (Grok Build, Cursor, Copilot). Porch doctrine is [`DOCTRINE.md`](./DOCTRINE.md). Phone chrome and tap-clues are [`SIGNIFIERS.md`](./SIGNIFIERS.md). Those files win over Drive, chat history, and summaries. If you also see `AGENTS.md`, that is Grok sandbox chrome (ports, preview, platform plugins) — do not grow Roofus rules there.

## One source of truth

| Live | Dead |
| --- | --- |
| This repo (`DOCTRINE.md`, `SIGNIFIERS.md`, this file, `README.md`, the code) | Google Drive “Alpha Exteriors” / Sept 2026 zip |
| Settings + Today on **their** phone | Anything you assume about Paul, Alpha, West Shore, or a 3:30 start |
| Storms they **Keep** in the app | `STORM_LOG.md` from the archive |

The Drive folder is a research archive. Do not copy Alpha phones, PAHIC numbers, Paul/Ari territory, named subdivisions, or live storm rows into the app. Generic canvasser. Name / company / counties / hours come from Settings. A second shop’s words come from its **tenant pack**, not from forking this file.

If `DOCTRINE.md` and a button disagree, fix both in the same change.
If `SIGNIFIERS.md` and a control disagree after a chrome slice, fix both in the same change.

## Resume (fresh Build chat)

1. This workspace may already have the app. If it looks like a blank template, **pull** [PdDesigns-paul/Roofus](https://github.com/PdDesigns-paul/Roofus) before you write code.
2. Read `DOCTRINE.md` only when the slice touches porch words. Read `SIGNIFIERS.md` when the slice touches tabs, the FAB, Today actions, setup rows, or `src/components/ui/`. Do not reread the coach prompt “just in case.”
3. Do only the slice they asked. Push back to that repo when it works.
4. Do not paste the old chat. Do not dump the archive playbooks into new files.

GitHub (`PdDesigns-paul/Roofus`) is the book. Live phone URL is Vercel Hobby at **roofus.coach**. Do **not** create a second Vercel project. Do not move the custom domain onto grok.me unless they ask. Pack resolution: `VITE_TENANT_ID` → host allowlist → `roofus`. Proof tenant is pack `demo` (`VITE_TENANT_ID=demo`). CI tests pack `roofus` only.

## Product (short)

Phone-first PWA. First screen is Today (file `truck.tsx` until a rename-the-file slice). Start / End clock the shift on Today; Pause is a chip; Hours shows this week's numbers to the canvasser — do not hide the ledger from the person who worked it. A picture of the week sits under the numbers. First open is five job slides over the field log: who I am, drop a pin, what to say at the door, talk to the dog, age first. Do not list tab names on slide 1. Skip on every slide; replay in Settings. Bottom bar: Today · Door · Roof · Plan. Help and Menu live in the header; one tab bar; Back only on Settings, Reference, and nested settings pages. Do not invent a third layout. Roofus labels below are pack `roofus`. Kernel Places stay four.

Settings holds the book (You, territory, hours, mindset, reminders, backup). Empty book: setup card on Today (name, company, counties). Reminders nag on open: morning storm, Sundays pace, the 1st stack — only if that box is empty. Evening journal nag only after they logged a door, a pin, or a finished setup. Blank first hour after 5pm is Setup, not AAR. Finish-setup is Settings, not a nag. No lock-screen. Owner chip, when it ships, lives on You — not a fifth tab.

Orange tap fans Live / Roleplay / Mindset — each pick is a new chat. Hold starts Live. Roof hides the dog so it does not cover the shutter. History is the clock in the chat. New Live lives on the History sheet. Roleplay Knock / mic / Score me lock like Claim when `practiceOn` is false — “Practice is on the plan.” Beat chips stay visible. No model picker.

- Plan = a **map of pins**. Walks form from distance (0.4 km, cap 40). Not named subdivisions, not Census cards, not one card per zip. Open from the Plan tab (route `/after`). Night-before + morning. Last 48 hours Keep / Toss lives here. After Action Report and tomorrow live on Plan. Night on Today opens Finish the day on Plan. Morning chip lists set + revisit pins. Settings is a Go at the bottom of Plan, not a fifth tab.
- Door = pocket cards with a one-line formula (hook → honest reason → one open question). Cards fill name and company from You. Compass stays visible — read it in the truck. Claim path shows after Keep, matching zip.
- Door / Live first starter = million-dollar **retail / age** script (Script B). Script A = claim talk after Keep.
- Phone book stays **local-first** (`localStorage` / Zustand). Cloud is a copy. Notion is an optional office connector behind Use Notion — not the only lifeboat. Save a file is the offline copy. Do not mount `/login` as a Place. Owner chip lives on You — **This phone** when signed out. Last copy is a line on You.

- Pins are the hunt. Drop from Today (GPS) — that opens the house editor on Today (address, year, status, note, roof look) — or the Plan map (Desk). Pin status writes the matching Today count once. Tiles still work without a pin. Ticks hang on the open pin. Reset clears that house. Coach may quote the open pin’s year, status, note, and look. No pin, no “this house.” Distance makes the loop. Sidewalk house log, not a CRM, not a pipeline. No takeoff, no scrape. Street View / Zillow / Redfin are outbound links.

The product path is this phone’s journal. Do not wire `better-auth`, `src/lib/db.ts`, or `src/lib/auth/*` into Place routes until a named child in [`PLATFORM.md`](./PLATFORM.md) turns accounts on. `AuthProvider` in the root is a passthrough. `ownerFromSession` refuses the disabled-auth `DEV_USER`. `npm run build` is Vite only — never chain `db:migrate`. What stayed for the host, and when it may light up: [`PLATFORM.md`](./PLATFORM.md).


## Signifiers (short)

Full book: [`SIGNIFIERS.md`](./SIGNIFIERS.md). Five types. No sixth. Brand tokens may load from a tenant pack. Types may not.

| Type | Promise |
| --- | --- |
| **Place** | Tab. I am in a place. Today · Door · Roof · Plan. |
| **Do** | Pill, 48–56px. Something happens here. One filled primary per screen. |
| **Toggle a token** | Chip. Outline off, accent fill on. |
| **Go** | Underlined text, or a row with a chevron. Leaves this screen. |
| **Talk** | Orange FAB. Dog face. Fan for mode. Hold starts Live. |

RoofusFace is not size-10.

Buttons do. Links go. Chips fork the current task. Ban ghost text (`Ask`, `Did it`, `Pocket cards` as 12px muted captions) in content. Always underline Go links — `hover:underline` is a desktop lie.

Do not add a design-token package or 19 button variants. Do not make everything orange. Do not restyle a page before the kit in Slice 1 exists. A brand pack (WL-2) may swap tokens; it may not invent a sixth type.

Squint test: blur the screenshot. If the action disappears, it was never signified.

## Hard no

- Fake storm, fake neighbor, “working next door” unless true today
- Invented years, prices, squares, hail, license, phone
- Recording a homeowner
- High-pressure one-call close as the default
- “This phone is the book” jargon in UI copy — say After Action Report, Today, Settings
- Changing doctrine in the coach prompt without changing `DOCTRINE.md` (and the other way around)
- A new control type that is not Place / Do / Chip / Go / Talk
- `/login` as a Place. Stripe sheets. UserButton + pricing grid chrome.
- Growing Roofus chrome rules in `AGENTS.md`

## Keep in sync when you touch porch words

- `DOCTRINE.md`
- `src/lib/coach-prompt.ts`
- pack modules (tenant curriculum / coach briefs — when they exist)
- `src/lib/coach-modes.ts`
- `src/lib/porch-faqs.ts`
- `src/lib/page-help.ts`

The long coach prompt is kernel honesty in `src/lib/coach-prompt.ts` plus pack modules in `src/lib/tenant/roofus/`. Edit those, not `coach-system.ts`. Roofus porch words are pack `roofus`.

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

Do not add `/login` as a Place, Stripe sheets, Postgres as the live book, Codecov, Husky, or commitlint. A tenant pack and an owner key are in scope when a child issue says so. Do not add new API keys except the Maps key already provided (`GOOGLE_MAPS_API_KEY`, never in git, never `VITE_`). Conventional-commit prefixes are optional; a sentence that says what the phone does is better.

Coach context is today’s log + streets + weather + mindset + Memory FAQs + MRI titles + company site notes + packet files they saved (title, notes, extracted text only). Tools read the posted book only (loop, kept storms, FAQs, one named MRI card, survive snap). No web. No RAG / RAPTOR until a real backend (Prep to Launch). If a field is on the phone, Roofus may write it when they clearly set it.

## After a slice

Push to `PdDesigns-paul/Roofus` on `main` as **pauldevey91@gmail.com**. Vercel blocks `paul@roofus.coach` and will not launch. GitHub Action + Vercel are the gate. Do not run build, browser-smoke, or a second preview unless this slice moves chrome (tabs, FAB, header/footer, chat sheet) or they say “QA”. If a lib rule changed, run `test:app` only. One working slice per chat is enough.
