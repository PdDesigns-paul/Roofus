/**
 * Client-side Notion backup. Phone is source of truth.
 * Restore fills blanks and takes the higher counts — it does not wipe today.
 */
import { localDateKey, useDayBook, type DayEntry } from "@/lib/day-book";
import { assertRestoreAllowed } from "@/lib/book-owner";

import { type NotionFaq, type NotionTable } from "@/lib/notion-ids";
import { loopWorthKeeping, restoreTally } from "@/lib/notion-merge";
import { applyPhoneCopy, collectPhoneCopy, markLastCopy, whenHydrated, whenStoresReady } from "@/lib/office-copy";
import { useNotion } from "@/lib/notion-store";
import type { StreetLoop } from "@/lib/streets-types";
import { type HousePin } from "@/lib/pins";
import { usePins } from "@/lib/pins-store";
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
      pins?: HousePin[];
    };
  };
  if (!res.ok) throw new Error(data.error || "Notion missed that.");
  return data;
}

function tableItems(table: NotionTable): unknown[] {
  const copy = collectPhoneCopy();
  if (table === "days") return copy.days;
  if (table === "streets") return copy.loops;
  if (table === "storms") return copy.storms;
  if (table === "mindset") {
    return Object.entries(copy.mindset).map(([name, body]) => ({ name, body }));
  }
  if (table === "pins") return copy.pins;
  return copy.faqs;
}

const LABELS: Record<NotionTable, string> = {
  days: "days",
  streets: "streets",
  storms: "storms",
  mindset: "mindset",
  memory: "memory",
  pins: "pins",
};

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
  if (!token || !ids) throw new Error("Connect Notion in Settings first.");
  setError("");
  let liveIds = ids;
  if (!liveIds.pinsDb) {
    onProgress?.("Finding tables…");
    await connectNotion();
    const next = useNotion.getState().ids;
    if (!next?.pinsDb) throw new Error("Connect Notion in Settings first.");
    liveIds = next;
  }
  onProgress?.("Preparing…");
  await whenStoresReady();
  await postSync({ token, ids: liveIds, mode: "prepare" });
  const tables: NotionTable[] = ["days", "streets", "storms", "mindset", "memory", "pins"];
  for (const table of tables) {
    const items = tableItems(table);
    if (!items.length) continue;
    onProgress?.(`Copying ${LABELS[table]}…`);
    const indexed = await postSync({ token, ids: liveIds, mode: "index", table });
    let index = indexed.index ?? {};
    for (let i = 0; i < items.length; i += 8) {
      onProgress?.(`Copying ${LABELS[table]} ${Math.min(i + 8, items.length)} of ${items.length}…`);
      const chunk = await postSync({
        token,
        ids: liveIds,
        mode: "push",
        table,
        items: items.slice(i, i + 8),
        index,
      });
      index = chunk.index ?? index;
    }
  }
  const at = new Date().toISOString();
  markSync(at);
  markLastCopy(at);
}

export async function restoreNotion(onProgress?: Progress, confirmed = false) {
  const { token, ids, setError, markSync } = useNotion.getState();
  if (!token || !ids) throw new Error("Connect Notion in Settings first.");
  await whenHydrated(useDayBook);
  assertRestoreAllowed(useDayBook.getState().days, confirmed, localDateKey(), usePins.getState().pins.length);
  setError("");
  let liveIds = ids;
  if (!liveIds.pinsDb) {
    onProgress?.("Finding tables…");
    await connectNotion();
    const next = useNotion.getState().ids;
    if (!next?.pinsDb) throw new Error("Connect Notion in Settings first.");
    liveIds = next;
  }
  await whenStoresReady();
  onProgress?.("Restoring…");
  const data = await postSync({ token, ids: liveIds, mode: "pull" });
  if (!data.pulled) throw new Error("Restore missed.");
  const pulled = {
    ...data.pulled,
    loops: data.pulled.loops.filter(loopWorthKeeping),
    pins: data.pulled.pins ?? [],
  };
  applyPhoneCopy(pulled);
  const at = new Date().toISOString();
  markSync(at);
  markLastCopy(at);
  return restoreTally(pulled);
}
