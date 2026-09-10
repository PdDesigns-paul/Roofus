export type LoopStatus = "fresh" | "working" | "done" | "skip";
export type LoopResult = "" | "no-answer" | "not-now" | "callback" | "appointment";

export type StreetLoop = {
  id: string;
  /** Real subdivision / neighbourhood name. Empty if the map has none. */
  title: string;
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
};
