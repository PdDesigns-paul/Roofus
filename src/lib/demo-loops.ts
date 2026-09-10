/** Sample zips. Generic canvasser. Perry is here so a rural county is not buried. */
import type { StreetLoop } from "./streets-types.ts";

export const DEMO_COUNTIES = "Dauphin, Perry, Cumberland";
export const DEMO_STATES = "PA";

function loop(p: Partial<StreetLoop> & Pick<StreetLoop, "id" | "zip" | "town" | "county" | "streets">): StreetLoop {
  return {
    title: p.zip,
    state: "42",
    medianYear: 2005,
    homes: 80,
    lat: 40.4,
    lon: -77.0,
    status: "fresh",
    lastResult: "",
    ...p,
  };
}

export const DEMO_LOOPS: StreetLoop[] = [
  loop({
    id: "demo-17112",
    zip: "17112",
    town: "Harrisburg",
    county: "Dauphin County",
    streets: ["Linglestown Rd", "Progress Ave", "Union Deposit Rd"],
    lat: 40.34,
    lon: -76.8,
    homes: 420,
  }),
  loop({
    id: "demo-17036",
    zip: "17036",
    town: "Hummelstown",
    county: "Dauphin County",
    streets: ["Main St", "Quarry Rd"],
    lat: 40.26,
    lon: -76.71,
    homes: 210,
  }),
  loop({
    id: "demo-17050",
    zip: "17050",
    town: "Mechanicsburg",
    county: "Cumberland County",
    streets: ["Trindle Rd", "Simpson Ferry Rd"],
    lat: 40.23,
    lon: -77.0,
    homes: 380,
    status: "working",
  }),
  loop({
    id: "demo-17011",
    zip: "17011",
    town: "Camp Hill",
    county: "Cumberland County",
    streets: ["Market St", "21st St"],
    lat: 40.24,
    lon: -76.92,
    homes: 300,
  }),
  loop({
    id: "demo-17068",
    zip: "17068",
    town: "New Bloomfield",
    county: "Perry County",
    streets: ["Main St", "High St", "McCabe Rd"],
    lat: 40.42,
    lon: -77.19,
    homes: 90,
  }),
  loop({
    id: "demo-17020",
    zip: "17020",
    town: "Duncannon",
    county: "Perry County",
    streets: ["Market St", "Newport Rd"],
    lat: 40.39,
    lon: -77.03,
    homes: 70,
  }),
  loop({
    id: "demo-17074",
    zip: "17074",
    town: "Newport",
    county: "Perry County",
    streets: ["Market St", "Second St"],
    lat: 40.48,
    lon: -77.13,
    homes: 60,
  }),
  loop({
    id: "demo-17053",
    zip: "17053",
    town: "Marysville",
    county: "Perry County",
    streets: ["Verbeke St", "State St"],
    lat: 40.34,
    lon: -76.93,
    homes: 85,
  }),
];

export function demoHasPerry(loops: StreetLoop[] = DEMO_LOOPS): boolean {
  return loops.some((l) => /perry/i.test(l.county));
}
