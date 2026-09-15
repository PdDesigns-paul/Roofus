/** Pins first. Distance makes a park-once walk. */
import { pinHasPoint, serializePin, type HousePin } from "./pins.ts";
import type { StreetLoop } from "./streets-types.ts";

export const WALK_MAX_KM = 0.4;
export const WALK_MAX_PINS = 40;

export function kmBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function newLoopId() {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function streetFromAddress(address: string, houseNumber = ""): string {
  let s = address.trim();
  if (!s) return "";
  s = (s.split(",")[0] ?? s).trim();
  const num = houseNumber.trim();
  if (num) {
    const re = new RegExp(`^${num.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i");
    s = s.replace(re, "");
  }
  s = s.replace(/^\d+[A-Za-z]?\s+/, "").trim();
  return s;
}

export function houseNumOf(pin: Pick<HousePin, "houseNumber" | "address">): number {
  const raw = pin.houseNumber.trim() || (pin.address.match(/^(\d+)/)?.[1] ?? "");
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function centroid(pins: Pick<HousePin, "lat" | "lng">[]): { lat: number; lng: number } {
  if (!pins.length) return { lat: 0, lng: 0 };
  const ok = pins.filter(pinHasPoint);
  const list = ok.length ? ok : pins;
  return {
    lat: list.reduce((n, p) => n + p.lat, 0) / list.length,
    lng: list.reduce((n, p) => n + p.lng, 0) / list.length,
  };
}

function minDistTo(pin: Pick<HousePin, "lat" | "lng">, others: Pick<HousePin, "lat" | "lng">[]): number {
  let best = Infinity;
  for (const o of others) {
    const d = kmBetween(pin.lat, pin.lng, o.lat, o.lng);
    if (d < best) best = d;
  }
  return best;
}

function minDistSets(a: Pick<HousePin, "lat" | "lng">[], b: Pick<HousePin, "lat" | "lng">[]): number {
  let best = Infinity;
  for (const p of a) {
    const d = minDistTo(p, b);
    if (d < best) best = d;
  }
  return best;
}

export function walkingLine(pins: HousePin[]): HousePin[] {
  if (!pins.length) return [];
  if (pins.length === 1) return [{ ...serializePin(pins[0]!), walkIndex: 1 }];

  const groups = new Map<string, HousePin[]>();
  for (const p of pins) {
    const key = streetFromAddress(p.address, p.houseNumber).toLowerCase() || "_";
    const list = groups.get(key) ?? [];
    list.push(p);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => houseNumOf(a) - houseNumOf(b) || a.createdAt.localeCompare(b.createdAt));
  }

  let west = pins[0]!;
  for (const p of pins) {
    if (p.lng < west.lng - 1e-9 || (Math.abs(p.lng - west.lng) < 1e-9 && p.lat < west.lat)) west = p;
  }
  const startKey = streetFromAddress(west.address, west.houseNumber).toLowerCase() || "_";
  const remaining = [...groups.keys()].filter((k) => k !== startKey);
  const order = groups.has(startKey) ? [startKey] : [...groups.keys()];
  const rest = groups.has(startKey) ? remaining : remaining.filter((k) => k !== order[0]);

  while (rest.length) {
    const last = groups.get(order[order.length - 1]!) ?? [];
    const c = centroid(last);
    let bestI = 0;
    let bestD = Infinity;
    for (let i = 0; i < rest.length; i++) {
      const d = kmBetween(c.lat, c.lng, centroid(groups.get(rest[i]!) ?? []).lat, centroid(groups.get(rest[i]!) ?? []).lng);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }
    order.push(rest.splice(bestI, 1)[0]!);
  }

  const out: HousePin[] = [];
  let i = 1;
  for (const key of order) {
    for (const p of groups.get(key) ?? []) {
      out.push({ ...serializePin(p), walkIndex: i });
      i += 1;
    }
  }
  return out;
}

function majority(values: string[]): string {
  const tally = new Map<string, number>();
  for (const raw of values) {
    const v = raw.trim();
    if (!v) continue;
    tally.set(v, (tally.get(v) ?? 0) + 1);
  }
  let best = "";
  let n = 0;
  for (const [v, c] of tally) {
    if (c > n) {
      n = c;
      best = v;
    }
  }
  return best;
}

function autoName(streets: string[]): string {
  return streets[0] || "Loop";
}

function uniqueStreets(pins: HousePin[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of pins) {
    const name = streetFromAddress(p.address, p.houseNumber);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

function finishLoop(id: string, ordered: HousePin[], prev: StreetLoop | undefined): StreetLoop {
  const streets = uniqueStreets(ordered);
  const generated = autoName(streets);
  const named = Boolean(prev?.named);
  const place = named && prev?.place.trim() ? prev.place.trim() : generated;
  const years = ordered
    .map((p) => Number(p.year.trim()))
    .filter((y) => Number.isFinite(y) && y >= 1800 && y <= 2100);
  const medianYear = years.length ? Math.round(years.reduce((a, b) => a + b, 0) / years.length) : 0;
  const c = centroid(ordered);
  const zip = majority(ordered.map((p) => p.zip));
  const town = majority(ordered.map((p) => p.city));
  const state = majority(ordered.map((p) => p.state)) || prev?.state || "";
  return {
    id,
    title: place,
    zip,
    town,
    place,
    township: prev?.township ?? "",
    streets,
    county: prev?.county ?? "",
    state,
    medianYear,
    homes: ordered.length,
    lat: c.lat,
    lon: c.lng,
    status: prev?.status ?? "fresh",
    lastResult: prev?.lastResult ?? "",
    named,
  };
}

type Bucket = { id: string; pins: HousePin[] };

function preferId(a: Bucket, b: Bucket, byId: Map<string, StreetLoop>): string {
  const as = byId.get(a.id)?.status;
  const bs = byId.get(b.id)?.status;
  if (as === "working" && bs !== "working") return a.id;
  if (bs === "working" && as !== "working") return b.id;
  if (a.pins.length >= b.pins.length) return a.id;
  return b.id;
}

function isFrozen(status: StreetLoop["status"] | undefined): boolean {
  return status === "done" || status === "skip";
}

/** Assign pins to park-once walks. Frozen (done/skip) loops keep their members and do not eat new drops. */
export function clusterPins(
  pins: HousePin[],
  loops: StreetLoop[],
): { pins: HousePin[]; loops: StreetLoop[] } {
  const byId = new Map(loops.map((l) => [l.id, l]));
  const frozenIds = new Set(loops.filter((l) => isFrozen(l.status)).map((l) => l.id));

  const frozenMembers = new Map<string, HousePin[]>();
  const open: HousePin[] = [];
  for (const p of pins) {
    if (p.loopId && frozenIds.has(p.loopId)) {
      const list = frozenMembers.get(p.loopId) ?? [];
      list.push(p);
      frozenMembers.set(p.loopId, list);
    } else {
      open.push(p);
    }
  }

  const buckets: Bucket[] = [];
  const assigned = new Set<string>();
  for (const loop of loops) {
    if (frozenIds.has(loop.id)) continue;
    const members = open.filter((p) => p.loopId === loop.id);
    if (!members.length) continue;
    buckets.push({ id: loop.id, pins: members.slice() });
    for (const m of members) assigned.add(m.id);
  }

  const leftover = open.filter((p) => !assigned.has(p.id)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const pin of leftover) {
    let best: Bucket | null = null;
    let bestD = Infinity;
    for (const b of buckets) {
      if (b.pins.length >= WALK_MAX_PINS) continue;
      const d = minDistTo(pin, b.pins);
      if (d <= WALK_MAX_KM && d < bestD) {
        bestD = d;
        best = b;
      }
    }
    if (best) best.pins.push(pin);
    else buckets.push({ id: newLoopId(), pins: [pin] });
  }

  let grew = true;
  while (grew) {
    grew = false;
    outer: for (let i = 0; i < buckets.length; i++) {
      for (let j = i + 1; j < buckets.length; j++) {
        const a = buckets[i]!;
        const b = buckets[j]!;
        if (a.pins.length + b.pins.length > WALK_MAX_PINS) continue;
        if (minDistSets(a.pins, b.pins) > WALK_MAX_KM) continue;
        const keepId = preferId(a, b, byId);
        const keep = keepId === a.id ? a : b;
        const drop = keepId === a.id ? b : a;
        keep.pins.push(...drop.pins);
        keep.id = keepId;
        buckets.splice(keep === a ? j : i, 1);
        grew = true;
        break outer;
      }
    }
  }

  const outLoops: StreetLoop[] = [];
  const outPins: HousePin[] = [];

  for (const [id, members] of frozenMembers) {
    const ordered = walkingLine(members).map((p) => ({ ...p, loopId: id }));
    outLoops.push(finishLoop(id, ordered, byId.get(id)));
    outPins.push(...ordered);
  }

  for (const b of buckets) {
    const ordered = walkingLine(b.pins).map((p) => ({ ...p, loopId: b.id }));
    outLoops.push(finishLoop(b.id, ordered, byId.get(b.id)));
    outPins.push(...ordered);
  }

  const working = outLoops.filter((l) => l.status === "working");
  if (working.length > 1) {
    const keep = working[0]!.id;
    for (const l of outLoops) {
      if (l.status === "working" && l.id !== keep) l.status = "fresh";
    }
  }

  return { pins: outPins, loops: outLoops };
}
