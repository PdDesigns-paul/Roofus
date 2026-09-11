/**
 * A kept storm may be said on a loop only if it is the same county
 * and within ~10 miles. Age still picks the street. Weather is a footnote.
 */
import { countyBasename } from "./us-state-fips.ts";
import type { StormEvent } from "./weather-types.ts";

function miles(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function stormsNearLoop(
  storms: StormEvent[],
  loop: { county: string; lat: number; lon: number },
  milesLimit = 10,
): StormEvent[] {
  const county = countyBasename(loop.county).toLowerCase();
  return storms.filter((s) => {
    if (countyBasename(s.county).toLowerCase() !== county) return false;
    if (!Number.isFinite(s.lat) || !Number.isFinite(loop.lat)) return false;
    return miles(s.lat, s.lon, loop.lat, loop.lon) <= milesLimit;
  });
}

/** One porch sentence. Empty if nothing kept actually hit this zip. */
export function mentionOnStreet(
  storms: StormEvent[],
  loop: { county: string; lat: number; lon: number },
): string {
  const hit = stormsNearLoop(storms, loop)[0];
  const say = hit?.say.trim() ?? "";
  if (!say) return "";
  return `You may mention ${say} on this street.`;
}
