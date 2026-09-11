/**
 * Hit_List grain: one card is a park-once cluster, not a zip and not a township.
 * Names come from Census streets / a small CDP. Never a pasted subdivision list.
 */
import type { StreetLoop } from "./streets-types.ts";

export const CLUSTER_MAX_HOMES = 150;
export const CLUSTER_MAX_KM = 0.8;
export const CLUSTER_MAX_STREETS = 8;

export type ClusterSeed = {
  geoid: string;
  homes: number;
  medianYear: number;
  lat: number;
  lon: number;
  bbox: [number, number, number, number];
  zip: string;
  township: string;
  townshipId: string;
  cdp: string;
  ccd: boolean;
};

export function townshipLabel(name: string): string {
  return name
    .trim()
    .replace(/\s+(charter township|township|borough|city|town|municipality|ccd|district|cdp)\.?$/i, "")
    .trim();
}

/** Place / CDP / township — not a street named Depot Rd. */
const MILITARY_PLACE =
  /\b(barracks|naval support|naval air|naval station|nsa|air force|afb|army depot|army base|army post|marine corps|coast guard base|coast guard station|defense depot|defense distribution|defense logistics|proving ground|weapons station|ammunition plant|ordnance|arsenal|military reservation|military base|military installation)\b/i;

export function isMilitaryPlace(name: string): boolean {
  return MILITARY_PLACE.test(name.trim());
}

export function onMilitaryLand(
  lon: number,
  lat: number,
  bases: { rings?: number[][][] }[],
): boolean {
  return bases.some((b) => pointInPolygon(lon, lat, b.rings));
}

export function dropMilitarySeeds<T extends { lat: number; lon: number; cdp?: string; township?: string }>(
  seeds: T[],
  bases: { rings?: number[][][] }[],
): T[] {
  return seeds.filter((s) => {
    if (isMilitaryPlace(s.cdp ?? "") || isMilitaryPlace(s.township ?? "")) return false;
    return !onMilitaryLand(s.lon, s.lat, bases);
  });
}

export function isMilitaryLoop(loop: { place?: string; township?: string; title?: string }): boolean {
  return isMilitaryPlace(loop.place ?? "") || isMilitaryPlace(loop.township ?? "") || isMilitaryPlace(loop.title ?? "");
}

export function kmBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]?.[0] ?? 0;
    const yi = ring[i]?.[1] ?? 0;
    const xj = ring[j]?.[0] ?? 0;
    const yj = ring[j]?.[1] ?? 0;
    const hit = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

export function pointInPolygon(lon: number, lat: number, rings?: number[][][]): boolean {
  if (!rings?.[0]?.length) return false;
  if (!pointInRing(lon, lat, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    const hole = rings[i];
    if (hole && pointInRing(lon, lat, hole)) return false;
  }
  return true;
}

export function unionBbox(boxes: [number, number, number, number][]): [number, number, number, number] | null {
  if (!boxes.length) return null;
  let minx = 180;
  let miny = 90;
  let maxx = -180;
  let maxy = -90;
  for (const [a, b, c, d] of boxes) {
    minx = Math.min(minx, a);
    miny = Math.min(miny, b);
    maxx = Math.max(maxx, c);
    maxy = Math.max(maxy, d);
  }
  return [minx, miny, maxx, maxy];
}

export function clusterName(input: {
  cdp: string;
  cdpShared: boolean;
  streets: string[];
  township: string;
  ccd: boolean;
}): string {
  const cdp = townshipLabel(input.cdp);
  if (cdp && !input.cdpShared) return cdp;
  const streets = input.streets.map((s) => s.trim()).filter(Boolean);
  if (streets.length >= 2) return `${streets[0]} / ${streets[1]}`;
  if (streets[0]) return streets[0];
  if (!input.ccd) {
    const twp = townshipLabel(input.township);
    if (twp) return twp;
  }
  return "Loop";
}

function slug(raw: string): string {
  const s = raw.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16);
  return s || "x";
}

export function clusterId(countyGeoid: string, zip: string, township: string, place: string): string {
  return `${countyGeoid}-z${zip || "0"}-t${slug(township)}-${slug(place)}`;
}

function fenceKey(seed: ClusterSeed): string {
  if (seed.ccd) return "_ccd";
  return seed.townshipId || seed.township || "_";
}

function minDistToCluster(cand: ClusterSeed, cluster: ClusterSeed[]): number {
  let best = Infinity;
  for (const m of cluster) {
    const d = kmBetween(cand.lat, cand.lon, m.lat, m.lon);
    if (d < best) best = d;
  }
  return best;
}

function greedyCluster(list: ClusterSeed[]): ClusterSeed[][] {
  const leftover = list.slice().sort((a, b) => b.homes - a.homes);
  const clusters: ClusterSeed[][] = [];
  while (leftover.length) {
    const seed = leftover.shift()!;
    const cluster = [seed];
    let homes = Math.max(0, seed.homes);
    let grew = true;
    while (grew) {
      grew = false;
      let bestI = -1;
      let bestD = Infinity;
      for (let i = 0; i < leftover.length; i++) {
        const cand = leftover[i]!;
        if (homes + Math.max(0, cand.homes) > CLUSTER_MAX_HOMES) continue;
        const d = minDistToCluster(cand, cluster);
        if (d <= CLUSTER_MAX_KM && d < bestD) {
          bestD = d;
          bestI = i;
        }
      }
      if (bestI >= 0) {
        const add = leftover.splice(bestI, 1)[0]!;
        cluster.push(add);
        homes += Math.max(0, add.homes);
        grew = true;
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

export function clusterSeeds(seeds: ClusterSeed[]): ClusterSeed[][] {
  const groups = new Map<string, ClusterSeed[]>();
  for (const s of seeds) {
    const key = fenceKey(s);
    const list = groups.get(key) ?? [];
    list.push(s);
    groups.set(key, list);
  }
  const out: ClusterSeed[][] = [];
  for (const list of groups.values()) out.push(...greedyCluster(list));
  return out;
}

function sharedCdp(groups: ClusterSeed[][]): Set<string> {
  const counts = new Map<string, number>();
  for (const members of groups) {
    const names = new Set(members.map((m) => townshipLabel(m.cdp)).filter(Boolean));
    if (names.size !== 1) continue;
    const name = [...names][0]!;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const shared = new Set<string>();
  for (const [name, n] of counts) {
    if (n > 1) shared.add(name);
  }
  return shared;
}

function majorityZip(members: ClusterSeed[]): string {
  const tally = new Map<string, number>();
  for (const m of members) {
    if (!/^\d{5}$/.test(m.zip)) continue;
    tally.set(m.zip, (tally.get(m.zip) ?? 0) + Math.max(1, m.homes));
  }
  let best = "";
  let n = 0;
  for (const [zip, homes] of tally) {
    if (homes > n) {
      n = homes;
      best = zip;
    }
  }
  return best;
}

export function finishLoop(
  members: ClusterSeed[],
  streets: string[],
  county: { name: string; geoid: string; stateFp: string },
  cdpShared: boolean,
): StreetLoop | null {
  if (!members.length) return null;
  const homes = members.reduce((n, m) => n + Math.max(0, m.homes), 0);
  const weight = Math.max(1, homes);
  const lat = members.reduce((n, m) => n + m.lat * Math.max(1, m.homes), 0) / weight;
  const lon = members.reduce((n, m) => n + m.lon * Math.max(1, m.homes), 0) / weight;
  const medianYear = Math.round(
    members.reduce((n, m) => n + m.medianYear * Math.max(1, m.homes), 0) / weight,
  );
  const zip = majorityZip(members);
  const ccd = members.every((m) => m.ccd);
  const township = ccd ? "" : townshipLabel(members[0]?.township ?? "");
  const cdpNames = new Set(members.map((m) => townshipLabel(m.cdp)).filter(Boolean));
  const cdp = cdpNames.size === 1 ? [...cdpNames][0]! : "";
  const keyStreets = streets.slice(0, CLUSTER_MAX_STREETS);
  const place = clusterName({
    cdp,
    cdpShared: cdpShared && Boolean(cdp),
    streets: keyStreets,
    township,
    ccd,
  });
  if (keyStreets.length < 2 && !township && place === "Loop") return null;
  return {
    id: clusterId(county.geoid, zip, township, place),
    title: place,
    zip,
    town: "",
    place,
    township,
    streets: keyStreets,
    county: county.name,
    state: county.stateFp,
    medianYear,
    homes,
    lat,
    lon,
    status: "fresh",
    lastResult: "",
  };
}

export function loopsFromClusters(
  groups: ClusterSeed[][],
  streetsFor: (members: ClusterSeed[]) => string[],
  county: { name: string; geoid: string; stateFp: string },
): StreetLoop[] {
  const shared = sharedCdp(groups);
  const loops: StreetLoop[] = [];
  const used = new Set<string>();
  for (const members of groups) {
    const streets = streetsFor(members);
    const loop = finishLoop(members, streets, county, shared.has(townshipLabel(members[0]?.cdp ?? "")));
    if (!loop) continue;
    let id = loop.id;
    let n = 2;
    while (used.has(id)) {
      id = `${loop.id}-${n}`;
      n += 1;
    }
    used.add(id);
    loops.push({ ...loop, id });
  }
  return loops;
}
