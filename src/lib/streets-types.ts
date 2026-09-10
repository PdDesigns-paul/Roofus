export type LoopStatus = "fresh" | "working" | "done" | "skip";
export type LoopResult = "" | "no-answer" | "not-now" | "callback" | "appointment";

export type StreetLoop = {
  id: string;
  /** Cluster label (streets, small CDP, or township fallback). Old saves may still hold a zip. */
  title: string;
  zip: string;
  /** USPS city / town for that zip. Blank on old saves until they rebuild or Streets fills it. */
  town: string;
  /** Park-once name. Census streets or a small CDP — not a developer list. */
  place: string;
  /** CouSub fence. Folder, not the card. */
  township: string;
  streets: string[];
  county: string;
  state: string;
  medianYear: number;
  homes: number;
  lat: number;
  lon: number;
  status: LoopStatus;
  lastResult: LoopResult;
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
