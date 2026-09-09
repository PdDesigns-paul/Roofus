import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HouseBrief } from "@/lib/house-lookup";

type GeoHit = { lat: number; lng: number; address: string };

type HousesState = {
  hydrated: boolean;
  houses: Record<string, HouseBrief & { lastAt: number }>;
  order: string[];
  geocodes: Record<string, GeoHit>;
  upsert: (house: HouseBrief) => void;
  rememberGeocode: (query: string, hit: GeoHit) => void;
  geocodeHit: (query: string) => GeoHit | undefined;
  get: (id: string) => (HouseBrief & { lastAt: number }) | undefined;
  list: () => (HouseBrief & { lastAt: number })[];
};

function normQuery(q: string) {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

export function newHouseId() {
  return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const useHouses = create<HousesState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      houses: {},
      order: [],
      geocodes: {},
      upsert: (house) =>
        set((s) => ({
          houses: { ...s.houses, [house.id]: { ...house, lastAt: Date.now() } },
          order: [house.id, ...s.order.filter((id) => id !== house.id)].slice(0, 40),
        })),
      rememberGeocode: (query, hit) =>
        set((s) => ({ geocodes: { ...s.geocodes, [normQuery(query)]: hit } })),
      geocodeHit: (query) => get().geocodes[normQuery(query)],
      get: (id) => get().houses[id],
      list: () => get().order.map((id) => get().houses[id]).filter(Boolean),
    }),
    {
      name: "roofus-houses-v2",
      partialize: (s) => ({
        houses: s.houses,
        order: s.order,
        geocodes: s.geocodes,
      }),
      onRehydrateStorage: () => () => {
        useHouses.setState({ hydrated: true });
      },
    },
  ),
);

if (typeof window !== "undefined") {
  void useHouses.persist.rehydrate();
  useHouses.persist.onFinishHydration(() => useHouses.setState({ hydrated: true }));
  window.setTimeout(() => {
    if (!useHouses.getState().hydrated) useHouses.setState({ hydrated: true });
  }, 400);
}
