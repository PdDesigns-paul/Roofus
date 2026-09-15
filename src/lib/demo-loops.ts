/** Sample park-once loops. Generic canvasser. Pins first — walks form from these houses. */
import { makePin, type HousePin } from "./pins.ts";
import type { StreetLoop } from "./streets-types.ts";

export const DEMO_COUNTIES = "Dauphin, Perry, Cumberland";
export const DEMO_STATES = "PA";

function loop(
  p: Partial<StreetLoop> & Pick<StreetLoop, "id" | "zip" | "town" | "county" | "streets" | "place" | "township">,
): StreetLoop {
  return {
    title: p.place,
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

/** Leftover Census cards — tests and restore still read this shape. Sample day uses DEMO_PINS. */
export const DEMO_LOOPS: StreetLoop[] = [
  loop({
    id: "demo-17112-a",
    zip: "17112",
    town: "Harrisburg",
    place: "Union Deposit Rd / Progress Ave",
    township: "Lower Paxton",
    county: "Dauphin County",
    streets: ["Union Deposit Rd", "Progress Ave", "Nyes Rd"],
    lat: 40.34,
    lon: -76.8,
    homes: 90,
  }),
  loop({
    id: "demo-17112-b",
    zip: "17112",
    town: "Harrisburg",
    place: "Mountain Rd / Linglestown Rd",
    township: "Lower Paxton",
    county: "Dauphin County",
    streets: ["Mountain Rd", "Linglestown Rd"],
    lat: 40.36,
    lon: -76.79,
    homes: 70,
  }),
  loop({
    id: "demo-17036-a",
    zip: "17036",
    town: "Hummelstown",
    place: "Main St / Quarry Rd",
    township: "Derry",
    county: "Dauphin County",
    streets: ["Main St", "Quarry Rd"],
    lat: 40.26,
    lon: -76.71,
    homes: 85,
  }),
  loop({
    id: "demo-17050-a",
    zip: "17050",
    town: "Mechanicsburg",
    place: "Creekview Dr / Mill Rd",
    township: "Hampden",
    county: "Cumberland County",
    streets: ["Creekview Dr", "Mill Rd", "Ridge Ave"],
    lat: 40.23,
    lon: -77.0,
    homes: 88,
    status: "working",
  }),
  loop({
    id: "demo-17050-b",
    zip: "17050",
    town: "Mechanicsburg",
    place: "Trindle Rd / Lambs Gap Rd",
    township: "Hampden",
    county: "Cumberland County",
    streets: ["Trindle Rd", "Lambs Gap Rd"],
    lat: 40.24,
    lon: -77.02,
    homes: 95,
  }),
  loop({
    id: "demo-17011-a",
    zip: "17011",
    town: "Camp Hill",
    place: "Market St / 21st St",
    township: "Camp Hill",
    county: "Cumberland County",
    streets: ["Market St", "21st St"],
    lat: 40.24,
    lon: -76.92,
    homes: 75,
  }),
  loop({
    id: "demo-17068-a",
    zip: "17068",
    town: "New Bloomfield",
    place: "Main St / High St",
    township: "Bloomfield",
    county: "Perry County",
    streets: ["Main St", "High St", "McCabe Rd"],
    lat: 40.42,
    lon: -77.19,
    homes: 55,
  }),
  loop({
    id: "demo-17020-a",
    zip: "17020",
    town: "Duncannon",
    place: "Wheatfield",
    township: "Wheatfield",
    county: "Perry County",
    streets: ["Market St", "Newport Rd"],
    lat: 40.39,
    lon: -77.03,
    homes: 40,
  }),
  loop({
    id: "demo-17074-a",
    zip: "17074",
    town: "Newport",
    place: "Market St / Second St",
    township: "Newport",
    county: "Perry County",
    streets: ["Market St", "Second St"],
    lat: 40.48,
    lon: -77.13,
    homes: 45,
  }),
  loop({
    id: "demo-17053-a",
    zip: "17053",
    town: "Marysville",
    place: "Verbeke St / State St",
    township: "Marysville",
    county: "Perry County",
    streets: ["Verbeke St", "State St"],
    lat: 40.34,
    lon: -76.93,
    homes: 50,
  }),
];

function pin(input: Parameters<typeof makePin>[0] & { status?: HousePin["status"] }): HousePin {
  return makePin(input);
}

/** Nearby pins on a street join. Far towns stay their own walk. */
export const DEMO_PINS: HousePin[] = [
  pin({
    lat: 40.23,
    lng: -77.0,
    address: "12 Creekview Dr",
    houseNumber: "12",
    city: "Mechanicsburg",
    state: "PA",
    zip: "17050",
    year: "2006",
    status: "set",
  }),
  pin({
    lat: 40.2308,
    lng: -77.0004,
    address: "18 Creekview Dr",
    houseNumber: "18",
    city: "Mechanicsburg",
    state: "PA",
    zip: "17050",
    year: "2005",
  }),
  pin({
    lat: 40.2314,
    lng: -76.9996,
    address: "9 Mill Rd",
    houseNumber: "9",
    city: "Mechanicsburg",
    state: "PA",
    zip: "17050",
    year: "2004",
    status: "revisit",
    note: "Come back Saturday",
  }),
  pin({
    lat: 40.24,
    lng: -76.92,
    address: "21 Market St",
    houseNumber: "21",
    city: "Camp Hill",
    state: "PA",
    zip: "17011",
    year: "2008",
    source: "desk",
  }),
  pin({
    lat: 40.2406,
    lng: -76.9205,
    address: "33 Market St",
    houseNumber: "33",
    city: "Camp Hill",
    state: "PA",
    zip: "17011",
  }),
  pin({
    lat: 40.42,
    lng: -77.19,
    address: "8 Main St",
    houseNumber: "8",
    city: "New Bloomfield",
    state: "PA",
    zip: "17068",
    year: "2003",
  }),
  pin({
    lat: 40.4205,
    lng: -77.1904,
    address: "14 High St",
    houseNumber: "14",
    city: "New Bloomfield",
    state: "PA",
    zip: "17068",
  }),
  pin({
    lat: 40.34,
    lng: -76.8,
    address: "40 Union Deposit Rd",
    houseNumber: "40",
    city: "Harrisburg",
    state: "PA",
    zip: "17112",
    year: "2007",
    source: "desk",
  }),
];

export function demoCountiesPresent(loops: StreetLoop[] = DEMO_LOOPS): boolean {
  const want = DEMO_COUNTIES.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const have = new Set(loops.map((l) => l.county.toLowerCase()));
  return want.every((name) => [...have].some((c) => c.includes(name)));
}
