# Roofus — project instructions

You are editing **an existing app**. Never scaffold a blank one. Never rebrand it. Never add login or a database.

This file is for any agent (Grok Build, Cursor, Copilot). Porch doctrine is [`DOCTRINE.md`](./DOCTRINE.md). That file wins over Drive, chat history, and summaries. If you also see `AGENTS.md`, that is Grok sandbox chrome (ports, preview, platform plugins) — do not grow Roofus rules there.

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
2. Read `DOCTRINE.md` only when the slice touches porch words. Do not reread the coach prompt “just in case.”
3. Do only the slice they asked. Push back to that repo when it works.
4. Do not paste the old chat. Do not dump the archive playbooks into new files.

GitHub (`PdDesigns-paul/Roofus`) is the book. Live phone URL is Vercel Hobby at **roofus.coach**. Do **not** create a second Vercel project. Do not move the custom domain onto grok.me unless they ask.

## Product (short)

Phone-first PWA. First screen is the porch. Bottom bar: Today · Streets · Inspect. Footer above it: Back · Home · Help · Menu. Home is always there. Back only on Cards, Reference, Presets. Menu: Cards, Reference, Presets. Mindset worksheets live in Presets.

Orange tap fans Live / Roleplay / Mindset — each pick is a new chat. Hold starts Live. Inspect hides the dog so it does not cover the shutter. History is the clock in the chat. New Live lives on the History sheet.

- Streets = **zip** cards grouped by county (not named subdivisions, not one card per block group).
- Door / Live first starter = million-dollar **retail / age** script (Script B). Script A = claim talk after Keep.
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
- `src/lib/rufus-modes.ts`
- `src/lib/porch-faqs.ts`
- `src/lib/page-help.ts`

## How we write code

Comments explain a trap, not the line. One short why is enough (`Zip when we have one — that’s the card now.`). Do not JSDoc `bump()`. Do not narrate `// increment knocks`. Do not comment-out dead code. Do not sweep old files adding comments.

Tests live in `src/lib/*.test.ts` (`node:test`). Pure functions: labels, hail grade, county parse, Notion merge, Inspect-blank. No live xAI, Notion, Census, or NWS. A slice that changes those rules **ships a test in the same change**. Do not add Playwright / browser suites to CI. Phone UI is them tapping roofus.coach.

`npm run test:app` is the product suite. `npm test` also runs Grok platform script tests — CI must not use that.

Do not add login, Postgres, new API keys, Codecov, Husky, or commitlint. Conventional-commit prefixes are optional; a sentence that says what the phone does is better.

## After a slice

Push to `PdDesigns-paul/Roofus` on `main` as **pauldevey91@gmail.com**. Vercel blocks `paul@roofus.coach` and will not launch. GitHub Action + Vercel are the gate. Do not run build, browser-smoke, or a second preview unless this slice moves chrome (tabs, FAB, header/footer, chat sheet) or they say “QA”. If a lib rule changed, run `test:app` only. One working slice per chat is enough.
