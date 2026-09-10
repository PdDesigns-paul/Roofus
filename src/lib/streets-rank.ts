/** Zip wins. Old subdivision titles still display until they rebuild. */
import type { StreetLoop } from "./streets-types.ts";

export function loopZip(loop: { zip?: string; title?: string }): string {
  const z = (loop.zip ?? "").trim();
  if (/^\d{5}$/.test(z)) return z;
  const t = (loop.title ?? "").trim();
  return /^\d{5}$/.test(t) ? t : "";
}

export function loopLabel(loop: { zip?: string; title?: string; streets?: string[] }): string {
  const zip = loopZip(loop);
  if (zip) return zip;
  if (loop.title?.trim()) return loop.title.trim();
  if (loop.streets?.[0]) return `Near ${loop.streets[0]}`;
  return "Untitled streets";
}

export function loopAge(loop: Pick<StreetLoop, "medianYear">, now = new Date().getFullYear()): number {
  return Math.max(0, now - loop.medianYear);
}

export function nearestZip(
  lat: number,
  lon: number,
  zips: { zip: string; lat: number; lon: number }[],
): string {
  let best = "";
  let bestD = Infinity;
  for (const z of zips) {
    const d = (lat - z.lat) ** 2 + (lon - z.lon) ** 2;
    if (d < bestD) {
      bestD = d;
      best = z.zip;
    }
  }
  return best;
}

export function groupLoopsByCounty(loops: StreetLoop[]): { county: string; loops: StreetLoop[] }[] {
  const order: string[] = [];
  const map = new Map<string, StreetLoop[]>();
  for (const l of loops) {
    const key = l.county.trim() || "County";
    if (!map.has(key)) {
      order.push(key);
      map.set(key, []);
    }
    map.get(key)!.push(l);
  }
  return order.map((county) => ({ county, loops: map.get(county) ?? [] }));
}
