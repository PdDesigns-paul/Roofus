/**
 * Slice 2: age-band street loops from Census + TIGER roads.
 * Slice 7 (later): revamp UI and audit this stack so it does not ship as a Jenga tower.
 */
import { countyBasename, parseList, stateFips } from "@/lib/us-state-fips";
import type { StreetLoop, StreetsBuildRequest, StreetsBuildResponse } from "@/lib/streets-types";

const UA = "RoofusCoach/1.0 (https://roofus.coach; D2D street loops)";
const TIGER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb";
const REPORTER = "https://api.censusreporter.org/1.0/data/show/latest";
const NOMINATIM = "https://nominatim.openstreetmap.org/reverse";

const SKIP_ROAD =
  /^(i|ih|us|sr|st|pa|oh|md|nj|va|wv|ny|nc|sc|interstate|highway|hwy|route|rte|co rd|county road|cr)[-.\s]?\d/i;
const SKIP_ROAD_WORD = /\b(interstate|freeway|turnpike|ramp)\b/i;
const SKIP_SUFFIX = /\b(aly|alley)\s*$/i;

function json(res: Response, label: string) {
  if (!res.ok) throw new Error(`${label} (${res.status})`);
  return res.json();
}

async function getJson(url: string, label: string, ms = 20_000): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(ms),
  });
  return json(res, label);
}

type TigerFeature = {
  attributes: Record<string, string | number | null>;
  geometry?: { rings?: number[][][]; x?: number; y?: number };
};

async function tigerQuery(
  path: string,
  params: Record<string, string>,
  ms = 20_000,
): Promise<TigerFeature[]> {
  const qs = new URLSearchParams({ f: "json", outSR: "4326", ...params });
  const data = (await getJson(`${TIGER}/${path}/query?${qs}`, "Map", ms)) as {
    features?: TigerFeature[];
    error?: { message?: string };
  };
  if (data.error?.message) throw new Error(data.error.message);
  return data.features ?? [];
}

function bboxOf(rings: number[][][] | undefined): [number, number, number, number] | null {
  if (!rings?.[0]?.length) return null;
  let minx = 180;
  let miny = 90;
  let maxx = -180;
  let maxy = -90;
  for (const [x, y] of rings[0]) {
    if (x < minx) minx = x;
    if (y < miny) miny = y;
    if (x > maxx) maxx = x;
    if (y > maxy) maxy = y;
  }
  return [minx, miny, maxx, maxy];
}

function keepRoad(name: string): boolean {
  const n = name.trim();
  if (n.length < 3) return false;
  if (/^\d+$/.test(n)) return false;
  if (SKIP_ROAD.test(n) || SKIP_ROAD_WORD.test(n) || SKIP_SUFFIX.test(n)) return false;
  return true;
}

function uniqueStreets(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const n = raw.replace(/\s+/g, " ").trim();
    if (!keepRoad(n)) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  out.sort((a, b) => a.localeCompare(b));
  return out.slice(0, 24);
}

type CountyHit = { name: string; state: string; stateFp: string; countyFp: string; geoid: string };

async function findCounty(name: string, stateFp: string): Promise<CountyHit | null> {
  const base = countyBasename(name).replace(/'/g, "''");
  if (!base) return null;
  const where = `STATE='${stateFp}' AND (BASENAME='${base}' OR NAME='${base} County')`;
  const rows = await tigerQuery("State_County/MapServer/1", {
    where,
    outFields: "NAME,STATE,COUNTY,GEOID,BASENAME",
    returnGeometry: "false",
    resultRecordCount: "5",
  });
  const a = rows[0]?.attributes;
  if (!a?.COUNTY || !a.STATE) return null;
  return {
    name: String(a.NAME ?? `${base} County`),
    state: stateFp,
    stateFp,
    countyFp: String(a.COUNTY).padStart(3, "0"),
    geoid: String(a.GEOID ?? `${stateFp}${String(a.COUNTY).padStart(3, "0")}`),
  };
}

type BgYear = { geoid: string; medianYear: number; homes: number; name: string };

async function blockGroups(county: CountyHit): Promise<BgYear[]> {
  const geo = `150|05000US${county.geoid}`;
  const url = `${REPORTER}?table_ids=B25035,B25001&geo_ids=${encodeURIComponent(geo)}`;
  const data = (await getJson(url, "Housing years", 30_000)) as {
    data?: Record<
      string,
      { B25035?: { estimate?: { B25035001?: number } }; B25001?: { estimate?: { B25001001?: number } } }
    >;
    geography?: Record<string, { name?: string }>;
  };
  const out: BgYear[] = [];
  for (const [id, tables] of Object.entries(data.data ?? {})) {
    const year = tables.B25035?.estimate?.B25035001;
    const homes = tables.B25001?.estimate?.B25001001;
    if (!year || year < 1900 || year > 2030) continue;
    const geoid = id.replace(/^15000US/, "");
    out.push({
      geoid,
      medianYear: Math.round(year),
      homes: Math.round(homes || 0),
      name: data.geography?.[id]?.name ?? geoid,
    });
  }
  return out;
}

function pickBands(rows: BgYear[], yearFrom: number, yearTo: number): BgYear[] {
  const core = rows.filter((r) => r.medianYear >= yearFrom && r.medianYear <= yearTo && r.homes >= 120);
  const target = Math.round((yearFrom + yearTo) / 2);
  const scored = (core.length >= 8 ? core : rows.filter((r) => r.homes >= 120 && r.medianYear >= yearFrom - 5 && r.medianYear <= yearTo + 5)).slice();
  scored.sort((a, b) => {
    const da = Math.abs(a.medianYear - target) - Math.abs(b.medianYear - target);
    if (da) return da;
    return b.homes - a.homes;
  });
  return scored.slice(0, 24);
}

async function bgCenters(geoids: string[]): Promise<Map<string, { lat: number; lon: number; bbox: [number, number, number, number] }>> {
  const map = new Map<string, { lat: number; lon: number; bbox: [number, number, number, number] }>();
  if (!geoids.length) return map;
  const chunks: string[][] = [];
  for (let i = 0; i < geoids.length; i += 20) chunks.push(geoids.slice(i, i + 20));
  for (const chunk of chunks) {
    const where = `GEOID IN (${chunk.map((g) => `'${g}'`).join(",")})`;
    const rows = await tigerQuery("Tracts_Blocks/MapServer/1", {
      where,
      outFields: "GEOID,CENTLAT,CENTLON",
      returnGeometry: "true",
      resultRecordCount: String(chunk.length),
    });
    for (const f of rows) {
      const id = String(f.attributes.GEOID ?? "");
      const lat = Number(f.attributes.CENTLAT);
      const lon = Number(f.attributes.CENTLON);
      const box = bboxOf(f.geometry?.rings);
      if (!id || !box || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      map.set(id, { lat, lon, bbox: box });
    }
  }
  return map;
}

async function roadsIn(bbox: [number, number, number, number]): Promise<string[]> {
  const [minx, miny, maxx, maxy] = bbox;
  const pad = 0.002;
  const rows = await tigerQuery(
    "Transportation/MapServer/8",
    {
      where: "NAME IS NOT NULL AND (MTFCC='S1400' OR MTFCC='S1740')",
      geometry: `${minx - pad},${miny - pad},${maxx + pad},${maxy + pad}`,
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "NAME",
      returnGeometry: "false",
      resultRecordCount: "400",
    },
    18_000,
  );
  return uniqueStreets(rows.map((f) => String(f.attributes.NAME ?? "")));
}

async function placeName(lat: number, lon: number): Promise<string> {
  try {
    const qs = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      zoom: "18",
      format: "json",
      addressdetails: "1",
    });
    const data = (await getJson(`${NOMINATIM}?${qs}`, "Place name", 8_000)) as {
      address?: Record<string, string>;
    };
    const a = data.address ?? {};
    return (a.neighbourhood || a.suburb || a.quarter || a.city_district || "").trim();
  } catch {
    return "";
  }
}

function loopId(county: CountyHit, geoid: string, title: string, street: string) {
  const slug = (title || street || geoid).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  return `${county.geoid}-${geoid}-${slug}`;
}

export async function buildStreetLoops(req: StreetsBuildRequest): Promise<StreetsBuildResponse> {
  const now = new Date().getFullYear();
  const ageMin = req.ageMin && req.ageMin > 0 ? req.ageMin : 17;
  const ageMax = req.ageMax && req.ageMax >= ageMin ? req.ageMax : 25;
  const yearFrom = now - ageMax;
  const yearTo = now - ageMin;

  const countyNames = parseList(req.counties);
  const stateNames = parseList(req.states);
  const stateFps = [...new Set(stateNames.map(stateFips).filter((x): x is string => Boolean(x)))];
  if (!countyNames.length || !stateFps.length) {
    throw new Error("Need a county and a state first — fill those on Today.");
  }

  const counties: CountyHit[] = [];
  const missing: string[] = [];
  for (const c of countyNames) {
    let hit: CountyHit | null = null;
    for (const fp of stateFps) {
      hit = await findCounty(c, fp);
      if (hit) break;
    }
    if (hit) counties.push(hit);
    else missing.push(c);
  }
  if (!counties.length) {
    throw new Error(
      missing.length
        ? `Could not find ${missing.join(", ")} as a US county. Check the spelling on Today.`
        : "Could not find those counties.",
    );
  }

  const loops: StreetLoop[] = [];
  const merge = new Map<string, StreetLoop>();

  for (const county of counties) {
    const bgs = pickBands(await blockGroups(county), yearFrom, yearTo);
    const centers = await bgCenters(bgs.map((b) => b.geoid));
    const roadLists = await Promise.all(
      bgs.map(async (bg) => {
        const c = centers.get(bg.geoid);
        if (!c) return { bg, streets: [] as string[], c: null };
        const streets = await roadsIn(c.bbox);
        return { bg, streets, c };
      }),
    );

    const nominatimBudget = Date.now() + 12_000;
    for (const { bg, streets, c } of roadLists) {
      if (!c || streets.length < 2) continue;
      let title = "";
      if (Date.now() < nominatimBudget) {
        title = await placeName(c.lat, c.lon);
        await new Promise((r) => setTimeout(r, 1100));
      }
      const key = (title || bg.geoid).toLowerCase();
      const existing = merge.get(key);
      if (existing && title) {
        const set = new Set(existing.streets);
        for (const s of streets) set.add(s);
        existing.streets = uniqueStreets([...set]);
        existing.homes += bg.homes;
        continue;
      }
      const loop: StreetLoop = {
        id: loopId(county, bg.geoid, title, streets[0] ?? ""),
        title,
        streets,
        county: county.name,
        state: county.stateFp,
        medianYear: bg.medianYear,
        homes: bg.homes,
        lat: c.lat,
        lon: c.lon,
        status: "fresh",
        lastResult: "",
      };
      merge.set(key, loop);
      loops.push(loop);
    }
  }

  loops.sort((a, b) => {
    const target = Math.round((yearFrom + yearTo) / 2);
    const da = Math.abs(a.medianYear - target) - Math.abs(b.medianYear - target);
    if (da) return da;
    return b.homes - a.homes;
  });

  const noteParts = [
    `Roofs about ${ageMin}–${ageMax} years old (built ${yearFrom}–${yearTo}). Census median year, not a house-by-house assessor.`,
    "A name only if the map has a subdivision. Storms are not in this list.",
  ];
  if (missing.length) noteParts.push(`Skipped (not found): ${missing.join(", ")}.`);
  if (!loops.length) {
    noteParts.push("No street loops in that age band. Try a wider year range.");
  }

  return {
    loops: loops.slice(0, 40),
    note: noteParts.join(" "),
    yearFrom,
    yearTo,
  };
}


