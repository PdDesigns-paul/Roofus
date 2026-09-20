import { create } from "zustand";
import { persist } from "zustand/middleware";
import { walksNote } from "@/lib/pin-walks";
import {
  clampAgeBand,
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
  isLegacyAgeDefault,
  type LoopResult,
  type LoopStatus,
  type StreetLoop,
} from "@/lib/streets-types";
import { loopHeadline, mergeStatus, nextFreshInTownship } from "@/lib/streets-rank";
import { hOverrideLoop, pulseIsFresh } from "@/lib/weather-grade";
import { useWeather } from "@/lib/weather-store";
import { bookKey } from "./book-owner.ts";



export type { StreetLoop, LoopResult, LoopStatus };

type MapCenter = { lat: number; lng: number };

type StreetsState = {
  loops: StreetLoop[];
  note: string;
  yearFrom: number;
  yearTo: number;
  ageMin: number;
  ageMax: number;
  builtFor: string;
  builtAt: string;
  mapCenter: MapCenter | null;
  replace: (loops: StreetLoop[], meta: { note: string; yearFrom: number; yearTo: number; builtFor: string }) => void;
  replaceWalks: (loops: StreetLoop[]) => void;
  setAge: (ageMin: number, ageMax: number) => void;
  setStatus: (id: string, status: LoopStatus) => void;
  setResult: (id: string, lastResult: LoopResult) => void;
  rename: (id: string, place: string) => void;
  setTowns: (towns: Record<string, string>) => void;
  setMapCenter: (center: MapCenter | null) => void;
  hide: (id: string) => void;
};

export const useStreets = create<StreetsState>()(
  persist(
    (set, get) => ({
      loops: [],
      note: "",
      yearFrom: 0,
      yearTo: 0,
      ageMin: DEFAULT_AGE_MIN,
      ageMax: DEFAULT_AGE_MAX,
      builtFor: "",
      builtAt: "",
      mapCenter: null,
      replace: (loops, meta) =>
        set({
          loops: mergeStatus(loops, get().loops),
          note: meta.note,
          yearFrom: meta.yearFrom,
          yearTo: meta.yearTo,
          builtFor: meta.builtFor,
          builtAt: new Date().toISOString(),
        }),
      replaceWalks: (loops) =>
        set({
          loops,
          note: walksNote(loops),
          builtAt: new Date().toISOString(),
        }),
      setAge: (ageMin, ageMax) => {
        const next = clampAgeBand(ageMin, ageMax);
        set({ ageMin: next.ageMin, ageMax: next.ageMax });
      },
      setStatus: (id, status) =>
        set((s) => ({ loops: s.loops.map((l) => (l.id === id ? { ...l, status } : l)) })),
      setResult: (id, lastResult) =>
        set((s) => ({ loops: s.loops.map((l) => (l.id === id ? { ...l, lastResult } : l)) })),
      rename: (id, place) => {
        const title = place.trim();
        if (!title) return;
        set((s) => ({
          loops: s.loops.map((l) => (l.id === id ? { ...l, place: title, title, named: true } : l)),
        }));
      },
      setTowns: (towns) =>
        set((s) => {
          let changed = false;
          const loops = s.loops.map((l) => {
            const town = towns[l.zip];
            if (town && !(l.town ?? "").trim()) {
              changed = true;
              return { ...l, town };
            }
            return l;
          });
          return changed ? { loops } : s;
        }),
      setMapCenter: (mapCenter) => set({ mapCenter }),
      hide: (id) => set((s) => ({ loops: s.loops.filter((l) => l.id !== id) })),
    }),
    {
      name: bookKey("roofus-streets-v1"),
      version: 2,
      migrate: (persisted, from) => {
        const p = persisted as { ageMin?: number; ageMax?: number };
        if (from < 2 && isLegacyAgeDefault(Number(p.ageMin), Number(p.ageMax))) {
          return { ...p, ageMin: DEFAULT_AGE_MIN, ageMax: DEFAULT_AGE_MAX };
        }
        return p;
      },
      partialize: (s) => ({
        loops: s.loops,
        note: s.note,
        yearFrom: s.yearFrom,
        yearTo: s.yearTo,
        ageMin: s.ageMin,
        ageMax: s.ageMax,
        builtFor: s.builtFor,
        builtAt: s.builtAt,
        mapCenter: s.mapCenter,
      }),
    },
  ),
);

if (typeof window !== "undefined") {
  void useStreets.persist.rehydrate();
}

export function marketKey(counties: string, states: string, ageMin: number, ageMax: number) {
  return `${counties.trim().toLowerCase()}|${states.trim().toLowerCase()}|${ageMin}-${ageMax}`;
}

export function suggestTomorrow(loops: StreetLoop[]): StreetLoop | null {
  const pulse = useWeather.getState().pulse;
  if (pulse && pulseIsFresh(pulse.at)) {
    const h = hOverrideLoop(loops, pulse.leads);
    if (h) return h;
  }
  return nextFreshInTownship(loops);
}

export function streetsForCoach(): string {
  const { loops, note, ageMin, ageMax } = useStreets.getState();
  if (!loops.length) {
    return `# Streets\nNo walks yet. They drop pins from Today or the Plan map. Walks form from those houses. Age band filter is ${ageMin}–${ageMax} years on years they typed. Do not invent a zip, an address, or a subdivision name.`;
  }
  const lines = [
    "# Streets (park-once walks of pins they dropped. Storms are NOT why these are here.)",
    note || `Walks of marked houses. Year filter ${ageMin}–${ageMax} if they typed a year.`,
    "Pick tomorrow: a 48h High on a loop they keep jumps Working (restoration). Then Working. Then the next fresh loop. M/L do not pick the day. Do not invent an address.",
    "Near me sorts walks they already have. Empty book does not invent a zip.",
  ];
  for (const l of loops.slice(0, 24)) {
    const name = loopHeadline(l);
    const streets = l.streets.slice(0, 8).join(", ");
    const year = l.medianYear ? ` · ~${l.medianYear}` : "";
    lines.push(
      `- ${name} · ${l.homes} pin${l.homes === 1 ? "" : "s"}${year} · ${l.status}${l.lastResult ? `/${l.lastResult}` : ""} · ${streets}`,
    );
  }
  const next = suggestTomorrow(loops);
  if (next) lines.push(`Suggested tomorrow: ${loopHeadline(next)}.`);
  return lines.join("\n");
}
