import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mergeFootprintsIntoCards, type StormFootprint } from "@/lib/storm-footprint";
import { targetYearsFromAge, type ScoutCard, type TargetYears } from "@/lib/scout-types";
import type { StreetLoop } from "@/lib/streets-types";

type ScoutState = {
  cards: Record<string, ScoutCard>;
  mergeFootprints: (
    tags: StormFootprint[],
    loops: StreetLoop[],
    target: TargetYears,
    checkedAt: string,
  ) => void;
};

export const useScout = create<ScoutState>()(
  persist(
    (set, get) => ({
      cards: {},
      mergeFootprints: (tags, loops, target, checkedAt) => {
        set({ cards: mergeFootprintsIntoCards(get().cards, tags, loops, target, checkedAt) });
      },
    }),
    {
      name: "roofus-scout-v1",
      partialize: (s) => ({ cards: s.cards }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ScoutState>;
        return {
          ...current,
          ...p,
          cards: p.cards && typeof p.cards === "object" ? p.cards : {},
        };
      },
    },
  ),
);

if (typeof window !== "undefined") {
  void useScout.persist.rehydrate();
}

export function applyPulseFootprints(
  tags: StormFootprint[],
  loops: StreetLoop[],
  ageMin: number,
  ageMax: number,
  checkedAt: string,
) {
  useScout.getState().mergeFootprints(tags, loops, targetYearsFromAge(ageMin, ageMax), checkedAt);
}
