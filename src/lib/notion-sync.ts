/**
 * Client-side Notion backup. Phone is source of truth.
 * Restore fills blanks and takes the higher counts — it does not wipe today.
 */
import { useDayBook, type DayEntry } from "@/lib/day-book";
import { type NotionFaq, type NotionTable } from "@/lib/notion-ids";
import {
  fillProfile,
  fillSurvive,
  MAX_BACKUP_STREETS,
  mergeDays,
  mergeFaqs,
  mergeLoops,
  mergeStorms,
  packMindset,
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
    return packMindset(s, p, {
      ageMin: streets.ageMin,
      ageMax: streets.ageMax,
      companyName: set.companyName,
      warrantyLine: set.warrantyLine,
    });
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

export async function connectNotion(onProgress?: Progress) {
  const { token, pageUrl, setIds, setError } = useNotion.getState();
  setError("");
  onProgress?.("Building tables…");
  const res = await fetch("/api/notion-setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, pageUrl }),
  });
  const data = (await res.json()) as { ids?: ReturnType<typeof useNotion.getState>["ids"]; error?: string };
  if (!res.ok || !data.ids) throw new Error(data.error || "Could not build the tables.");
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
  onProgress?.("Restoring…");
  const data = await postSync({ token, ids, mode: "pull" });
  if (!data.pulled) throw new Error("Restore missed.");
  applyRestore(data.pulled);
  setFaqs(mergeFaqs(useNotion.getState().faqs, data.pulled.faqs));
  markSync(new Date().toISOString());
}

function applyRestore(pulled: {
  days: DayEntry[];
  loops: StreetLoop[];
  storms: StormEvent[];
  mindset: Record<string, string>;
}) {
  const book = useDayBook.getState();
  useDayBook.setState({ days: mergeDays(book.days, pulled.days) });

  if (pulled.loops.length) {
    useStreets.setState({ loops: mergeLoops(useStreets.getState().loops, pulled.loops) });
  }
  if (pulled.storms.length) {
    useWeather.setState({ kept: mergeStorms(useWeather.getState().kept, pulled.storms) });
  }

  const unpacked = unpackMindset(pulled.mindset);
  const survivePatch = fillSurvive(useSurvive.getState(), unpacked.survive);
  if (Object.keys(survivePatch).length) useSurvive.getState().patch(survivePatch);

  const nextProfile = fillProfile(useDayBook.getState().profile, unpacked.profile);
  useDayBook.setState({ profile: nextProfile });

  if (
    unpacked.ageMin &&
    unpacked.ageMax &&
    !useStreets.getState().builtFor
  ) {
    useStreets.getState().setAge(unpacked.ageMin, unpacked.ageMax);
  }

  const settings = useSettings.getState();
  if (unpacked.companyName && (!settings.companyName.trim() || settings.companyName === "Roofus")) {
    settings.setCompanyName(unpacked.companyName);
  }
  if (
    unpacked.warrantyLine &&
    settings.warrantyLine === "See the actual Owens Corning warranty."
  ) {
    settings.setWarrantyLine(unpacked.warrantyLine);
  }
}
