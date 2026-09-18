/**
 * Pull revalidates weather + blank-pin geocode.
 * A full location.reload blows the PWA for a local journal.
 * Only reload the document if it is actually stale — we don't do that here.
 */
import { useDayBook } from "./day-book.ts";
import { reverseGeocode } from "./pin-geocode.ts";
import { pinHasPoint } from "./pins.ts";
import { usePins } from "./pins-store.ts";
import { phoneError, readJson } from "./read-json.ts";
import { applyPulseFootprints } from "./scout-store.ts";
import { useStreets } from "./streets-store.ts";
import { useWeather } from "./weather-store.ts";
import type { PulseReport } from "./weather-types.ts";

export async function refreshWeatherPulse(): Promise<void> {
  const { counties, states } = useDayBook.getState().profile;
  if (!counties.trim() || !states.trim()) return;
  const loops = useStreets.getState().loops;
  const res = await fetch("/api/weather-pulse", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      counties,
      states,
      loops: loops.map((l) => ({
        id: l.id,
        title: l.title,
        zip: l.zip,
        streets: l.streets,
        county: l.county,
        lat: l.lat,
        lon: l.lon,
        status: l.status,
      })),
    }),
  });
  const data = (await readJson(res)) as (PulseReport & { error?: string }) | null;
  if (!data) throw new Error("Could not check the last 48 hours.");
  if (!res.ok) throw new Error(phoneError(data.error, "Could not check the last 48 hours."));
  useWeather.getState().setPulse(data);
  const { ageMin, ageMax } = useStreets.getState();
  applyPulseFootprints(data.footprints ?? [], loops, ageMin, ageMax, data.at);
}

export async function geocodeBlankPins(): Promise<void> {
  const blanks = usePins
    .getState()
    .pins.filter((p) => pinHasPoint(p) && !p.address.trim())
    .slice(0, 8);
  for (const p of blanks) {
    const geo = await reverseGeocode(p.lat, p.lng);
    if (!geo) continue;
    const cur = usePins.getState().pins.find((x) => x.id === p.id);
    if (!cur || cur.address.trim()) continue;
    usePins.getState().update(p.id, geo, true);
  }
}

export async function refreshInFlight(): Promise<void> {
  await Promise.all([refreshWeatherPulse().catch(() => undefined), geocodeBlankPins().catch(() => undefined)]);
}
