import type { InstantSlice } from "@/lib/instant-roofer";

export const REMEASURE_MS = 183 * 24 * 60 * 60 * 1000;
const DB_NAME = "roofus-memory";
const DB_VER = 1;

export type TapeSnapshot = {
  at: number;
  instant: InstantSlice;
  rangeLow: number | null;
  rangeHigh: number | null;
  packageUsd: number | null;
};

export type HouseArchive = {
  key: string;
  address: string;
  lat: number;
  lng: number;
  firstAt: number;
  lastAt: number;
  visits: number;
  snapshots: TapeSnapshot[];
};

export type HouseIndex = {
  key: string;
  address: string;
  lat: number;
  lng: number;
  firstAt: number;
  lastAt: number;
  lastTapeAt: number | null;
  visits: number;
  tapes: number;
  squares: number | null;
  measuredSqFt: number | null;
  wastePct: number | null;
  confidence: string | null;
  rangeLow: number | null;
  rangeHigh: number | null;
  packageUsd: number | null;
};

export type GeoHit = { lat: number; lng: number; address: string };

export type CoachRow = {
  key: string;
  question: string;
  answer: string;
  ticketId: string | null;
  at: number;
};

export function pinKey(lat: number, lng: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export function coachKey(question: string, ticketId: string | null) {
  return `${ticketId ?? ""}|${question.trim().toLowerCase()}`;
}

export function normQuery(q: string) {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

export function toIndex(h: HouseArchive): HouseIndex {
  const snap = h.snapshots[h.snapshots.length - 1];
  const ir = snap?.instant;
  return {
    key: h.key,
    address: h.address,
    lat: h.lat,
    lng: h.lng,
    firstAt: h.firstAt,
    lastAt: h.lastAt,
    lastTapeAt: snap?.at ?? null,
    visits: h.visits,
    tapes: h.snapshots.length,
    squares: ir?.squares ?? null,
    measuredSqFt: ir?.measuredSqFt ?? null,
    wastePct: ir?.wastePct ?? null,
    confidence: ir?.confidenceLabel ?? null,
    rangeLow: snap?.rangeLow ?? null,
    rangeHigh: snap?.rangeHigh ?? null,
    packageUsd: snap?.packageUsd ?? null,
  };
}

export function tapeIsFresh(at: number | null | undefined, now = Date.now()) {
  return Boolean(at && now - at < REMEASURE_MS);
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("houses")) db.createObjectStore("houses", { keyPath: "key" });
      if (!db.objectStoreNames.contains("coach")) db.createObjectStore("coach", { keyPath: "key" });
      if (!db.objectStoreNames.contains("geocodes")) db.createObjectStore("geocodes", { keyPath: "query" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function reqOf<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function memoryGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDb();
  if (!db) return undefined;
  const tx = db.transaction(store, "readonly");
  return reqOf(tx.objectStore(store).get(key)) as Promise<T | undefined>;
}

async function memoryPut(store: string, value: unknown): Promise<void> {
  const db = await openDb();
  if (!db) return;
  const tx = db.transaction(store, "readwrite");
  await reqOf(tx.objectStore(store).put(value));
}

async function memoryGetAll<T>(store: string): Promise<T[]> {
  const db = await openDb();
  if (!db) return [];
  const tx = db.transaction(store, "readonly");
  const rows = await reqOf(tx.objectStore(store).getAll());
  return (rows as T[]) ?? [];
}

export async function loadHouse(key: string) {
  return memoryGet<HouseArchive>("houses", key);
}
export async function saveHouse(house: HouseArchive) {
  await memoryPut("houses", house);
}
export async function loadAllHouses() {
  return memoryGetAll<HouseArchive>("houses");
}
export async function loadCoach(key: string) {
  return memoryGet<CoachRow>("coach", key);
}
export async function saveCoach(row: CoachRow) {
  await memoryPut("coach", row);
}
export async function loadAllCoach() {
  return memoryGetAll<CoachRow>("coach");
}
export async function loadAllGeocodes() {
  return memoryGetAll<{ query: string; hit: GeoHit }>("geocodes");
}
export async function saveGeocode(query: string, hit: GeoHit) {
  await memoryPut("geocodes", { query: normQuery(query), hit });
}