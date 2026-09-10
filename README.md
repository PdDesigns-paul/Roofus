# Roofus

Phone-first ride-along **journal + coach** for door-to-door roofers and storm restoration canvassers.

The phone is the live log. Roofus (the orange button) rides shotgun. Notion is an optional copy so a dead phone is not a dead year.

**The app is Roofus.** One word. Capital R only.

**Doctrine lives in this repo.** [`DOCTRINE.md`](./DOCTRINE.md) is the only live porch + product book. Drive archives and old chats do not override it. Build agents read [`AGENTS.project.md`](./AGENTS.project.md). GitHub is the book. The live phone is [roofus.coach](https://roofus.coach) on Vercel Hobby. SuperGrok is the editor, not a second host.

## What you do in it

| Surface | What it is |
| --- | --- |
| **Porch** | First screen. Who this is. Open Today, Streets, or Inspect. |
| **Today** | Pre-knock strip, four counts, neighborhood, weather you may mention, After Action Report, tomorrow. |
| **Streets** | Age-band **zips** from your counties (default 17–25 year roofs). Working pinned. Maps. One weather sentence on the Working zip if a kept storm matches. Use today copies it to Today. |
| **Last 48 hours** | Not on Streets. Cron later. Keep still gates Script A. H on a kept zip still ranks tomorrow when a pulse exists. |
| **Inspect** | Camera walk: Street, Four slopes, Close-up, Witnesses, Attic. Ask about that shot. CompanyCam is the report. |
| **Roofus** | Orange button. Pin a hat: Door, Inspect, Pushback, Set, Roleplay, Mindset. New hat = new chat. Hold-to-talk in Roleplay. Score me is a button. Hear it reads his line. Practice only — do not record a homeowner. |
| **Cards** | Five pocket cards: Door, Pushback, i35, Set, Compass. Compass is truck only. |
| **Mindset** | Why, Name the demon, Pace, Talent stack. Private. After Action Report lives on Today. |
| **Presets** | Counties, hours, company name, warranty, optional Notion backup, FAQs Roofus should remember (starters from public porch teaching). |

Bottom bar: Today · Streets · Inspect. The gable mark goes back to the porch. Mindset, Cards, Reference, and Presets sit behind the three dots.

## Doctrine (short)

Full book: [`DOCTRINE.md`](./DOCTRINE.md).

- Age first. Storms are a footnote unless you **Keep** them and they match that street.
- Owner-pay houses. Clustered streets. Skip apartments, HOA-paid roofs, renters (card for the owner only).
- **Million-dollar door script** = Script B (age / free look). Door hat’s first starter. Script A (claim talk) only after Keep, and only on matching zips.
- One appointment from a day of knocking is a winning day.
- Homeowner lines: 5th-grade, plain meaning first. Coach talk can sound like a closer.

## Data

Everything lives in **this browser** (`localStorage` via Zustand):

- `roofus-day-v1` — profile + last 60 days
- `roofus-streets-v1` — loops and age band
- `roofus-weather-v1` — kept / tossed storms and the 48h pulse
- `roofus-survive-v1` — mindset worksheets
- `roofus-notion-v1` — optional integration secret, table ids, FAQs
- `roofus-settings` — theme, company, warranty
- `roofus-onboard-v1` — first-run question-mark tour
- coach threads in the coach store

There is **no login** and **no app database**. Do not put a Notion secret in the repo. The secret stays on the phone and is sent to Notion only when they tap Connect or Backup.

### Notion backup (optional, recommended)

Free Notion account. Internal integration. They paste the secret and a page link. We build **Days, Streets, Storms, Mindset, Memory** in *their* workspace. Restore fills blanks and keeps the higher counts. It does not wipe what they already tapped.

FAQs under “Things Roofus should remember” ship with public porch answers (Dashaun Bryant / Adam Bensman). He reads them in chat. Edit or drop. Your office rules win. They work even before they connect Notion.

## Stack

- TanStack Start + Router, React 19, Tailwind v4, Zustand
- xAI for coach chat, speech-to-text, and text-to-speech
- Census Reporter + TIGERweb for streets
- NWS / IEM Local Storm Reports for season weather
- Notion REST `2022-06-28` via a server proxy (no CORS from the phone)

## Run

Node 22+.

```bash
npm install
npm run dev
```

### Env

| Variable | Where | What |
| --- | --- | --- |
| `XAI_API_KEY` | server only | Roofus chat, transcribe, speak, Last 48 hours pulse. Never `VITE_`. |
| `DATABASE_URL` | unused by this app | Platform leftover. Auth and Postgres stay off. |

Maps open Google Maps search links. No Maps API key. Streets come from Census TIGERweb. Weather is NWS. Notion secret is pasted in Presets and stays on the phone.

Do not commit a `.env`. Do not put keys in the client.

### Scripts

```bash
npm run dev          # local app
npm run build        # production build
npm run typecheck
npm run test:app     # Roofus lib tests (what CI runs)
npm test             # includes Grok platform script tests — not CI
```

## Layout

```
DOCTRINE.md            porch + product book (source of truth)
AGENTS.project.md      instructions for any agent (Grok, Cursor, Copilot)
src/routes/            pages + /api/* proxies
src/components/        phone chrome (tabs, chat sheet, FAB)
src/lib/               stores, ranking, Notion, coach prompt
public/roofus.png      the dog
```

Coach context is assembled in `src/lib/roofus-talk.ts`: today’s log, streets, weather, mindset, Notion memory. The system prompt in `src/lib/coach-system.ts` is the product contract — keep it in sync with [`DOCTRINE.md`](./DOCTRINE.md) and the buttons that actually exist.

Backup merge rules live in `src/lib/notion-merge.ts` and are unit-tested. Writes to Notion are chunked in `src/lib/notion-client.ts` so a full copy does not time out.

## Tests

`npm run test:app` is `node --test` on `src/lib/*.test.ts`. Pure functions only (labels, hail grade, county parse, Notion merge, Inspect-blank). No live Notion token, no live xAI key. GitHub Action on `main` runs typecheck, `test:app`, and build. Do not put Grok `scripts/**/*.test.mjs` in CI.

## Name

Roofus. Not Rufus, not RoofUS. The package and the dog match.
