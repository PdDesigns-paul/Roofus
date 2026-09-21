# Roofus

Phone-first Field OS. **Kernel:** one journal, four Places, five types, Talk FAB, offline book. **Tenant pack `roofus`:** this dog, this gold, this porch — ride-along journal + coach for door-to-door roofers and storm restoration canvassers.

The phone is the live log. Talk (Roofus: the orange dog) rides shotgun — tap fans Live / Roleplay / Mindset, hold starts Live. Notion is an optional copy so a dead phone is not a dead year.

**Pack `roofus` is named Roofus.** One word. Capital R only.

**Doctrine lives in this repo.** [`DOCTRINE.md`](./DOCTRINE.md) splits kernel vs tenant pack; porch paragraphs below that split are still pack `roofus`. [`SIGNIFIERS.md`](./SIGNIFIERS.md) is how a control looks like a control — five types, brand tokens may change. Drive archives and old chats do not override either. Build agents read [`AGENTS.project.md`](./AGENTS.project.md). GitHub is the book. The live phone is [roofus.coach](https://roofus.coach) on Vercel Hobby. SuperGrok is the editor, not a second host.

## What you do in it

Kernel names. Roofus examples in parentheses. Long porch map: [`DOCTRINE.md`](./DOCTRINE.md).

| Kernel | Roofus (pack `roofus`) |
| --- | --- |
| **Today** | Field log. Working loop + **Pin** (GPS → house editor) + four counts (Doors, Talked, On the roof, Appointments). **Night** opens Finish the day on Plan. Empty-book setup until name + company + one county. |
| **Door** | Curriculum cards (Door, Pushback, i35, Set, Compass). Claim path after Keep, matching zip. One-line formula: hook → honest reason → one open question. |
| **Inspect** (tab: **Roof**) | Job-walk rows from the pack (Roofus: Street, Four slopes, Close-up, Witnesses, Attic). Ask about that shot. He names the i35 slot. |
| **Plan** | Night-before + morning. A **map of pins**. Walks from distance (0.4 km, cap 40). Keep / Toss. Finish the day owns After Action Report. Settings is a Go at the bottom — not a fifth Place. |
| **Talk** (orange dog FAB) | Live / Roleplay / Mindset. Hold starts Live. History is the clock. Practice only — do not record a homeowner. |
| **Settings** | Book: You, Territory, Hours, Mindset, Reminders, Backup. Owner chip lives on You when that child ships. Not a `/login` Place. |

Bottom bar: Today · Door · Inspect (Roofus: Roof) · Plan. Help and Menu live in the header. Menu: Reference, Settings. Back only on Settings, Reference, and nested settings pages. Mindset worksheets live in Settings → Mindset.


## Doctrine (short)

Full book: [`DOCTRINE.md`](./DOCTRINE.md). Tap-clues: [`SIGNIFIERS.md`](./SIGNIFIERS.md).

- Age first. Storms are a footnote unless you **Keep** them and they match that street.
- Owner-pay houses. Clustered streets. Skip apartments, HOA-paid roofs, renters (card for the owner only), military bases.
- **Million-dollar door script** = Script B (age / free look). Live’s first starter. Script A (claim talk) only after Keep, and only on matching zips.
- One appointment from a day of knocking is a winning day.
- Homeowner lines: 5th-grade, plain meaning first. Coach talk can sound like a closer.
- Five control types on the phone: Place, Do, Chip, Go, Talk. Buttons do. Links go. Ghost captions are not actions. Brand tokens may change; types may not.
- Kernel vs tenant: Places, types, offline book, Talk stay. Porch words, Script B, Keep, i35, inspect rows, and optional modules (storms, claim, InterNACHI, packets) load from a pack. Roofus is pack `roofus` — all four flags on.


## Data

Everything lives in **this browser** (`localStorage` via Zustand):

- `roofus-day-v1` — profile + last 60 days
- `roofus-streets-v1` — loops and age band
- `roofus-weather-v1` — kept / tossed storms and the 48h pulse
- `roofus-survive-v1` — mindset worksheets
- `roofus-notion-v1` — optional integration secret, table ids, FAQs
- `roofus-settings` — theme, company, warranty, website, crawled pages, `practiceOn` (Roleplay Knock / Score me). Missing = on. No model picker.
- `roofus-owner-v1` — whose book (`ownerId`). Empty = this phone. Journal stores prefix with the id when present; current names stay the anonymous default.
- `roofus-office-mark-v1` — office mark + PWA name, keyed by pack id. Pack `roofus` ignores it. Not Postgres.
- `roofus-onboard-v1` — first-run five job slides. Skip writes this. Replay in Settings.
- coach threads in the coach store

The phone book is **local-first**. Cloud is a copy. Whose book lives on You as a chip (**This phone** when signed out). Switch book is a chip when another owner is already on this phone — not a `/login` Place, not Postgres as the live journal. Do not put a Notion secret in the repo. The secret stays on the phone and is sent to Notion only when they tap Connect or Copy this phone.

### Backup (file first, Notion optional)

Copy this phone. Last copy is a line on You. **Save a file** is the offline lifeboat (same merge as Notion). Restore onto a day that already has counts, or onto pins, needs a typed confirm — first name or `This phone.` Notion stays behind **Use Notion** (secret + page + Connect). We build **Days, Streets, Storms, Mindset, Memory, Pins** in *their* workspace. Labor shifts ride in the same payload. Restore fills blanks and keeps the higher counts. It does not wipe what they already tapped.

FAQs under “Things Roofus should remember” ship with public porch answers (Dashaun Bryant / Adam Bensman). He reads them in chat. Edit or drop. Your office rules win. They work even before they connect Notion.

## Stack

- TanStack Start + Router, React 19, Tailwind v4, Zustand
- xAI for coach chat, speech-to-text, and text-to-speech
- Google Maps JS (Geocoder + Places) when `GOOGLE_MAPS_API_KEY` is set
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
| `OPENROUTER_API_KEY` | server only | Coach chat + company-site brief. Prefer this. Never `VITE_`. |
| `XAI_API_KEY` | server only | Fallback chat if OpenRouter is unset. Transcribe, speak, Last 48 hours pulse. Never `VITE_`. |
| `GOOGLE_MAPS_API_KEY` | server | Maps JS + Geocoder + Places. Phone reads `/api/maps-key`. Never `VITE_` — that prefix errors on the host. Restrict HTTP referrers to `https://roofus.coach/*` and `https://*.vercel.app/*`. Never commit the key. |
| `VITE_TENANT_ID` | build | Pack id. Proof builds: `pest` / `solar` / `demo` win over the host. Shared prod (empty or `roofus`): host allowlist, then Roofus. Never a secret. |
| `VITE_AUTH_ENABLED` | build | Stays `false` on Roofus. Not a login Place. |
| `DATABASE_URL` | unused by this app | Platform leftover. Phone book stays local-first. Host auth/db light up only when [`PLATFORM.md`](./PLATFORM.md) names the child. |


Maps uses `GOOGLE_MAPS_API_KEY` (Geocoder + Places). Street View / Directions / Zillow / Redfin are outbound links — no scrape. Weather is NWS. Notion secret is pasted in Settings and stays on the phone.

Loop research (WFO recap, local news, GIS clickers) is a **sidecar**, not a Streets tap. Vercel Hobby cannot run Chromium:

```bash
node --experimental-strip-types scripts/scout-loop.mjs --demo
# writes artifacts/scout/<loopId>.json and .md
```

`--demo` uses a generic Cumberland County park-once loop. Missing `XAI_API_KEY` is IEM-only and still success. `--playwright` is only when that feed is mute (one adapter, one loop). Captcha or login → unknown, not a guessed year or hail size. Do not add this to CI. Do not import it from `src/routes`.

Do not commit a `.env`. Do not put keys in the client.

### Tenants

One Vercel project. Proof builds pin the pack at build. Shared prod reads the Host allowlist.

```bash
npm run build                         # pack roofus (roofus.coach)
VITE_TENANT_ID=pest npm run build     # pack pest (Stoop) — proof of white-label
VITE_TENANT_ID=solar npm run build    # pack solar (Stride) — proof of white-label
VITE_TENANT_ID=demo npm run build     # same pack as solar (demo is an alias)
```

Resolution: proof env (`pest` / `solar` / `demo`) wins. Shared prod (empty or default `roofus`): host allowlist (`roofus.coach` → `roofus`, `stride.example` → `solar`) → `roofus`. Default env `roofus` does not pin a custom-domain alias. grok.me is not a pack host. CI runs `test:app` against pack `roofus` only. `/api/manifest` follows the resolved pack; `public/manifest.webmanifest` stays Roofus in git.


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
DOCTRINE.md            kernel vs tenant + porch book (source of truth)
SIGNIFIERS.md          tap-clues + chrome plan (five types; brand tokens may change)
AGENTS.project.md      instructions for any agent (Grok, Cursor, Copilot)
PLATFORM.md            when host auth/db may light up — phone book stays local-first
src/routes/            pages + /api/* proxies
src/components/        phone chrome (tabs, chat sheet, FAB)
src/lib/               stores, ranking, Notion, coach prompt
scripts/scout-loop.mjs sidecar scout — one loop, not the phone, not CI
public/roofus.png      the dog (pack `roofus`)

```

Coach context is assembled in `src/lib/roofus-talk.ts`: today’s log, streets, weather, mindset, Notion memory, company site notes, packet files they saved (title, notes, extracted text). The system prompt in `src/lib/coach-prompt.ts` is the product contract — keep it in sync with [`DOCTRINE.md`](./DOCTRINE.md), pack modules, and the buttons that actually exist.


Backup merge rules live in `src/lib/notion-merge.ts` and are unit-tested. Writes to Notion are chunked in `src/lib/notion-client.ts` so a full copy does not time out.

## Tests

`npm run test:app` is `node --test` on `src/lib/*.test.ts`. Pure functions only (labels, hail grade, county parse, Notion merge, Roof-walk blank). No live Notion token, no live xAI key. GitHub Action on `main` runs typecheck, `test:app`, and build. Do not put Grok `scripts/**/*.test.mjs` in CI.

Phone chrome is not a unit test. Squint at roofus.coach: if an action disappears when type blurs, it was never signified. See [`SIGNIFIERS.md`](./SIGNIFIERS.md).

## Name

Roofus. Not Rufus, not RoofUS. The package and the dog match.
