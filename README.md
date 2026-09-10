# Roofus

Phone-first ride-along **journal + coach** for door-to-door roofers and storm restoration canvassers.

The phone is the live log. Roofus (the orange button) rides shotgun. Notion is an optional copy so a dead phone is not a dead year.

**The app is Roofus.** One word. Capital R only.

**Doctrine lives in this repo.** [`DOCTRINE.md`](./DOCTRINE.md) is the only live porch + product book. Drive archives and old chats do not override it. Build agents read [`AGENTS.project.md`](./AGENTS.project.md).

## What you do in it

| Surface | What it is |
| --- | --- |
| **Today** | Four counts (Doors, Talked, On the roof, Appointments), neighborhood, weather you may mention, After Action Report, tomorrow. |
| **Streets** | Age-band **zips** from your counties (default 17–25 year roofs), grouped by county. Working / Done / Skip. Maps on the card. |
| **Last 48 hours** | On-demand. NWS first, then local news and X. Grade H / M / L. **H on a zip you keep is tomorrow.** Medium and Low do not pick the day. |
| **Inspect** | Camera walk: Street, Four slopes, Close-up, Witnesses, Attic. Ask about that shot. CompanyCam is the report. |
| **Roofus** | Orange button. Pin a hat: Door, Inspect, Pushback, Set, Roleplay, Score. Hold-to-talk in Roleplay. Hear it reads his line. Practice only — do not record a homeowner. |
| **Mindset** | Why, Name the demon, Pace, Talent stack. Private. After Action Report lives on Today. |
| **Presets** | Counties, hours, company name, warranty, optional Notion backup, FAQs Roofus should remember (starters from public porch teaching). |

Bottom bar: Today · Streets · Inspect. Mindset, Reference, and Presets sit behind the three dots.

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
| `XAI_API_KEY` | server only | Roofus chat, transcribe, speak. Never `VITE_`. |
| `DATABASE_URL` | unused by this app | Platform leftover. Auth and Postgres stay off. |

Do not commit a `.env`. Do not put keys in the client.

### Scripts

```bash
npm run dev          # local app
npm run build        # production build
npm run typecheck
npm test
```

## Layout

```
DOCTRINE.md            porch + product book (source of truth)
AGENTS.project.md      instructions for the next Build chat
src/routes/            pages + /api/* proxies
src/components/        phone chrome (tabs, chat sheet, FAB)
src/lib/               stores, ranking, Notion, coach prompt
public/roofus.png      the dog
```

Coach context is assembled in `src/lib/roofus-talk.ts`: today’s log, streets, weather, mindset, Notion memory. The system prompt in `src/lib/coach-system.ts` is the product contract — keep it in sync with [`DOCTRINE.md`](./DOCTRINE.md) and the buttons that actually exist.

Backup merge rules live in `src/lib/notion-merge.ts` and are unit-tested. Writes to Notion are chunked in `src/lib/notion-client.ts` so a full copy does not time out.

## Tests

`node --test` on `src/lib/*.test.ts`. Pure functions only (labels, hail grade, county parse, Notion merge). No live Notion token, no live xAI key.

## Name

Roofus. Not Rufus, not RoofUS. The package and the dog match.
