/** Zip wins. Old subdivision titles still display until they rebuild. */
import { countyBasename } from "./us-state-fips.ts";
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

/** Human line: Mechanicsburg · 17050. Zip stays the key. */
export function loopHeadline(loop: { zip?: string; title?: string; town?: string; streets?: string[] }): string {
  const zip = loopZip(loop);
  const town = (loop.town ?? "").trim();
  if (zip && town) return `${town} · ${zip}`;
  return loopLabel(loop);
}

export function zipFromHeadline(raw: string): string {
  const t = raw.trim();
  if (/^\d{5}$/.test(t)) return t;
  const m = t.match(/(\d{5})\s*$/);
  return m?.[1] ?? "";
}

export function townFromHeadline(raw: string): string {
  const t = raw.trim();
  const m = t.match(/^(.*?)\s*·\s*\d{5}$/);
  return m?.[1]?.trim() ?? "";
}

/** Today / Use today may store zip or town · zip. */
export function matchLoopCluster(
  loop: { zip?: string; title?: string; town?: string; streets?: string[] },
  cluster: string,
): boolean {
  const c = cluster.trim().toLowerCase();
  if (!c) return false;
  if (loopLabel(loop).toLowerCase() === c) return true;
  if (loopHeadline(loop).toLowerCase() === c) return true;
  if (loopZip(loop) && loopZip(loop) === cluster.trim()) return true;
  const town = (loop.town ?? "").trim().toLowerCase();
  if (town && town === c) return true;
  const zip = zipFromHeadline(cluster);
  if (zip && loopZip(loop) === zip) return true;
  return false;
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

function countyKey(name: string): string {
  return countyBasename(name).toLowerCase();
}

function groupKeyFor(name: string, groups: Map<string, StreetLoop[]>): string | null {
  const want = countyKey(name);
  if (!want) return null;
  for (const key of groups.keys()) {
    if (countyKey(key) === want) return key;
  }
  return null;
}

/**
 * Don't let dense counties eat the whole zip budget.
 * Perry stays visible next to Dauphin.
 */
export function fairCountySlice(loops: StreetLoop[], countyOrder: string[], cap = 48, minPer = 6): StreetLoop[] {
  if (!loops.length) return [];
  const groups = new Map<string, StreetLoop[]>();
  for (const l of loops) {
    const key = l.county.trim() || "County";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(l);
  }
  const names = countyOrder.length ? countyOrder : [...groups.keys()];
  const per = Math.max(minPer, Math.floor(cap / Math.max(1, names.length)));
  const picked: StreetLoop[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const key = groupKeyFor(name, groups);
    const list = key ? (groups.get(key) ?? []) : [];
    for (const l of list.slice(0, per)) {
      if (seen.has(l.id)) continue;
      seen.add(l.id);
      picked.push(l);
    }
  }
  if (picked.length < cap) {
    for (const l of loops) {
      if (picked.length >= cap) break;
      if (seen.has(l.id)) continue;
      seen.add(l.id);
      picked.push(l);
    }
  }
  return picked;
}

/** Working zips sit above the county list so they are not buried. */
export function splitWorking(loops: StreetLoop[]): { working: StreetLoop[]; rest: StreetLoop[] } {
  const working: StreetLoop[] = [];
  const rest: StreetLoop[] = [];
  for (const l of loops) {
    if (l.status === "working") working.push(l);
    else rest.push(l);
  }
  return { working, rest };
}
