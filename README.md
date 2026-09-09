# Roofus

Porch Dawg. Field coach for roofing. Inspect photos, Shepard’s 145, mindset, and a public-record look at This House before the door.

Takeoff (Instant Roofer tape, range, customer reveal) lives on the `takeoff` branch.

## What it does

- **Roofus** — ride-along coach. Hats. Customer never sees him. CompanyCam is the report.
- **Inspect** — photo walk, then one shot and a question.
- **This House** — geocode + Census + OpenStreetMap. Year built if public. No squares.
- **Mindset** — how you stand.
- **Reference** — 145 InterNACHI Mastering Roof Inspections articles.

## Keys

Phone Settings can hold Maps. Leave blank for **Paul’s Default Option**:

- `GOOGLE_MAPS_API_KEY` — Geocoding API only (optional, sharper addresses)
- `XAI_API_KEY` — Roofus + Inspect vision (server)

Do not put keys in the repo.

## Run

```bash
npm install
npm run dev
```

Needs Node 22+.

## Name

The app is **Roofus**. One word. Capital R only.
