# RoofUs

Porch closer for roofing. Instant takeoff, a customer range (never a $/square headline), and **Rufus** — the field coach in the truck.

## What it does

- Pin a house (this house / address / demo). Instant Roofer tapes the roof.
- Rep ticket stays dark. Customer reveal is a range plus what’s included.
- Duration book is $550/sq, full tear-off. First plywood sheet included, $85 after.
- Paid tapes and Rufus answers live on the phone (IndexedDB). Same pin is free for 6 months.
- Inspect is a field walk, not 145 InterNACHI parts.

## Keys

Phone Settings can hold both. Leave a field blank for **Paul’s Default Option** (server secrets):

- `INSTANT_ROOFER_API_KEY` — the tape
- `GOOGLE_MAPS_API_KEY` — Geocoding API only (optional, sharper addresses)

Do not put keys in the repo. A key pasted on the phone stays on the device and wins over Paul’s default.


## Run

```bash
npm install
npm run dev
```

Needs Node 22+. Instant Roofer and (optional) Google Geocoding on the server.

## Coach

Rufus speaks 5th-grade English unless you ask for more. Customer never sees him.
