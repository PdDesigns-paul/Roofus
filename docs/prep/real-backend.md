# Prep: real backend

Design only. Do not merge until the feature is built. Do not implement in a QoL chat.

## Why this exists

The phone is the live log. Zustand + localStorage. Notion is an optional copy in **their** workspace. A dead phone is a dead year unless they backed up.

Coach context today is today's log + streets + weather + mindset + Memory FAQs + MRI **titles**. That still fits in one prompt. RAG / RAPTOR was explicitly deferred until this work. Do not add a vector store to paper over a missing database.

Live URL is [roofus.coach](https://roofus.coach). Do **not** create a second Vercel project. Auth is OFF. Database is OFF. Generic canvasser — no Alpha / West Shore identity on a server.

## What is already true

- Stores: day book, streets, weather (kept / tossed / pulse), settings (including company website + brief), survive, threads, reminders, Notion connection.
- Coach may write Presets when they clearly set a field. He does not scrape the company site himself — they tap Read the site.
- GitHub Action + Vercel Hobby is the gate. Push as `pauldevey91@gmail.com`.

## Open questions (answer these before code)

1. **Unit of account.** One phone, one person, or one company? Sharing between canvassers is a different product (CRM). This app is not a CRM.
2. **Source of truth.** Phone remains live, server is the copy? Then we already have Notion. Three copies (phone / Notion / Postgres) will drift. Pick two, or make Postgres replace Notion for people who sign in.
3. **First screen.** Auth ON means a sign-in gate. The porch is the first screen today. Do not put a login wall in front of a knock. Offline must still log four counts.
4. **Migration.** Existing `roofus.coach` phones have books in localStorage. A launch that wipes them is a product failure. Need an export, a silent lift, or a "bring this phone" screen.
5. **When RAG actually pays.** Years of After Action Reports, 145 InterNACHI **bodies**, or a long company site. Titles + Memory FAQs + the website brief do not need RAPTOR. Do not paste article bodies into a store "just in case."
6. **Secrets.** `XAI_API_KEY` is already server-side. Notion secrets stay in **their** integration. Do not add new API keys unless a map or auth provider forces it.

## Suggested phases (not this PR)

**A — no auth.** Export / import the phone book as JSON. Dead phone is not a dead year, still no login.

**B — auth + Postgres.** Better Auth, `user_id` on every row, sync the stores. Phone works offline and pushes when it can. Notion becomes optional, not the backup story.

**C — retrieval.** Only after B. Index Memory FAQs, the company brief they saved, and their own days. InterNACHI stays titles + URL. RAPTOR only if we ever ingest article bodies — we should not.

## Hard no

- Login as the first screen
- Unowned world-writable rows (auth-off database mode)
- A second Vercel project / moving the custom domain onto grok.me
- Inventing a CRM, takeoff, or listing lookup
- Dumping Drive / Alpha identity onto a server
- RAG in the coach prompt "until we have a backend"
