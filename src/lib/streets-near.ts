/**
 * Slice 5: tag loops we already built. Near me sorts them. Never invent a zip.
 */
import type { ScoutCard } from "./scout-types.ts";
import type { StreetLoop } from "./streets-types.ts";

export function milesBetween(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function loopHasPin(loop: Pick<StreetLoop, "lat" | "lon">): boolean {
  return Number.isFinite(loop.lat) && Number.isFinite(loop.lon) && !(loop.lat === 0 && loop.lon === 0);
}

export function formatMiles(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  if (n < 0.1) return "0.1 mi";
  if (n < 10) return `${n.toFixed(1)} mi`;
  return `${Math.round(n)} mi`;
}

/** Empty book stays empty. Do not invent a zip from a point. */
export function sortLoopsByDistance(
  loops: StreetLoop[],
  lat: number,
  lon: number,
): StreetLoop[] {
  if (!loops.length) return [];
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [...loops];
  return [...loops].sort((a, b) => {
    const aOk = loopHasPin(a);
    const bOk = loopHasPin(b);
    if (aOk !== bOk) return aOk ? -1 : 1;
    if (!aOk) return 0;
    return milesBetween(a.lat, a.lon, lat, lon) - milesBetween(b.lat, b.lon, lat, lon);
  });
}

export function nearMeList(
  loops: StreetLoop[],
  here: { lat: number; lon: number } | null,
): StreetLoop[] {
  if (!loops.length || !here) return [];
  if (!Number.isFinite(here.lat) || !Number.isFinite(here.lon)) return [];
  return sortLoopsByDistance(loops, here.lat, here.lon);
}

export type StreetsScoutTag = {
  ageBand: ScoutCard["ageBand"];
  stormBand: ScoutCard["stormBand"];
  why: string;
};

/** Short hunt footnote. Empty when no card. Never a porch sentence. Never auto-Skip. */
export function streetsScoutTag(card: ScoutCard | undefined | null): StreetsScoutTag | null {
  if (!card) return null;
  const why = card.why
    .replace(/You may mention[^.]*\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return { ageBand: card.ageBand, stormBand: card.stormBand, why };
}

export function streetsScoutLine(card: ScoutCard | undefined | null): string {
  const tag = streetsScoutTag(card);
  if (!tag) return "";
  return tag.why ? `${tag.ageBand} · ${tag.stormBand} · ${tag.why}` : `${tag.ageBand} · ${tag.stormBand}`;
}

export function scoutLinesForCoach(
  cards: Record<string, ScoutCard>,
  loops: StreetLoop[],
): string {
  const rows: string[] = [];
  for (const loop of loops) {
    const line = streetsScoutLine(cards[loop.id]);
    if (!line) continue;
    rows.push(`- ${loop.id}: ${line}`);
    if (rows.length >= 16) break;
  }
  if (!rows.length) return "";
  return [
    "# Loop hunt footnotes (ageBand / stormBand / why). Same as Working streets — not porch copy.",
    "Do not invent hail. Do not say these on the porch unless they Kept a matching storm in the last 48 hours.",
    "Human chips own Skip. A veto or H band is not an auto-Skip.",
    ...rows,
  ].join("\n");
}
