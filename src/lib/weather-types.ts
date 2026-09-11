export type StormKind = "hail" | "wind";
export type StormStatus = "pending" | "kept" | "tossed";
export type PulseGrade = "H" | "M" | "L";

export type StormEvent = {
  id: string;
  date: string;
  kind: StormKind;
  county: string;
  state: string;
  magnitude: string;
  places: string[];
  say: string;
  source: string;
  lat: number;
  lon: number;
  remark: string;
};

export type PulseLead = {
  id: string;
  grade: PulseGrade;
  kind: StormKind;
  date: string;
  county: string;
  state: string;
  places: string[];
  say: string;
  why: string;
  sources: string[];
  loopId: string;
  loopLabel: string;
  lat: number;
  lon: number;
  remark: string;
};

export type PulseFootprint = {
  loopId: string;
  lsrCount: number;
  alertHit: boolean;
  meshMm?: number;
  stormBand: PulseGrade | "quiet";
  stormSay: string;
  sources: string[];
};

export type PulseReport = {
  quiet: boolean;
  summary: string;
  leads: PulseLead[];
  crawled: boolean;
  at: string;
  fetchedFor: string;
  footprints?: PulseFootprint[];
};

export type WeatherBuildRequest = {
  counties: string;
  states: string;
  days?: number;
};

export type WeatherBuildResponse = {
  storms: StormEvent[];
  note: string;
};

export type WeatherPulseRequest = {
  counties: string;
  states: string;
  loops: {
    id: string;
    title: string;
    zip?: string;
    streets: string[];
    county: string;
    lat: number;
    lon: number;
    status: string;
  }[];
};

export type WeatherPulseResponse = PulseReport;
