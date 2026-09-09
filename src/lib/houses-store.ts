import { create } from "zustand";
import type { InstantSlice } from "@/lib/instant-roofer";
import {
  loadAllGeocodes,
  loadAllHouses,
  loadHouse,
  normQuery,
  pinKey,
  saveGeocode,
  saveHouse,
  tapeIsFresh,
  toIndex,
  type GeoHit,
  type HouseArchive,
  type HouseIndex,
  type TapeSnapshot,
} from "@/lib/memory";

type HousesState = {
  hydrated: boolean;
  houses: Record<string, HouseIndex>;
  geocodes: Record<string, GeoHit>;
  hydrate: () => Promise<void>;
  rememberTape: (input: {
    address: string;
    lat: number;
    lng: number;
    instant: InstantSlice | null;
    rangeLow: number | null;
    rangeHigh: number | null;
    packageUsd: number | null;
    taped: boolean;
  }) => Promise<void>;
  rememberGeocode: (query: string, hit: GeoHit) => void;
  findNear: (lat: number, lng: number) => HouseIndex | undefined;
  freshTape: (lat: number, lng: number) => Promise<InstantSlice | null>;
  geocodeHit: (query: string) => GeoHit | undefined;
  list: () => HouseIndex[];
};

function emptyArchive(input: {
  key: string;
  address: string;
  lat: number;
  lng: number;
  now: number;
}): HouseArchive {
  return {
    key: input.key,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    firstAt: input.now,
    lastAt: input.now,
    visits: 0,
    snapshots: [],
  };
}

export const useHouses = create<HousesState>()((set, get) => ({
  hydrated: false,
  houses: {},
  geocodes: {},
  hydrate: async () => {
    const rows = await loadAllHouses();
    const houses: Record<string, HouseIndex> = {};
    for (const row of rows) houses[row.key] = toIndex(row);
    const geos = await loadAllGeocodes();
    const geocodes: Record<string, GeoHit> = {};
    for (const row of geos) geocodes[row.query] = row.hit;
    set({ houses, geocodes, hydrated: true });
  },
  rememberTape: async (input) => {
    const key = pinKey(input.lat, input.lng);
    const now = Date.now();
    const prev =
      (await loadHouse(key)) ??
      emptyArchive({ key, address: input.address, lat: input.lat, lng: input.lng, now });
    const snapshots = [...prev.snapshots];
    if (input.taped && input.instant) {
      const snap: TapeSnapshot = {
        at: now,
        instant: input.instant,
        rangeLow: input.rangeLow,
        rangeHigh: input.rangeHigh,
        packageUsd: input.packageUsd,
      };
      snapshots.push(snap);
    }
    const archive: HouseArchive = {
      ...prev,
      address: input.address || prev.address,
      lat: input.lat,
      lng: input.lng,
      lastAt: now,
      visits: prev.visits + 1,
      snapshots,
    };
    await saveHouse(archive);
    set((s) => ({ houses: { ...s.houses, [key]: toIndex(archive) } }));
  },
  rememberGeocode: (query, hit) => {
    void saveGeocode(query, hit);
    set((s) => ({ geocodes: { ...s.geocodes, [normQuery(query)]: hit } }));
  },
  findNear: (lat, lng) => get().houses[pinKey(lat, lng)],
  freshTape: async (lat, lng) => {
    const house = await loadHouse(pinKey(lat, lng));
    const snap = house?.snapshots[house.snapshots.length - 1];
    if (!snap || !tapeIsFresh(snap.at)) return null;
    return snap.instant;
  },
  geocodeHit: (query) => get().geocodes[normQuery(query)],
  list: () => Object.values(get().houses).sort((a, b) => b.lastAt - a.lastAt),
}));

export function exportHousesCsv(rows: HouseIndex[]) {
  const header = [
    "address",
    "lat",
    "lng",
    "first",
    "last_visit",
    "last_tape",
    "visits",
    "tapes",
    "squares",
    "range_low",
    "range_high",
    "package",
    "confidence",
  ];
  const lines = [
    header.join(","),
    ...rows.map((h) =>
      [
        csv(h.address),
        h.lat.toFixed(6),
        h.lng.toFixed(6),
        iso(h.firstAt),
        iso(h.lastAt),
        h.lastTapeAt ? iso(h.lastTapeAt) : "",
        h.visits,
        h.tapes,
        h.squares ?? "",
        h.rangeLow ?? "",
        h.rangeHigh ?? "",
        h.packageUsd ?? "",
        csv(h.confidence ?? ""),
      ].join(","),
    ),
  ];
  return lines.join("\n");
}

function iso(n: number) {
  return new Date(n).toISOString().slice(0, 10);
}
function csv(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

if (typeof window !== "undefined") {
  void useHouses.getState().hydrate();
}