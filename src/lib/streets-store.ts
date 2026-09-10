import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoopResult, LoopStatus, StreetLoop } from "@/lib/streets-types";
import { loopLabel } from "@/lib/streets-rank";
import { hOverrideLoop, pulseIsFresh } from "@/lib/weather-grade";
import { useWeather } from "@/lib/weather-store";

export type { StreetLoop, LoopResult, LoopStatus };

type StreetsState = {
  loops: StreetLoop[];
  note: string;
  yearFrom: number;
  yearTo: number;
  ageMin: number;
  ageMax: number;
  builtFor: string;
  builtAt: string;
  replace: (loops: StreetLoop[], meta: { note: string; yearFrom: number; yearTo: number; builtFor: string }) => void;
  setAge: (ageMin: number, ageMax: number) => void;
  setStatus: (id: string, status: LoopStatus) => void;
  setResult: (id: string, lastResult: LoopResult) => void;
  hide: (id: string) => void;
};

function mergeStatus(incoming: StreetLoop[], previous: StreetLoop[]): StreetLoop[] {
  const byId = new Map(previous.map((l) => [l.id, l]));
  const byZip = new Map(
    previous.filter((l) => l.zip).map((l) => [`${l.county}:${l.zip}`, l]),
  );
  const byTitle = new Map(
    previous.filter((l) => l.title).map((l) => [`${l.county}:${l.title.toLowerCase()}`, l]),
  );
  return incoming.map((l) => {
    const old =
      byId.get(l.id) ??
      (l.zip ? byZip.get(`${l.county}:${l.zip}`) : undefined) ??
      (l.title ? byTitle.get(`${l.county}:${l.title.toLowerCase()}`) : undefined);
    if (!old) return l;
    return { ...l, status: old.status, lastResult: old.lastResult };
  });
}

export const useStreets = create<StreetsState>()(
  persist(
    (set, get) => ({
      loops: [],
      note: "",
      yearFrom: 0,
      yearTo: 0,
      ageMin: 17,
      ageMax: 25,
      builtFor: "",
      builtAt: "",
      replace: (loops, meta) =>
        set({
          loops: mergeStatus(loops, get().loops),
          note: meta.note,
          yearFrom: meta.yearFrom,
          yearTo: meta.yearTo,
          builtFor: meta.builtFor,
          builtAt: new Date().toISOString(),
        }),
      setAge: (ageMin, ageMax) => {
        const min = Math.min(40, Math.max(10, Math.round(ageMin)));
        const max = Math.min(45, Math.max(min, Math.round(ageMax)));
        set({ ageMin: min, ageMax: max });
      },
      setStatus: (id, status) =>
        set((s) => ({ loops: s.loops.map((l) => (l.id === id ? { ...l, status } : l)) })),
      setResult: (id, lastResult) =>
        set((s) => ({ loops: s.loops.map((l) => (l.id === id ? { ...l, lastResult } : l)) })),
      hide: (id) => set((s) => ({ loops: s.loops.filter((l) => l.id !== id) })),
    }),
    {
      name: "roofus-streets-v1",
      partialize: (s) => ({
        loops: s.loops,
        note: s.note,
        yearFrom: s.yearFrom,
        yearTo: s.yearTo,
        ageMin: s.ageMin,
        ageMax: s.ageMax,
        builtFor: s.builtFor,
        builtAt: s.builtAt,
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
  const working = loops.filter((l) => l.status === "working");
  if (working[0]) return working[0];
  const fresh = loops.filter((l) => l.status === "fresh");
  return fresh[0] ?? null;
}

export function streetsForCoach(): string {
  const { loops, note, yearFrom, yearTo, ageMin, ageMax } = useStreets.getState();
  if (!loops.length) {
    return `# Streets\nNo zip list yet. Send them to Presets, then Streets, and build from their counties. Their age band is ${ageMin}–${ageMax} years. Age first. Do not invent a zip.`;
  }
  const lines = [
    "# Streets (age-band zips from Census, grouped by county. Storms are NOT why these are here.)",
    note || `They set roofs about ${ageMin}–${ageMax} years old (built ${yearFrom}–${yearTo}).`,
    "Pick tomorrow: a 48h High on a loop they keep jumps Working (restoration). Then Working. Then the next fresh age-band loop. M/L do not pick the day. Do not ask a newbie where to go. Do not rank the whole list by hail.",
  ];
  for (const l of loops.slice(0, 24)) {
    const name = loopLabel(l);
    const streets = l.streets.slice(0, 8).join(", ");
    lines.push(
      `- ${name} · ${l.county} · ~${l.medianYear} · ${l.status}${l.lastResult ? `/${l.lastResult}` : ""} · ${streets}`,
    );
  }
  const next = suggestTomorrow(loops);
  if (next) lines.push(`Suggested tomorrow: ${loopLabel(next)} (${next.streets.slice(0, 4).join(", ")}).`);
  return lines.join("\n");
}
