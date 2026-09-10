import { fipsToAbbr } from "./us-state-fips.ts";
import { loopPlace, loopZip } from "./streets-rank.ts";
import type { StreetLoop } from "./streets-types.ts";

type MapLoop = Pick<StreetLoop, "lat" | "lon" | "streets" | "title" | "county" | "state"> & {
  zip?: string;
  town?: string;
  place?: string;
};

/** Google Maps search. Park on the cluster when we have a point. */
export function mapsUrl(loop: MapLoop): string {
  const state = /^\d+$/.test(loop.state) ? fipsToAbbr(loop.state) : loop.state;
  const hasPoint = Number.isFinite(loop.lat) && Number.isFinite(loop.lon) && (loop.lat !== 0 || loop.lon !== 0);
  const q = hasPoint
    ? `${loop.lat},${loop.lon}`
    : (() => {
        const zip = loopZip(loop);
        return zip
          ? [zip, loop.county, state].filter(Boolean).join(", ")
          : [loop.streets[0] || loop.title, loop.county, state].filter(Boolean).join(", ");
      })();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function mapsLabel(
  loop: Pick<StreetLoop, "streets" | "title"> & { zip?: string; town?: string; place?: string },
): string {
  const zip = loopZip(loop);
  const place = loopPlace(loop);
  if (place && zip) return `Map · ${place} · ${zip}`;
  if (place) return `Map · ${place}`;
  if (zip) return `Map · ${zip}`;
  const street = loop.streets[0] || loop.title;
  return street ? `Map · ${street}` : "Open in Maps";
}
