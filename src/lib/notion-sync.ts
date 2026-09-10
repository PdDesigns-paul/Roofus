/**
 * Client-side Notion backup. Phone is source of truth.
 * Restore fills blanks and takes the higher counts — it does not wipe today.
 */
import { useDayBook, type DayEntry } from "@/lib/day-book";
import { type NotionFaq, type NotionTable } from "@/lib/notion-ids";
import {
  fillProfile,
  fillSurvive,
  loopWorthKeeping,
  MAX_BACKUP_STREETS,
  mergeDays,
  mergeFaqs,
  mergeLoops,
  mergeStorms,
  packMindset,
  restoreTally,
  rowsWithBody,
  unpackMindset,
} from "@/lib/notion-merge";
import { useNotion } from "@/lib/notion-store";
import { useSettings } from "@/lib/settings-store";
import { useStreets } from "@/lib/streets-store";
import type { StreetLoop } from "@/lib/streets-types";
import { useSurvive } from "@/lib/survive-store";
import { useWeather } from "@/lib/weather-store";
import type { StormEvent } from "@/lib/weather-types";

type Progress = (label: string) => void;

async function postSync(body: Record<string, unknown>) {
  const res = await fetch("/api/notion-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    error?: string;
    index?: Record<string, string>;
    pulled?: {
      days: DayEntry[];
      loops: StreetLoop[];
      storms: StormEvent[];
      mindset: Record<string, string>;
      faqs: NotionFaq[];
    };
  };
  if (!res.ok) throw new Error(data.error || "Notion missed that.");
  return data;
}

function tableItems(table: NotionTable): unknown[] {
  if (table === "days") return Object.values(useDayBook.getState().days);
  if (table === "streets") return useStreets.getState().loops.slice(0, MAX_BACKUP_STREETS);
  if (table === "storms") return useWeather.getState().kept;
  if (table === "mindset") {
    const s = useSurvive.getState();
    const p = useDayBook.getState().profile;
    const streets = useStreets.getState();
    const set = useSettings.getState();
    return rowsWithBody(
      packMindset(s, p, {
        ageMin: streets.ageMin,
        ageMax: streets.ageMax,
        companyName: set.companyName,
        warrantyLine: set.warrantyLine,
        companyWebsite: set.companyWebsite,
      }),
    );
  }
  return useNotion.getState().faqs;
}

const LABELS: Record<NotionTable, string> = {
  days: "days",
  streets: "streets",
  storms: "storms",
  mindset: "mindset",
  memory: "memory",
};

function whenHydrated(store: {
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

export async function connectNotion(onProgress?: Progress) {
  const { token, pageUrl, setIds, setError } = useNotion.getState();
  setError("");
  onProgress?.("Finding tables…");
  const res = await fetch("/api/notion-setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, pageUrl }),
  });
  const data = (await res.json()) as { ids?: ReturnType<typeof useNotion.getState>["ids"]; error?: string };
  if (!res.ok || !data.ids) throw new Error(data.error || "Could not find the tables.");
  setIds(data.ids);
}

export async function backupNotion(onProgress?: Progress) {
  const { token, ids, setError, markSync } = useNotion.getState();
  if (!token || !ids) throw new Error("Connect Notion in Presets first.");
  setError("");
  onProgress?.("Preparing…");
  await postSync({ token, ids, mode: "prepare" });
  const tables: NotionTable[] = ["days", "streets", "storms", "mindset", "memory"];
  for (const table of tables) {
    const items = tableItems(table);
    if (!items.length) continue;
    onProgress?.(`Copying ${LABELS[table]}…`);
    const indexed = await postSync({ token, ids, mode: "index", table });
    let index = indexed.index ?? {};
    for (let i = 0; i < items.length; i += 8) {
      onProgress?.(`Copying ${LABELS[table]} ${Math.min(i + 8, items.length)} of ${items.length}…`);
      const chunk = await postSync({
        token,
        ids,
        mode: "push",
        table,
        items: items.slice(i, i + 8),
        index,
      });
      index = chunk.index ?? index;
    }
  }
  markSync(new Date().toISOString());
}

export async function restoreNotion(onProgress?: Progress) {
  const { token, ids, setError, setFaqs, markSync } = useNotion.getState();
  if (!token || !ids) throw new Error("Connect Notion in Presets first.");
  setError("");
  await Promise.all([
    whenHydrated(useDayBook),
    whenHydrated(useStreets),
    whenHydrated(useWeather),
    whenHydrated(useSurvive),
    whenHydrated(useNotion),
    whenHydrated(useSettings),
  ]);
  onProgress?.("Restoring…");
  const data = await postSync({ token, ids, mode: "pull" });
  if (!data.pulled) throw new Error("Restore missed.");
  const pulled = {
    ...data.pulled,
    loops: data.pulled.loops.filter(loopWorthKeeping),
  };
  applyRestore(pulled);
  setFaqs(mergeFaqs(useNotion.getState().faqs, pulled.faqs));
  markSync(new Date().toISOString());
  return restoreTally(pulled);
}

function applyRestore(pulled: {
  days: DayEntry[];
  loops: StreetLoop[];
  storms: StormEvent[];
  mindset: Record<string, string>;
}) {
  useDayBook.setState((s) => ({ days: mergeDays(s.days, pulled.days) }));

  if (pulled.loops.length) {
    useStreets.setState((s) => ({ loops: mergeLoops(s.loops, pulled.loops) }));
  }
  if (pulled.storms.length) {
    useWeather.setState((s) => ({ kept: mergeStorms(s.kept, pulled.storms) }));
  }

  const unpacked = unpackMindset(pulled.mindset);
  const survivePatch = fillSurvive(useSurvive.getState(), unpacked.survive);
  if (Object.keys(survivePatch).length) useSurvive.getState().patch(survivePatch);

  const nextProfile = fillProfile(useDayBook.getState().profile, unpacked.profile);
  useDayBook.setState({ profile: nextProfile });

  if (unpacked.ageMin && unpacked.ageMax && !useStreets.getState().builtFor) {
    useStreets.getState().setAge(unpacked.ageMin, unpacked.ageMax);
  }

  const settings = useSettings.getState();
  if (unpacked.companyName && (!settings.companyName.trim() || settings.companyName === "Roofus")) {
    settings.setCompanyName(unpacked.companyName);
  }
  if (unpacked.warrantyLine && settings.warrantyLine === "See the actual Owens Corning warranty.") {
    settings.setWarrantyLine(unpacked.warrantyLine);
  }
  if (unpacked.companyWebsite && !settings.companyWebsite.trim()) {
    settings.setCompanyWebsite(unpacked.companyWebsite);
  }
}
