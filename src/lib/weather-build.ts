/**
 * Slice 3: last-6-month NWS Local Storm Reports (IEM archive).
 * Slice 7 (later): revamp UI and audit this stack so it does not ship as a Jenga tower.
 */
// Relative so the sidecar CLI can reuse this without Vite `@/` aliases.
import { parseJson } from "./read-json.ts";
import { countyBasename, parseList, stateAbbr } from "./us-state-fips.ts";
import type { StormEvent, WeatherBuildRequest, WeatherBuildResponse } from "./weather-types.ts";

const UA = "RoofusCoach/1.0 (https://roofus.coach; NWS LSR weather log)";
const IEM = "https://mesonet.agron.iastate.edu/geojson/lsr.geojson";

const KEEP_TYPES = new Set([
  "HAIL",
  "TSTM WND DMG",
  "TSTM WND GST",
  "NON-TSTM WND DMG",
  "NON-TSTM WND GST",
  "THUNDERSTORM WIND DAMAGE",
  "THUNDERSTORM WIND GUST",
]);

type LsrProps = {
  typetext?: string;
  magnitude?: number | string | null;
  magf?: number | null;
  county?: string;
  state?: string;
  st?: string;
  city?: string;
  remark?: string;
  valid?: string;
  lat?: number;
  lon?: number;
  source?: string;
};

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function localDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function prettyDay(ymd: string) {
  const [y, m, day] = ymd.split("-").map(Number);
  if (!y || !m || !day) return ymd;
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function kindOf(typeText: string, mag: number): "hail" | "wind" | null {
  const t = typeText.toUpperCase();
  if (t.includes("HAIL")) return mag >= 0.75 ? "hail" : null;
  if (t.includes("WND") || t.includes("WIND")) {
    if (t.includes("GST") || t.includes("GUST")) return mag >= 58 ? "wind" : mag === 0 ? "wind" : mag >= 50 ? "wind" : null;
    return "wind";
  }
  return null;
}

function magLabel(kind: "hail" | "wind", mag: number, remark: string) {
  if (kind === "hail" && mag > 0) {
    const inches = mag >= 10 ? mag / 1 : mag; // already inches in IEM hail
    return `${inches.toFixed(inches >= 1 ? 1 : 2).replace(/\.0$/, "")} inch hail`;
  }
  if (kind === "wind" && mag >= 50) return `${Math.round(mag)} mph wind`;
  if (/tree/i.test(remark)) return "wind damage (trees)";
  return "wind damage";
}

function slug(parts: string[]) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function buildWeatherLog(req: WeatherBuildRequest): Promise<WeatherBuildResponse> {
  const countyNames = parseList(req.counties).map(countyBasename).filter(Boolean);
  const states = [...new Set(parseList(req.states).map(stateAbbr).filter((x): x is string => Boolean(x)))];
  if (!countyNames.length || !states.length) {
    throw new Error("Need a county and a state in Settings first.");
  }
  const days = req.days && req.days > 0 ? Math.min(Math.round(req.days), 200) : 183;
  const countySet = new Set(countyNames.map((c) => c.toLowerCase()));
  const sts = `${isoDaysAgo(days)}T00:00Z`;
  const ets = `${new Date().toISOString().slice(0, 10)}T23:59Z`;

  const features: { properties: LsrProps; geometry?: { coordinates?: number[] } }[] = [];
  for (const st of states) {
    const url = `${IEM}?states=${encodeURIComponent(st)}&sts=${encodeURIComponent(sts)}&ets=${encodeURIComponent(ets)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error("Storm archive missed that.");
    const data = parseJson(await res.text()) as {
      features?: { properties: LsrProps; geometry?: { coordinates?: number[] } }[];
    } | null;
    if (!data) throw new Error("Storm archive missed that.");
    features.push(...(data.features ?? []));
  }

  type Acc = {
    date: string;
    kind: "hail" | "wind";
    county: string;
    state: string;
    mag: number;
    places: Set<string>;
    remarks: string[];
    lat: number;
    lon: number;
    n: number;
  };
  const groups = new Map<string, Acc>();

  for (const f of features) {
    const p = f.properties ?? {};
    const typeText = String(p.typetext ?? "");
    if (!KEEP_TYPES.has(typeText.toUpperCase()) && !typeText.toUpperCase().includes("HAIL") && !typeText.toUpperCase().includes("WND") && !typeText.toUpperCase().includes("WIND")) {
      continue;
    }
    const county = countyBasename(String(p.county ?? ""));
    if (!countySet.has(county.toLowerCase())) continue;
    const mag = Number(p.magf ?? p.magnitude ?? 0) || 0;
    const kind = kindOf(typeText, mag);
    if (!kind) continue;
    const coords = f.geometry?.coordinates;
    const lon = Number(p.lon ?? coords?.[0]);
    const lat = Number(p.lat ?? coords?.[1]);
    const date = localDay(String(p.valid ?? ""));
    if (!date) continue;
    const state = String(p.st ?? p.state ?? states[0]).toUpperCase();
    const key = `${date}|${county}|${kind}`;
    let g = groups.get(key);
    if (!g) {
      g = { date, kind, county, state, mag, places: new Set(), remarks: [], lat, lon, n: 0 };
      groups.set(key, g);
    }
    g.n += 1;
    if (mag > g.mag) g.mag = mag;
    const city = String(p.city ?? "").trim();
    if (city) g.places.add(city);
    const remark = String(p.remark ?? "").trim();
    if (remark && g.remarks.length < 3) g.remarks.push(remark);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      g.lat = (g.lat * (g.n - 1) + lat) / g.n;
      g.lon = (g.lon * (g.n - 1) + lon) / g.n;
    }
  }

  const storms: StormEvent[] = [...groups.values()]
    .map((g) => {
      const places = [...g.places].slice(0, 4);
      const magnitude = magLabel(g.kind, g.mag, g.remarks[0] ?? "");
      const near = places.length ? ` near ${places.slice(0, 2).join(" and ")}` : "";
      const say = `${prettyDay(g.date)} — ${magnitude}${near} (${g.county} County, NWS).`;
      return {
        id: slug([g.date, g.county, g.kind, String(g.mag)]),
        date: g.date,
        kind: g.kind,
        county: g.county,
        state: g.state,
        magnitude,
        places,
        say,
        source: "NWS Local Storm Report",
        lat: g.lat,
        lon: g.lon,
        remark: g.remarks[0] ?? "",
      };
    })
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "hail" ? -1 : 1;
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    })
    .slice(0, 40);

  return {
    storms,
    note: storms.length
      ? `Last ${days < 10 ? `${days} days` : "six months"} of NWS local storm reports in ${countyNames.join(", ")}. Keep only what you will actually say. Age first — this does not pick your streets unless a 48h High lead says otherwise.`
      : `No hail or damaging wind reports in ${countyNames.join(", ")} for that window. Age and a free look. Do not invent weather.`,
  };
}

