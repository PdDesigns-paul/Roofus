/** Office mark is local. Pack `roofus` metal stays the committed file. */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BrandPack } from "./tenant/pack.ts";

export const OFFICE_MARK_STORE = "roofus-office-mark-v1";

export type OfficeMark = { markSrc: string; pwaName: string };

type OfficeMarkState = {
  byPack: Record<string, OfficeMark>;
  put: (packId: string, next: OfficeMark | null) => void;
};

function emptyMark(next: OfficeMark | null): boolean {
  if (!next) return true;
  return !next.markSrc.trim() && !next.pwaName.trim();
}

export const useOfficeMark = create<OfficeMarkState>()(
  persist(
    (set) => ({
      byPack: {},
      put: (packId, next) => {
        if (packId === "roofus") return;
        set((s) => {
          const byPack = { ...s.byPack };
          if (!next || emptyMark(next)) delete byPack[packId];
          else byPack[packId] = { markSrc: next.markSrc, pwaName: next.pwaName.trim() };
          return { byPack };
        });
      },
    }),
    {
      name: OFFICE_MARK_STORE,
      partialize: (s) => ({ byPack: s.byPack }),
    },
  ),
);

if (typeof window !== "undefined") {
  void useOfficeMark.persist.rehydrate();
}

export function readOfficeMark(packId: string): OfficeMark | null {
  if (packId === "roofus") return null;
  return useOfficeMark.getState().byPack[packId] ?? null;
}

export function writeOfficeMark(packId: string, next: OfficeMark | null): OfficeMark | null {
  useOfficeMark.getState().put(packId, next);
  return readOfficeMark(packId);
}

/** Overlay mark + PWA name. Pack tokens stay the code object. Frozen on pack `roofus`. */
export function applyOfficeMark(pack: BrandPack, override?: OfficeMark | null): BrandPack {
  if (pack.id === "roofus") return pack;
  const saved = override === undefined ? readOfficeMark(pack.id) : override;
  if (!saved) return pack;
  const pwaName = saved.pwaName.trim();
  const markSrc = saved.markSrc.trim();
  if (!pwaName && !markSrc) return pack;
  return {
    ...pack,
    markSrc: markSrc || pack.markSrc,
    productName: pwaName || pack.productName,
    pwa: { ...pack.pwa, name: pwaName || pack.pwa.name },
  };
}

export function useChromePack(p: BrandPack): BrandPack {
  const saved = useOfficeMark((s) => (p.id === "roofus" ? null : (s.byPack[p.id] ?? null)));
  return applyOfficeMark(p, saved);
}
