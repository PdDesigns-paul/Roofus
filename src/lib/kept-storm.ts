/**
 * Slice 1: one kept-storm row. Home/Today show it for 48 hours.
 * Filter on read. No cron. Skip / Toss never write this row.
 */
import { pulseIsFresh } from "./weather-grade.ts";
import type { PulseGrade, PulseLead, StormEvent, StormKind } from "./weather-types.ts";

export type KeptStorm = {
  loopId: string;
  loopLabel: string;
  street: string;
  keptAt: string;
  summary: string;
  say: string;
  grade: PulseGrade | "";
  kind: StormKind | "";
  sources: string[];
};

export function keptFromLead(lead: PulseLead, at = new Date().toISOString()): KeptStorm {
  const say = lead.say.trim();
  return {
    loopId: lead.loopId,
    loopLabel: lead.loopLabel,
    street: lead.places[0]?.trim() || lead.loopLabel,
    keptAt: at,
    summary: say,
    say,
    grade: lead.grade,
    kind: lead.kind,
    sources: lead.sources,
  };
}

export function keptFromStorm(storm: StormEvent, at = new Date().toISOString()): KeptStorm {
  const say = storm.say.trim();
  return {
    loopId: "",
    loopLabel: "",
    street: storm.places[0]?.trim() || storm.county,
    keptAt: at,
    summary: say,
    say,
    grade: "",
    kind: storm.kind,
    sources: storm.source ? [storm.source] : [],
  };
}

export function sameKept(a: KeptStorm, b: KeptStorm) {
  return a.loopId === b.loopId && a.say === b.say;
}

export function upsertKept(rows: KeptStorm[], row: KeptStorm): KeptStorm[] {
  return [...rows.filter((r) => !sameKept(r, row)), row];
}

export function dropKept(rows: KeptStorm[], row: Pick<KeptStorm, "loopId" | "say">): KeptStorm[] {
  return rows.filter((r) => r.loopId !== row.loopId || r.say !== row.say);
}

/** Keep writes a row. Skip / Toss write nothing. */
export function keptAfterTap(action: "keep" | "skip" | "toss", row: KeptStorm): KeptStorm | null {
  return action === "keep" ? row : null;
}

export function isFreshKept(row: KeptStorm, hours = 48) {
  return pulseIsFresh(row.keptAt, hours);
}

export function readFreshKept(rows: KeptStorm[], hours = 48): KeptStorm[] {
  return rows.filter((r) => isFreshKept(r, hours));
}

function formatKeptTime(keptAt: string) {
  const t = Date.parse(keptAt);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** One line. Names only the storm they Kept. */
export function formatKeptSentence(row: KeptStorm): string {
  const text = row.say.trim() || row.summary.trim();
  const place = row.loopLabel.trim() || row.street.trim();
  const time = formatKeptTime(row.keptAt);
  const bits = [text, place, time].filter(Boolean);
  if (!bits.length) return "";
  return `Kept: ${bits.join(" · ")}`;
}

export function freshKeptSentence(rows: KeptStorm[], hours = 48): string {
  const fresh = readFreshKept(rows, hours);
  const row = fresh[fresh.length - 1];
  return row ? formatKeptSentence(row) : "";
}
