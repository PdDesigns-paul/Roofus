/**
 * Slice 2: one pocket card for age hunt and storm hunt.
 * Celebrate / tolerate is a loop feeling, not a person score.
 * No owner names, phones, or parcel IDs.
 */
import type { StreetLoop } from "./streets-types.ts";
import type { PulseGrade, StormStatus } from "./weather-types.ts";

export type AgeBand = "celebrate" | "ok" | "tolerate" | "veto" | "unknown";
export type StormBand = PulseGrade | "quiet";
export type ScoutKeep = StormStatus;
export type ScoutLook = "original-3tab" | "mixed" | "replaced" | "unknown";
export type ScoutPermits = "few" | "many" | "unknown";
export type ScoutAccess = "public" | "gated" | "permit-unclear" | "unknown";
export type ScoutFatigue = "quiet" | "signs" | "unknown";
export type ScoutConfidence = "low" | "medium" | "high";

/** Built-year window from Settings (now − ageMax … now − ageMin). */
export type TargetYears = {
  from: number;
  to: number;
};

export type ScoutCard = {
  loopId: string;
  loopLabel: string;
  zip: string;
  censusYear: number;
  ageYears: number;
  ageBand: AgeBand;
  stormBand: StormBand;
  stormSay: string;
  keep: ScoutKeep;
  keptAt: string;
  meshMm?: number;
  lsrCount: number;
  alertHit: boolean;
  look: ScoutLook;
  permits: ScoutPermits;
  access: ScoutAccess;
  fatigue: ScoutFatigue;
  why: string;
  confidence: ScoutConfidence;
  checkedAt: string;
  sources: string[];
};

/** Same ±8 year slack Streets uses when the tight Census band is thin. */
const YEAR_SLACK = 8;
const PRE_1960 = 1960;

export function targetYearsFromAge(
  ageMin: number,
  ageMax: number,
  now = new Date().getFullYear(),
): TargetYears {
  const min = Math.min(ageMin, ageMax);
  const max = Math.max(ageMin, ageMax);
  return { from: now - max, to: now - min };
}

function hasCensusYear(year: number, now: number): boolean {
  return Number.isFinite(year) && year >= 1800 && year <= now + 2;
}

function hasTarget(target: TargetYears): boolean {
  return (
    Number.isFinite(target.from) &&
    Number.isFinite(target.to) &&
    target.from >= 1800 &&
    target.to >= target.from &&
    target.to <= 2100
  );
}

/** medianYear vs Settings years. Missing year → unknown. Do not invent years. */
export function ageBand(
  loop: Pick<StreetLoop, "medianYear">,
  targetYears: TargetYears,
  now = new Date().getFullYear(),
): AgeBand {
  const year = Math.round(loop.medianYear);
  if (!hasCensusYear(year, now) || !hasTarget(targetYears)) return "unknown";
  if (year >= targetYears.from && year <= targetYears.to) return "celebrate";
  if (year > targetYears.to) {
    return year <= targetYears.to + YEAR_SLACK ? "tolerate" : "veto";
  }
  if (year >= targetYears.from - YEAR_SLACK) return "ok";
  return year >= PRE_1960 ? "tolerate" : "veto";
}

/** Muted one-liner. Human chips still own feel. Never an auto-Skip. */
export function ageBandWhy(
  band: AgeBand,
  loop: Pick<StreetLoop, "medianYear">,
  targetYears: TargetYears,
): string {
  const year = Math.round(loop.medianYear);
  switch (band) {
    case "celebrate":
      return `Median ~${year} sits in the ${targetYears.from}–${targetYears.to} hunt.`;
    case "ok":
      return `Median ~${year} is a little older than ${targetYears.from}–${targetYears.to}.`;
    case "tolerate":
      return year > targetYears.to
        ? `Median ~${year} is newer than the hunt. Confirm on the house.`
        : `Median ~${year} is older than the ${targetYears.from}–${targetYears.to} hunt.`;
    case "veto":
      return year < PRE_1960
        ? `Median ~${year} is pre-1960 stock. First pass skips the grid.`
        : `Median ~${year} is newer than the hunt. Confirm on the house.`;
    case "unknown":
      return "";
  }
}
