/** Cluster wins. Old zip / town headlines still display until they rebuild. */
import { countyBasename } from "./us-state-fips.ts";
import type { StreetLoop } from "./streets-types.ts";

export function loopZip(loop: { zip?: string; title?: string }): string {
  const z = (loop.zip ?? "").trim();
  if (/^\d{5}$/.test(z)) return z;
  const t = (loop.title ?? "").trim();
  return /^\d{5}$/.test(t) ? t : "";
}

export function loopPlace(loop: {
  place?: string;
  title?: string;
  town?: string;
  township?: string;
  streets?: string[];
}): string {
  const place = (loop.place ?? "").trim();
  if (place) return place;
  const title = (loop.title ?? "").trim();
  if (title && !/^\d{5}$/.test(title)) return title;
  const town = (loop.town ?? "").trim();
  if (town) return town;
  const twp = (loop.township ?? "").trim();
  if (twp) return twp;
  return "";
}

export function loopLabel(loop: { zip?: string; title?: string; streets?: string[]; place?: string; town?: string }): string {
  const place = loopPlace(loop);
  const zip = loopZip(loop);
  if (place && zip) return `${place} · ${zip}`;
  if (place) return place;
  if (zip) return zip;
  if (loop.streets?.[0]) return `Near ${loop.streets[0]}`;
  return "Untitled streets";
}

/** Human line: Creekview Dr / Mill Rd · 17050. Old zip cards still show town · zip. */
export function loopHeadline(loop: {
  zip?: string;
  title?: string;
  town?: string;
  place?: string;
  township?: string;
  streets?: string[];
}): string {
  const zip = loopZip(loop);
  const place = loopPlace(loop);
  if (zip && place) return `${place} · ${zip}`;
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

/** Today / Use today may store cluster · zip, town · zip, or a leftover zip. */
export function matchLoopCluster(
  loop: {
    zip?: string;
    title?: string;
    town?: string;
    place?: string;
    township?: string;
    streets?: string[];
  },
  cluster: string,
): boolean {
  const c = cluster.trim().toLowerCase();
  if (!c) return false;
  if (loopLabel(loop).toLowerCase() === c) return true;
  if (loopHeadline(loop).toLowerCase() === c) return true;
  if (loopPlace(loop).toLowerCase() === c) return true;
  if (loopZip(loop) && loopZip(loop) === cluster.trim()) return true;
  const zip = zipFromHeadline(cluster);
  if (zip && loopZip(loop) === zip && townFromHeadline(cluster).toLowerCase() === loopPlace(loop).toLowerCase()) {
    return true;
  }
  return false;
}

/** Today stores several headlines in one Notion string, one per line. */
export const MAX_TODAY_LOOPS = 8;

export function clusterLines(raw: string): string[] {
  return raw
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function clusterPlanLabel(raw: string): string {
  return clusterLines(raw).join("; ");
}

export function addCluster(raw: string, headline: string): string {
  const next = headline.trim();
  if (!next) return clusterLines(raw).join("\n");
  const lines = clusterLines(raw);
  if (lines.some((l) => l.toLowerCase() === next.toLowerCase())) return lines.join("\n");
  if (lines.length >= MAX_TODAY_LOOPS) return lines.join("\n");
  return [...lines, next].join("\n");
}

export function dropCluster(raw: string, headline: string): string {
  const want = headline.trim().toLowerCase();
  if (!want) return clusterLines(raw).join("\n");
  return clusterLines(raw)
    .filter((l) => l.toLowerCase() !== want)
    .join("\n");
}

export function addLoopToPlan(
  raw: string,
  loop: {
    zip?: string;
    title?: string;
    town?: string;
    place?: string;
    township?: string;
    streets?: string[];
  },
): string {
  const headline = loopHeadline(loop);
  const lines = clusterLines(raw);
  if (lines.some((l) => matchLoopCluster(loop, l))) {
    return lines.map((l) => (matchLoopCluster(loop, l) ? headline : l)).join("\n");
  }
  return addCluster(raw, headline);
}

export function dropLoopFromPlan(
  raw: string,
  loop: {
    zip?: string;
    title?: string;
    town?: string;
    place?: string;
    township?: string;
    streets?: string[];
  },
): string {
  return clusterLines(raw)
    .filter((l) => !matchLoopCluster(loop, l))
    .join("\n");
}

export function loopInPlan(
  loop: {
    zip?: string;
    title?: string;
    town?: string;
    place?: string;
    township?: string;
    streets?: string[];
  },
  raw: string,
): boolean {
  return clusterLines(raw).some((l) => matchLoopCluster(loop, l));
}

export function loopsInPlan(loops: StreetLoop[], raw: string): StreetLoop[] {
  const out: StreetLoop[] = [];
  const seen = new Set<string>();
  for (const line of clusterLines(raw)) {
    const hit = loops.find((l) => matchLoopCluster(l, line));
    if (!hit || seen.has(hit.id)) continue;
    seen.add(hit.id);
    out.push(hit);
  }
  return out;
}

/** First loop in the plan that is not done or skipped. Backups stay off Working. */
export function firstRemainingInPlan(loops: StreetLoop[], raw: string): StreetLoop | null {
  const plan = loopsInPlan(loops, raw);
  return plan.find((l) => l.status !== "done" && l.status !== "skip") ?? plan[0] ?? null;
}

export function loopMatchesQuery(
  loop: StreetLoop,
  needle: string,
): boolean {
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  if (loopHeadline(loop).toLowerCase().includes(q)) return true;
  if ((loop.place ?? "").toLowerCase().includes(q)) return true;
  if ((loop.township ?? "").toLowerCase().includes(q)) return true;
  if ((loop.town ?? "").toLowerCase().includes(q)) return true;
  if (loop.county.toLowerCase().includes(q)) return true;
  if (countyBasename(loop.county).toLowerCase().includes(q)) return true;
  if (loop.zip.includes(q)) return true;
  if (loop.streets.some((s) => s.toLowerCase().includes(q))) return true;
  return false;
}

/** Search opens every matching county. Working is filtered too. */
export function searchStreetLoops(
  loops: StreetLoop[],
  raw: string,
): { working: StreetLoop[]; rest: StreetLoop[]; searching: boolean } {
  const { working, rest } = splitWorking(loops);
  const q = raw.trim();
  if (!q) return { working, rest, searching: false };
  return {
    working: working.filter((l) => loopMatchesQuery(l, q)),
    rest: rest.filter((l) => loopMatchesQuery(l, q)),
    searching: true,
  };
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

export function groupLoopsByTownship(loops: StreetLoop[]): {
  county: string;
  townships: { township: string; loops: StreetLoop[] }[];
}[] {
  return groupLoopsByCounty(loops).map((g) => {
    const order: string[] = [];
    const map = new Map<string, StreetLoop[]>();
    for (const l of g.loops) {
      const key = (l.township || l.town || "Loops").trim();
      if (!map.has(key)) {
        order.push(key);
        map.set(key, []);
      }
      map.get(key)!.push(l);
    }
    return {
      county: g.county,
      townships: order.map((township) => ({ township, loops: map.get(township) ?? [] })),
    };
  });
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
 * Don't let dense counties eat the whole loop budget.
 * A thin county they typed in Presets still gets a share.
 */
export function fairCountySlice(loops: StreetLoop[], countyOrder: string[], cap = 80, minPer = 12): StreetLoop[] {
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

/** Working loops sit above the county list so they are not buried. */
export function splitWorking(loops: StreetLoop[]): { working: StreetLoop[]; rest: StreetLoop[] } {
  const working: StreetLoop[] = [];
  const rest: StreetLoop[] = [];
  for (const l of loops) {
    if (l.status === "working") working.push(l);
    else rest.push(l);
  }
  return { working, rest };
}

/** Rebuild must not stamp every child loop Working just because the old card was a zip. */
export function mergeStatus(incoming: StreetLoop[], previous: StreetLoop[]): StreetLoop[] {
  const byId = new Map(previous.map((l) => [l.id, l]));
  return incoming.map((l) => {
    const old = byId.get(l.id);
    if (!old) return l;
    return {
      ...l,
      status: old.status,
      lastResult: old.lastResult,
      town: l.town?.trim() || old.town || "",
      place: l.place?.trim() || old.place || "",
      township: l.township?.trim() || old.township || "",
    };
  });
}

export function nextFreshInTownship(loops: StreetLoop[]): StreetLoop | null {
  const working = loops.filter((l) => l.status === "working");
  if (working[0]) return working[0];
  const fresh = loops.filter((l) => l.status === "fresh");
  const done = loops.filter((l) => l.status === "done");
  const twp = (done.at(-1)?.township ?? "").trim();
  if (twp) {
    const same = fresh.find((l) => (l.township ?? "").trim() === twp);
    if (same) return same;
  }
  return fresh[0] ?? null;
}
