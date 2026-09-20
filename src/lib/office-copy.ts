/**
 * Office copy stores. Phone is the live book. Notion is optional.
 * A JSON file is the offline lifeboat. Same merge as Notion restore.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { localDateKey, mergeRollup, useDayBook, type DayEntry, type DayRollup } from "./day-book.ts";
import { assertRestoreAllowed } from "./book-owner.ts";
import { MAX_BACKUP_PINS, serializePin, type HousePin } from "./pins.ts";
import { mergeIncomingPins, reclusterPins, usePins } from "./pins-store.ts";
import {
  fillProfile,
  fillSurvive,
  MAX_BACKUP_STREETS,
  mergeDays,
  mergeFaqs,
  mergeLoops,
  mergeStorms,
  packMindset,
  restoreTally,
  rowsWithBody,
  unpackMindset,
} from "./notion-merge.ts";
import { useNotion, type NotionFaq } from "./notion-store.ts";
import { useSettings } from "./settings-store.ts";
import { useStreets } from "./streets-store.ts";
import type { StreetLoop } from "./streets-types.ts";
import { useSurvive } from "./survive-store.ts";
import { useWeather } from "./weather-store.ts";
import type { StormEvent } from "./weather-types.ts";
import {
  PHONE_COPY_KIND,
  PHONE_COPY_VERSION,
  copyFilename,
  stringifyPhoneCopy,
  type PhoneCopy,
} from "./phone-copy.ts";

export {
  PHONE_COPY_KIND,
  PHONE_COPY_VERSION,
  THIS_PHONE_CONFIRM,
  copyFilename,
  lastCopyAtFrom,
  lastCopyLine,
  parsePhoneCopy,
  restoreConfirmHint,
  restoreConfirmMatches,
  stringifyPhoneCopy,
  type PhoneCopy,
} from "./phone-copy.ts";

export const COPY_STORE = "roofus-copy-v1";

type CopyState = {
  lastCopyAt: string;
  markCopy: (at?: string) => void;
};

export const useOfficeCopy = create<CopyState>()(
  persist(
    (set) => ({
      lastCopyAt: "",
      markCopy: (at) => set({ lastCopyAt: at ?? new Date().toISOString() }),
    }),
    {
      name: COPY_STORE,
      partialize: (s) => ({ lastCopyAt: s.lastCopyAt }),
    },
  ),
);

if (typeof window !== "undefined") {
  void useOfficeCopy.persist.rehydrate();
}

export function markLastCopy(at = new Date().toISOString()): void {
  useOfficeCopy.getState().markCopy(at);
}

export function whenHydrated(store: {
  persist: { hasHydrated: () => boolean; onFinishHydration: (cb: () => void) => () => void };
}): Promise<void> {
  if (store.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = store.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
    window.setTimeout(resolve, 400);
  });
}

export async function whenStoresReady(): Promise<void> {
  await Promise.all([
    whenHydrated(useDayBook),
    whenHydrated(useStreets),
    whenHydrated(useWeather),
    whenHydrated(useSurvive),
    whenHydrated(useNotion),
    whenHydrated(useSettings),
    whenHydrated(usePins),
    whenHydrated(useOfficeCopy),
  ]);
}

export function collectPhoneCopy(copiedAt = new Date().toISOString()): PhoneCopy {
  const survive = useSurvive.getState();
  const profile = useDayBook.getState().profile;
  const streets = useStreets.getState();
  const settings = useSettings.getState();
  const mindRows = rowsWithBody(
    packMindset(survive, profile, {
      ageMin: streets.ageMin,
      ageMax: streets.ageMax,
      companyName: profile.company,
      warrantyLine: settings.warrantyLine,
      companyWebsite: settings.companyWebsite,
    }),
  );
  const mindset: Record<string, string> = {};
  for (const row of mindRows) mindset[row.name] = row.body;
  return {
    kind: PHONE_COPY_KIND,
    version: PHONE_COPY_VERSION,
    copiedAt,
    days: Object.values(useDayBook.getState().days),
    rollup: Object.values(useDayBook.getState().rollup),
    loops: streets.loops.slice(0, MAX_BACKUP_STREETS),
    storms: useWeather.getState().kept,
    mindset,
    faqs: useNotion.getState().faqs,
    pins: usePins.getState().pins.slice(0, MAX_BACKUP_PINS).map(serializePin),
  };
}

export function applyPhoneCopy(pulled: {
  days: DayEntry[];
  rollup?: DayRollup[];
  loops: StreetLoop[];
  storms: StormEvent[];
  mindset: Record<string, string>;
  faqs?: NotionFaq[];
  pins: HousePin[];
}): void {
  useDayBook.setState((s) => ({
    days: mergeDays(s.days, pulled.days),
    rollup: mergeRollup(s.rollup, pulled.rollup ?? []),
  }));

  if (pulled.loops.length) {
    useStreets.setState((s) => ({ loops: mergeLoops(s.loops, pulled.loops) }));
  }
  if (pulled.storms.length) {
    useWeather.setState((s) => ({ kept: mergeStorms(s.kept, pulled.storms) }));
  }
  if (pulled.pins.length) mergeIncomingPins(pulled.pins);
  else reclusterPins();

  const unpacked = unpackMindset(pulled.mindset);
  const survivePatch = fillSurvive(useSurvive.getState(), unpacked.survive);
  if (Object.keys(survivePatch).length) useSurvive.getState().patch(survivePatch);

  const nextProfile = fillProfile(useDayBook.getState().profile, unpacked.profile);
  if (unpacked.companyName && !nextProfile.company.trim()) {
    nextProfile.company = unpacked.companyName;
  }
  useDayBook.setState({ profile: nextProfile });

  if (unpacked.ageMin && unpacked.ageMax && !useStreets.getState().builtFor) {
    useStreets.getState().setAge(unpacked.ageMin, unpacked.ageMax);
  }

  const settings = useSettings.getState();
  if (unpacked.warrantyLine && settings.warrantyLine === "See the actual Owens Corning warranty.") {
    settings.setWarrantyLine(unpacked.warrantyLine);
  }
  if (unpacked.companyWebsite && !settings.companyWebsite.trim()) {
    settings.setCompanyWebsite(unpacked.companyWebsite);
  }

  if (pulled.faqs?.length) {
    useNotion.getState().setFaqs(mergeFaqs(useNotion.getState().faqs, pulled.faqs));
  }
}

export async function importPhoneCopy(copy: PhoneCopy, confirmed = false): Promise<string> {
  await whenStoresReady();
  assertRestoreAllowed(useDayBook.getState().days, confirmed, localDateKey(), usePins.getState().pins.length);
  applyPhoneCopy(copy);
  markLastCopy(copy.copiedAt || new Date().toISOString());
  const empty =
    "That file had nothing to copy onto this phone. Copy from the phone that has the day, then open the file here.";
  return restoreTally(
    {
      days: copy.days,
      loops: copy.loops,
      storms: copy.storms,
      mindset: copy.mindset,
      faqs: copy.faqs,
      pins: copy.pins,
    },
    empty,
  );
}

export function downloadPhoneCopy(copy: PhoneCopy): void {
  const blob = new Blob([stringifyPhoneCopy(copy)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = copyFilename(copy.copiedAt);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  markLastCopy(copy.copiedAt);
}
