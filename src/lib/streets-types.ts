export type LoopStatus = "fresh" | "working" | "done" | "skip";
export type LoopResult = "" | "no-answer" | "not-now" | "callback" | "appointment";

export type StreetLoop = {
  id: string;
  /** Walk name. First street in the line, or what they typed. */
  title: string;
  zip: string;
  /** City from pin addresses. */
  town: string;
  /** Park-once name. */
  place: string;
  township: string;
  streets: string[];
  county: string;
  state: string;
  /** Average of typed pin years. 0 if none — do not invent Census years. */
  medianYear: number;
  homes: number;
  lat: number;
  lon: number;
  status: LoopStatus;
  lastResult: LoopResult;
  /** True once they rename the walk. Auto names stay in sync with the first street. */
  named?: boolean;
};

export type StreetsBuildRequest = {
  counties: string;
  states: string;
  ageMin?: number;
  ageMax?: number;
};

export type StreetsBuildResponse = {
  loops: StreetLoop[];
  note: string;
  yearFrom: number;
  yearTo: number;
  missing?: string[];
  emptyCounties?: string[];
};

/** Targeting band. They can still pick 15–20 or 20–30. */
export const DEFAULT_AGE_MIN = 15;
export const DEFAULT_AGE_MAX = 22;

export function isLegacyAgeDefault(ageMin: number, ageMax: number): boolean {
  return ageMin === 17 && ageMax === 25;
}

export function parseAgeDraft(raw: string, fallback: number): number {
  const t = raw.trim();
  if (!t) return fallback;
  const n = Number(t);
  return Number.isFinite(n) ? n : fallback;
}

export function clampAgeBand(ageMin: number, ageMax: number): { ageMin: number; ageMax: number } {
  const rawMin = Number.isFinite(ageMin) ? ageMin : DEFAULT_AGE_MIN;
  const rawMax = Number.isFinite(ageMax) ? ageMax : DEFAULT_AGE_MAX;
  const min = Math.min(40, Math.max(10, Math.round(rawMin)));
  const max = Math.min(45, Math.max(min, Math.round(rawMax)));
  return { ageMin: min, ageMax: max };
}
