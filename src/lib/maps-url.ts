import { fipsToAbbr } from "./us-state-fips.ts";
import { loopZip } from "./streets-rank.ts";
import type { StreetLoop } from "./streets-types.ts";

type MapLoop = Pick<StreetLoop, "lat" | "lon" | "streets" | "title" | "county" | "state"> & {
  zip?: string;
  town?: string;
};

/** Google Maps search. Zip when we have one — that’s the card now. */
export function mapsUrl(loop: MapLoop): string {
  const state = /^\d+$/.test(loop.state) ? fipsToAbbr(loop.state) : loop.state;
  const zip = loopZip(loop);
  const q = zip
    ? [zip, loop.county, state].filter(Boolean).join(", ")
    : Number.isFinite(loop.lat) && Number.isFinite(loop.lon) && (loop.lat !== 0 || loop.lon !== 0)
      ? `${loop.lat},${loop.lon}`
      : [loop.streets[0] || loop.title, loop.county, state].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function mapsLabel(loop: Pick<StreetLoop, "streets" | "title"> & { zip?: string; town?: string }): string {
  const zip = loopZip(loop);
  const town = (loop.town ?? "").trim();
  if (zip && town) return `Map · ${town} · ${zip}`;
  if (zip) return `Map · ${zip}`;
  const street = loop.streets[0] || loop.title;
  return street ? `Map · ${street}` : "Open in Maps";
}
