import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clusterPins } from "./pin-cluster.ts";
import { reverseGeocode } from "./pin-geocode.ts";
import { walksNote } from "./pin-walks.ts";
import {
  makePin,
  mergePins,
  openHousePin,
  pinsLineForCoach,
  restorePins,
  serializePin,
  thisHouseForCoach,
  type CurbTag,
  type HousePin,
  type PinSource,
  type PinStatus,
} from "./pins.ts";
import { useStreets } from "./streets-store.ts";
import { bookKey } from "./book-owner.ts";


type PinsState = {
  pins: HousePin[];
  openPinId: string;
  add: (input: { lat: number; lng: number; source?: PinSource }) => HousePin | null;
  update: (id: string, patch: Partial<Omit<HousePin, "id" | "createdAt">>, quiet?: boolean) => void;
  open: (id: string) => void;
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
      openPinId: "",
      add: (input) => {
        const pin = makePin(input);
        const pins = applyWalks([pin, ...get().pins]);
        set({ pins, openPinId: pin.id });
        void reverseGeocode(pin.lat, pin.lng).then((geo) => {
          if (!geo) return;
          const cur = get().pins.find((p) => p.id === pin.id);
          if (!cur || cur.address.trim()) return;
          get().update(pin.id, geo, true);
        });
        return get().pins.find((p) => p.id === pin.id) ?? pin;
      },
      update: (id, patch, quiet = false) => {
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
        set({
          pins: moved ? applyWalks(raw) : raw,
          ...(quiet ? {} : { openPinId: id }),
        });
      },
      open: (id) => set({ openPinId: id }),
      drop: (id) =>
        set((s) => ({
          pins: applyWalks(s.pins.filter((p) => p.id !== id)),
          openPinId: s.openPinId === id ? "" : s.openPinId,
        })),
      replace: (pins) => set({ pins: applyWalks(restorePins(pins)) }),
    }),
    {
      name: bookKey("roofus-pins-v1"),
      partialize: (s) => ({ pins: s.pins, openPinId: s.openPinId }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PinsState>;
        const pins = restorePins(p.pins);
        const openPinId =
          typeof p.openPinId === "string" && pins.some((pin) => pin.id === p.openPinId) ? p.openPinId : "";
        return { ...current, ...p, pins, openPinId };
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

export function thisHouse(): HousePin | undefined {
  const { pins, openPinId } = usePins.getState();
  const working = useStreets.getState().loops.find((l) => l.status === "working");
  return openHousePin(pins, openPinId, working?.id ?? "");
}

export function pinsForCoach(): string {
  return [pinsLineForCoach(usePins.getState().pins), thisHouseForCoach(thisHouse())].join("\n\n");
}

export function mergeIncomingPins(incoming: HousePin[]) {
  const merged = mergePins(usePins.getState().pins, incoming);
  usePins.setState({ pins: applyWalks(merged) });
}

export type { CurbTag, HousePin, PinStatus };
