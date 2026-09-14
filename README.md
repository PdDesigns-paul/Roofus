# Roofus

Phone-first ride-along **journal + coach** for door-to-door roofers and storm restoration canvassers.

The phone is the live log. Roofus (the orange button) rides shotgun — tap fans Live / Roleplay / Mindset, hold starts Live. Notion is an optional copy so a dead phone is not a dead year.

**The app is Roofus.** One word. Capital R only.

**Doctrine lives in this repo.** [`DOCTRINE.md`](./DOCTRINE.md) is the only live porch + product book. [`SIGNIFIERS.md`](./SIGNIFIERS.md) is how a control looks like a control. Drive archives and old chats do not override either. Build agents read [`AGENTS.project.md`](./AGENTS.project.md). GitHub is the book. The live phone is [roofus.coach](https://roofus.coach) on Vercel Hobby. SuperGrok is the editor, not a second host.

## What you do in it

| Surface | What it is |
| --- | --- |
| **Truck** | Field log. Working loop one-liner + Cards Go. Pin (drop + last pin on the Working loop). Four counts. One weather sentence, read-only from Keep / Use today. **Night** is a Go to Prep#finish (AAR · blank or AAR · done). Empty-book setup until name + company + one county exist. Ask Roofus how today went is an outline. Pin is the filled Do when a loop is Working. |
| **Door** | Pocket cards: Door, Pushback, i35, Set, Compass. Claim path after Keep. One-line formula on each (hook → honest reason → one open question). Compass is truck only — still on this tab. |
| **Roof** | Camera walk: Street, Four slopes, Close-up, Witnesses, Attic. Ask about that shot. He names the i35 slot. Practice shot is off the roof. CompanyCam is the report. |
| **Prep** | Tab word **Prep**. Route still `/after`. Night-before + morning. Age-band **park-once loops** named from Census streets, grouped by township (default 15–22 year roofs). Working pinned. Near me / Morning / Revisit chips. Plan chips. Maps parks on the loop. Muted hunt tag when a scout card exists. One weather sentence on the Working loop if a kept storm matches. Use today is a chip on the card. Open a loop: that card is the pin board. **Last 48 hours Keep / Toss** lives here. Finish the day owns After Action Report and tomorrow. Settings is a Go at the bottom. Military bases are dropped. |
| **Last 48 hours** | Lives on Prep. Cron later. Keep still gates Script A. H on a kept zip still ranks tomorrow when a pulse exists. Truck may show one kept sentence. |
| **Roofus** | Orange button. Tap fans Live, Roleplay, Mindset — each is a new chat. Hold starts Live. History is the clock in the chat, tagged by color. Hold-to-talk in Roleplay. Beats at the bottom. Score me is a button. Hear it reads his line. Practice only — do not record a homeowner. |
| **Reference** | Reference page lists the InterNACHI index. Coach appendix is the named cards. Company pages land here when they paste a website in Settings. Tap a card to open the page. |
| **Mindset** | Worksheets in Settings → Mindset: Why (ladder), Name the demon, Pace (gear), Talent stack. Chat from the orange fan. Private. After Action Report lives on Prep. |
| **Settings** | Index of pages: You, Territory, Hours, Mindset, Reminders, Backup. Prep is its own tab. Name, company, website (crawled into Reference), warranty, counties, hours, mindset, reminder toggles, optional Notion, Memory FAQs. Reminders nag on open if that box is empty. |

Bottom bar: Truck · Door · Roof · Prep. Help and Menu live in the header. Menu: Reference, Settings. Back only on Settings, Reference, and nested settings pages. Mindset worksheets live in Settings → Mindset.

## Doctrine (short)

Full book: [`DOCTRINE.md`](./DOCTRINE.md). Tap-clues: [`SIGNIFIERS.md`](./SIGNIFIERS.md).

- Age first. Storms are a footnote unless you **Keep** them and they match that street.
- Owner-pay houses. Clustered streets. Skip apartments, HOA-paid roofs, renters (card for the owner only), military bases.
- **Million-dollar door script** = Script B (age / free look). Live’s first starter. Script A (claim talk) only after Keep, and only on matching zips.
- One appointment from a day of knocking is a winning day.
- Homeowner lines: 5th-grade, plain meaning first. Coach talk can sound like a closer.
- Five control types on the phone: Place, Do, Chip, Go, Talk. Buttons do. Links go. Ghost captions are not actions.

## Data

Everything lives in **this browser** (`localStorage` via Zustand):

- `roofus-day-v1` — profile + last 60 days
- `roofus-streets-v1` — loops and age band
- `roofus-weather-v1` — kept / tossed storms and the 48h pulse
- `roofus-survive-v1` — mindset worksheets
- `roofus-notion-v1` — optional integration secret, table ids, FAQs
- `roofus-settings` — theme, company, warranty, website, crawled pages
- `roofus-onboard-v1` — first-run question-mark tour
- coach threads in the coach store

There is **no login** and **no app database**. Do not put a Notion secret in the repo. The secret stays on the phone and is sent to Notion only when they tap Connect or Backup.

### Notion backup (optional, recommended)

Free Notion account. Internal integration. They paste the secret and a page link. We build **Days, Streets, Storms, Mindset, Memory, Pins** in *their* workspace. Restore fills blanks and keeps the higher counts. It does not wipe what they already tapped.

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

Maps open Google Maps search links. No Maps API key. Streets come from Census TIGERweb. Weather is NWS. Notion secret is pasted in Settings and stays on the phone.

Loop research (WFO recap, local news, GIS clickers) is a **sidecar**, not a Streets tap. Vercel Hobby cannot run Chromium:

```bash
node --experimental-strip-types scripts/scout-loop.mjs --demo
# writes artifacts/scout/<loopId>.json and .md
```

`--demo` uses a generic Cumberland County park-once loop. Missing `XAI_API_KEY` is IEM-only and still success. `--playwright` is only when that feed is mute (one adapter, one loop). Captcha or login → unknown, not a guessed year or hail size. Do not add this to CI. Do not import it from `src/routes`.

Do not commit a `.env`. Do not put keys in the client.

### Scripts

```bash
npm run dev          # local app
npm run build        # Vite production build (no database)
npm run typecheck
npm run test:app     # Roofus lib tests (what CI runs)
npm test             # includes Grok platform script tests — not CI
npm run scout:loop -- --demo
                     # sidecar: one loop scout card (IEM). Not the phone. Not CI.
```

## Layout

```
DOCTRINE.md            porch + product book (source of truth)
SIGNIFIERS.md          tap-clues + chrome plan (source of truth for controls)
AGENTS.project.md      instructions for any agent (Grok, Cursor, Copilot)
PLATFORM.md            Grok auth/db leftover — do not call from product code
src/routes/            pages + /api/* proxies
src/components/        phone chrome (tabs, chat sheet, FAB)
src/lib/               stores, ranking, Notion, coach prompt
scripts/scout-loop.mjs sidecar scout — one loop, not the phone, not CI
public/roofus.png      the dog
```

Coach context is assembled in `src/lib/roofus-talk.ts`: today’s log, streets, weather, mindset, Notion memory, company site notes. The system prompt in `src/lib/coach-system.ts` is the product contract — keep it in sync with [`DOCTRINE.md`](./DOCTRINE.md) and the buttons that actually exist.

Backup merge rules live in `src/lib/notion-merge.ts` and are unit-tested. Writes to Notion are chunked in `src/lib/notion-client.ts` so a full copy does not time out.

## Tests

`npm run test:app` is `node --test` on `src/lib/*.test.ts`. Pure functions only (labels, hail grade, county parse, Notion merge, Roof-walk blank). No live Notion token, no live xAI key. GitHub Action on `main` runs typecheck, `test:app`, and build. Do not put Grok `scripts/**/*.test.mjs` in CI.

Phone chrome is not a unit test. Squint at roofus.coach: if an action disappears when type blurs, it was never signified. See [`SIGNIFIERS.md`](./SIGNIFIERS.md).

## Name

Roofus. Not Rufus, not RoofUS. The package and the dog match.
