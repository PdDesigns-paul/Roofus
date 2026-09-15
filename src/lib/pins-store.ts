import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clusterPins } from "./pin-cluster.ts";
import { reverseGeocode } from "./pin-geocode.ts";
import { walksNote } from "./pin-walks.ts";
import {
  makePin,
  mergePins,
  pinsLineForCoach,
  restorePins,
  serializePin,
  type CurbTag,
  type HousePin,
  type PinSource,
  type PinStatus,
} from "./pins.ts";
import { useStreets } from "./streets-store.ts";

type PinsState = {
  pins: HousePin[];
  add: (input: { lat: number; lng: number; source?: PinSource }) => HousePin | null;
  update: (id: string, patch: Partial<Omit<HousePin, "id" | "createdAt">>) => void;
  drop: (id: string) => void;
  replace: (pins: HousePin[]) => void;
};

function applyWalks(pins: HousePin[]): HousePin[] {
  const next = clusterPins(pins, useStreets.getState().loops);
  useStreets.getState().replaceWalks(next.loops);
  return next.pins;
}

export const usePins = create<PinsState>()(
  persist(
    (set, get) => ({
      pins: [],
      add: (input) => {
        const pin = makePin(input);
        const pins = applyWalks([pin, ...get().pins]);
        set({ pins });
        void reverseGeocode(pin.lat, pin.lng).then((geo) => {
          if (!geo) return;
          const cur = get().pins.find((p) => p.id === pin.id);
          if (!cur || cur.address.trim()) return;
          get().update(pin.id, geo);
        });
        return get().pins.find((p) => p.id === pin.id) ?? pin;
      },
      update: (id, patch) => {
        const raw = get().pins.map((p) =>
          p.id === id
            ? serializePin({
                ...p,
                ...patch,
                id: p.id,
                createdAt: p.createdAt,
                updatedAt: new Date().toISOString(),
              })
            : p,
        );
        const moved = patch.lat != null || patch.lng != null || patch.loopId != null;
        set({ pins: moved ? applyWalks(raw) : raw });
      },
      drop: (id) => set({ pins: applyWalks(get().pins.filter((p) => p.id !== id)) }),
      replace: (pins) => set({ pins: applyWalks(restorePins(pins)) }),
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

export function reclusterPins() {
  const next = applyWalks(usePins.getState().pins);
  usePins.setState({ pins: next });
}

if (typeof window !== "undefined") {
  void Promise.all([usePins.persist.rehydrate(), useStreets.persist.rehydrate()]).then(() => {
    const pins = usePins.getState().pins;
    const used = new Set(pins.map((p) => p.loopId).filter(Boolean));
    const loops = useStreets.getState().loops.filter((l) => used.has(l.id));
    useStreets.setState({ loops, note: walksNote(loops) });
    reclusterPins();
  });
}

export function pinsForCoach(): string {
  return pinsLineForCoach(usePins.getState().pins);
}

export function mergeIncomingPins(incoming: HousePin[]) {
  const merged = mergePins(usePins.getState().pins, incoming);
  usePins.setState({ pins: applyWalks(merged) });
}

export type { CurbTag, HousePin, PinStatus };
