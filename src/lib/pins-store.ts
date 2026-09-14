import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  makePin,
  mergePins,
  pinsLineForCoach,
  restorePins,
  serializePin,
  type CurbTag,
  type HousePin,
  type PinStatus,
} from "./pins.ts";

type PinsState = {
  pins: HousePin[];
  add: (input: { loopId: string; lat: number; lng: number }) => HousePin | null;
  update: (id: string, patch: Partial<Omit<HousePin, "id" | "createdAt">>) => void;
  drop: (id: string) => void;
  replace: (pins: HousePin[]) => void;
};

export const usePins = create<PinsState>()(
  persist(
    (set, get) => ({
      pins: [],
      add: (input) => {
        const loopId = input.loopId.trim();
        if (!loopId) return null;
        const pin = makePin(input);
        set({ pins: [pin, ...get().pins] });
        return pin;
      },
      update: (id, patch) =>
        set((s) => ({
          pins: s.pins.map((p) =>
            p.id === id
              ? serializePin({
                  ...p,
                  ...patch,
                  id: p.id,
                  createdAt: p.createdAt,
                  updatedAt: new Date().toISOString(),
                })
              : p,
          ),
        })),
      drop: (id) => set((s) => ({ pins: s.pins.filter((p) => p.id !== id) })),
      replace: (pins) => set({ pins: restorePins(pins) }),
    }),
    {
      name: "roofus-pins-v1",
      partialize: (s) => ({ pins: s.pins }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PinsState>;
        return { ...current, ...p, pins: restorePins(p.pins) };
      },
    },
  ),
);

if (typeof window !== "undefined") {
  void usePins.persist.rehydrate();
}

export function pinsForCoach(): string {
  return pinsLineForCoach(usePins.getState().pins);
}

export function mergeIncomingPins(incoming: HousePin[]) {
  usePins.setState((s) => ({ pins: mergePins(s.pins, incoming) }));
}

export type { CurbTag, HousePin, PinStatus };
