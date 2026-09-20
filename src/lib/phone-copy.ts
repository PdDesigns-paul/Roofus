/**
 * Pure office-copy payload. Phone is the live book.
 * Merge lives in notion-merge.ts. Stores live in office-copy.ts.
 */
import { restoreDay, restoreRollup, type DayEntry, type DayRollup } from "./day-book.ts";
import type { NotionFaq } from "./notion-ids.ts";
import { loopWorthKeeping, sanitizeLoop, sanitizeStorm } from "./notion-merge.ts";
import { restorePins, type HousePin } from "./pins.ts";
import type { StreetLoop } from "./streets-types.ts";
import type { StormEvent } from "./weather-types.ts";

export const PHONE_COPY_KIND = "roofus-phone-copy";
export const PHONE_COPY_VERSION = 1;
export const THIS_PHONE_CONFIRM = "This phone.";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type PhoneCopy = {
  kind: typeof PHONE_COPY_KIND;
  version: number;
  copiedAt: string;
  days: DayEntry[];
  rollup: DayRollup[];
  loops: StreetLoop[];
  storms: StormEvent[];
  mindset: Record<string, string>;
  faqs: NotionFaq[];
  pins: HousePin[];
};

export function lastCopyAtFrom(copyAt: string, notionAt = ""): string {
  const a = Date.parse(copyAt);
  const b = Date.parse(notionAt);
  if (Number.isFinite(a) && Number.isFinite(b)) return a >= b ? copyAt : notionAt;
  if (Number.isFinite(a)) return copyAt;
  if (Number.isFinite(b)) return notionAt;
  return "";
}

/** Status line on You. Weekday when the copy is less than a week old. */
export function lastCopyLine(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "No copy yet";
  const age = now - t;
  if (age >= 0 && age < 7 * 24 * 60 * 60 * 1000) {
    return `Last copy ${WEEKDAYS[new Date(t).getDay()]}`;
  }
  return `Last copy ${iso.slice(0, 10)}`;
}

export function restoreConfirmHint(goBy: string): string {
  const name = goBy.trim();
  return name ? `Type ${name} or This phone.` : "Type This phone.";
}

export function restoreConfirmMatches(typed: string, goBy: string): boolean {
  const t = typed.trim().replace(/\.+$/, "").toLowerCase();
  if (!t) return false;
  if (t === "this phone") return true;
  const name = goBy.trim().replace(/\.+$/, "");
  return Boolean(name) && t === name.toLowerCase();
}

export function parsePhoneCopy(raw: unknown): PhoneCopy {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      throw new Error("That is not a Roofus copy.");
    }
  }
  if (!value || typeof value !== "object") throw new Error("That is not a Roofus copy.");
  const rec = value as Record<string, unknown>;
  if (rec.kind !== PHONE_COPY_KIND) throw new Error("That is not a Roofus copy.");
  const days: DayEntry[] = [];
  if (Array.isArray(rec.days)) {
    for (const row of rec.days) {
      const date = row && typeof row === "object" && typeof (row as DayEntry).date === "string" ? (row as DayEntry).date : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      days.push(restoreDay(date, row));
    }
  }
  const loops = Array.isArray(rec.loops)
    ? rec.loops
        .filter((row): row is StreetLoop => Boolean(row && typeof row === "object" && (row as StreetLoop).id))
        .map((row) => sanitizeLoop(row))
        .filter(loopWorthKeeping)
    : [];
  const storms = Array.isArray(rec.storms)
    ? rec.storms
        .filter((row): row is StormEvent => Boolean(row && typeof row === "object" && (row as StormEvent).id))
        .map((row) => sanitizeStorm(row))
    : [];
  const mindset: Record<string, string> = {};
  if (rec.mindset && typeof rec.mindset === "object" && !Array.isArray(rec.mindset)) {
    for (const [k, v] of Object.entries(rec.mindset as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) mindset[k] = v;
    }
  }
  const faqs: NotionFaq[] = [];
  if (Array.isArray(rec.faqs)) {
    for (const row of rec.faqs) {
      if (!row || typeof row !== "object") continue;
      const f = row as Partial<NotionFaq>;
      const q = typeof f.q === "string" ? f.q.trim() : "";
      const a = typeof f.a === "string" ? f.a.trim() : "";
      if (!q || !a) continue;
      faqs.push({ id: typeof f.id === "string" && f.id.trim() ? f.id : `f_${q.slice(0, 12)}`, q, a });
    }
  }
  const copiedAt = typeof rec.copiedAt === "string" && Number.isFinite(Date.parse(rec.copiedAt)) ? rec.copiedAt : "";
  return {
    kind: PHONE_COPY_KIND,
    version: PHONE_COPY_VERSION,
    copiedAt,
    days,
    loops,
    storms,
    mindset,
    faqs,
    pins: restorePins(rec.pins),
    rollup: Object.values(restoreRollup(rec.rollup)),
  };
}

export function stringifyPhoneCopy(copy: PhoneCopy): string {
  return `${JSON.stringify(copy, null, 2)}\n`;
}

export function copyFilename(copiedAt = new Date().toISOString()): string {
  const day = copiedAt.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? `roofus-copy-${day}.json` : "roofus-copy.json";
}
