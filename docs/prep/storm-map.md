# Prep: storm sub page with a map

Design only. Do not merge until the feature is built. Do not implement in a QoL chat.

## Why this exists

Storms are a bucket **inside** the inspection, not the reason we knocked. Script A only after they **Keep** a storm, and only on a zip that storm actually hit. Named weather only from kept rows.

Today: a weather store (pending / kept / tossed + last-48h pulse), APIs at `/api/weather` and `/api/weather-pulse`, and **no page**. The morning nag ("Storm report") dumps them on Today. Streets may show one sentence on a Working zip if a kept storm matches. Last 48 hours is explicitly **not** on Streets. Maps on a zip card already open Google Maps for that zip.

They asked for a storm sub page that has a map. That is a new surface, not a pin on Streets.

## What is already true

- `useWeather`: Keep / Toss / Keep all. Pulse report. Coach can read kept storms.
- Grading: H on a kept zip can pick tomorrow. Medium and Low do not pick the day.
- Doctrine: no fake storm, no "working next door" unless true today. Do not invent hail.
- Cron later. This page is the human Keep, not a firehose.

## Open questions (answer these before code)

1. **What is on the map?** Kept storms only? Pending last-48h leads too? Age-band zips they already built? Plotting every NWS warning in the state is how Script A leaks onto a door they should not mention.
2. **Whose map?** In-app (Leaflet / MapLibre, no new Google key) vs the same Google Maps search Streets already uses. Overview vs turn-by-turn are different jobs. Zip cards should keep "open in Maps."
3. **Where does it live?** Not a bottom tab. `/storms` from Menu / Presets / the morning nag. Today stays the log.
4. **Fetch on open?** Pulse already crawls NWS (+ optional news/X). This page should run that when they ask, not on every Home paint. Cap it. User-initiated.
5. **Porch sentence.** Today "weather you can mention" and Streets **Use today** already copy a kept sentence. The map must not invent a second sentence.
6. **Empty state.** No kept storms is valid. Age first. Copy: nothing kept is nothing to say.

## Suggested shape (not this PR)

- Route `/storms`. Menu + Presets + morning reminder point here, not Today.
- Map: kept pins + the zips they already built. Pending leads as a list under the map, each with Keep / Toss.
- Tap a kept pin: the porch sentence, matching zips, "Use today" if they are going there.
- Tap a pending lead: facts, then Keep or Toss. Tossed never become porch weather.
- Empty: "Age first. Keep a storm before you mention weather." No sample hail.
- Do not move last-48h onto Streets.

## Hard no

- Fake storm, fake neighbor, invented hail or year
- Script A from a storm they did not Keep
- Making storms the reason we knocked (age first)
- A Google Maps API key in the repo
- Plotting the whole state's warnings
- Recording or photographing the sky as "proof" for insurance
