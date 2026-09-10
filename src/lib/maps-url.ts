import { fipsToAbbr } from "./us-state-fips.ts";
import type { StreetLoop } from "./streets-types.ts";

/** Google Maps search. No key. Opens the loop, not a directions firehose. */
export function mapsUrl(loop: Pick<StreetLoop, "lat" | "lon" | "streets" | "title" | "county" | "state">): string {
  const state = /^\d+$/.test(loop.state) ? fipsToAbbr(loop.state) : loop.state;
  const street = loop.streets[0] || loop.title;
  const q =
    Number.isFinite(loop.lat) && Number.isFinite(loop.lon) && (loop.lat !== 0 || loop.lon !== 0)
      ? `${loop.lat},${loop.lon}`
      : [street, loop.county, state].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function mapsLabel(loop: Pick<StreetLoop, "streets" | "title">): string {
  const street = loop.streets[0] || loop.title;
  return street ? `Map · ${street}` : "Open in Maps";
}
