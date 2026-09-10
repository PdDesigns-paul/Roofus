/**
 * Age-band zips from Census block groups, rolled up to ZCTA.
 * Whole-zip median year is too coarse — we keep streets whose block groups
 * sit in the years they set, then show one card per zip, grouped by county.
 */
import { nearestZip } from "@/lib/streets-rank";
import { countyBasename, parseList, stateFips } from "@/lib/us-state-fips";
import type { StreetLoop, StreetsBuildRequest, StreetsBuildResponse } from "@/lib/streets-types";

const UA = "RoofusCoach/1.0 (https://roofus.coach; D2D street loops)";
const TIGER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb";
const REPORTER = "https://api.censusreporter.org/1.0/data/show/latest";

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
  const scored = (
    core.length >= 8 ? core : rows.filter((r) => r.homes >= 120 && r.medianYear >= yearFrom - 5 && r.medianYear <= yearTo + 5)
  ).slice();
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

type ZipMeta = { zip: string; lat: number; lon: number };

async function zipsForCounty(county: CountyHit): Promise<ZipMeta[]> {
  const geo = `860|05000US${county.geoid}`;
  const url = `${REPORTER}?table_ids=B25001&geo_ids=${encodeURIComponent(geo)}`;
  const data = (await getJson(url, "Zips", 30_000)) as { data?: Record<string, unknown> };
  const ids = Object.keys(data.data ?? {})
    .map((id) => id.replace(/^86000US/, ""))
    .filter((z) => /^\d{5}$/.test(z));
  if (!ids.length) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 40) chunks.push(ids.slice(i, i + 40));
  const out: ZipMeta[] = [];
  for (const chunk of chunks) {
    const where = `ZCTA5 IN (${chunk.map((z) => `'${z}'`).join(",")})`;
    const rows = await tigerQuery("PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1", {
      where,
      outFields: "ZCTA5,CENTLAT,CENTLON",
      returnGeometry: "false",
      resultRecordCount: String(chunk.length),
    });
    for (const f of rows) {
      const zip = String(f.attributes.ZCTA5 ?? "");
      const lat = Number(f.attributes.CENTLAT);
      const lon = Number(f.attributes.CENTLON);
      if (!/^\d{5}$/.test(zip) || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      out.push({ zip, lat, lon });
    }
  }
  return out;
}

async function zipAt(lat: number, lon: number): Promise<ZipMeta | null> {
  try {
    const rows = await tigerQuery(
      "PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1",
      {
        geometry: `${lon},${lat}`,
        geometryType: "esriGeometryPoint",
        inSR: "4326",
        spatialRel: "esriSpatialRelIntersects",
        outFields: "ZCTA5,CENTLAT,CENTLON",
        returnGeometry: "false",
        resultRecordCount: "1",
      },
      12_000,
    );
    const a = rows[0]?.attributes;
    const zip = String(a?.ZCTA5 ?? "");
    const zlat = Number(a?.CENTLAT);
    const zlon = Number(a?.CENTLON);
    if (!/^\d{5}$/.test(zip) || !Number.isFinite(zlat) || !Number.isFinite(zlon)) return null;
    return { zip, lat: zlat, lon: zlon };
  } catch {
    return null;
  }
}

type BgReady = { bg: BgYear; streets: string[]; lat: number; lon: number };

function rollupZips(county: CountyHit, rows: BgReady[], zips: ZipMeta[]): StreetLoop[] {
  const buckets = new Map<string, BgReady[]>();
  const extra = new Map<string, ZipMeta>();
  for (const z of zips) extra.set(z.zip, z);
  for (const row of rows) {
    const zip = nearestZip(row.lat, row.lon, zips);
    if (!zip) continue;
    const list = buckets.get(zip) ?? [];
    list.push(row);
    buckets.set(zip, list);
  }
  const loops: StreetLoop[] = [];
  for (const [zip, parts] of buckets) {
    const streets = uniqueStreets(parts.flatMap((p) => p.streets));
    if (streets.length < 2) continue;
    const homes = parts.reduce((n, p) => n + p.bg.homes, 0);
    const medianYear = Math.round(
      parts.reduce((n, p) => n + p.bg.medianYear * Math.max(1, p.bg.homes), 0) / Math.max(1, homes),
    );
    const meta = extra.get(zip);
    loops.push({
      id: `${county.geoid}-z${zip}`,
      title: zip,
      zip,
      town: "",
      streets,
      county: county.name,
      state: county.stateFp,
      medianYear,
      homes,
      lat: meta?.lat ?? parts[0]!.lat,
      lon: meta?.lon ?? parts[0]!.lon,
      status: "fresh",
      lastResult: "",
    });
  }
  return loops;
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
    throw new Error("Need a county and a state first — fill those in Presets.");
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
        ? `Could not find ${missing.join(", ")} as a US county. Check the spelling in Presets.`
        : "Could not find those counties.",
    );
  }

  const loops: StreetLoop[] = [];

  for (const county of counties) {
    const bgs = pickBands(await blockGroups(county), yearFrom, yearTo);
    const [centers, zipList] = await Promise.all([
      bgCenters(bgs.map((b) => b.geoid)),
      zipsForCounty(county),
    ]);
    const roadLists = await Promise.all(
      bgs.map(async (bg) => {
        const c = centers.get(bg.geoid);
        if (!c) return null;
        const streets = await roadsIn(c.bbox);
        return { bg, streets, lat: c.lat, lon: c.lon };
      }),
    );
    const ready: BgReady[] = [];
    const zips = [...zipList];
    for (const row of roadLists) {
      if (!row || row.streets.length < 2) continue;
      ready.push(row);
      if (!zips.length) {
        const hit = await zipAt(row.lat, row.lon);
        if (hit && !zips.some((z) => z.zip === hit.zip)) zips.push(hit);
      }
    }
    loops.push(...rollupZips(county, ready, zips));
  }

  loops.sort((a, b) => {
    const target = Math.round((yearFrom + yearTo) / 2);
    const da = Math.abs(a.medianYear - target) - Math.abs(b.medianYear - target);
    if (da) return da;
    if (a.county !== b.county) return a.county.localeCompare(b.county);
    return b.homes - a.homes;
  });

  const noteParts = [
    `Roofs about ${ageMin}–${ageMax} years old (built ${yearFrom}–${yearTo}). One card per zip, grouped by county.`,
    "Streets are the age-band pockets inside the zip — not every house in the zip. Census median year, not a house-by-house assessor.",
    "Storms are not in this list.",
  ];
  if (missing.length) noteParts.push(`Skipped (not found): ${missing.join(", ")}.`);
  if (!loops.length) {
    noteParts.push("No zips in that age band. Try a wider year range.");
  }

  const sliced = loops.slice(0, 40);
  const towns = await lookupTowns(sliced.map((l) => l.zip));
  for (const l of sliced) {
    const town = towns[l.zip];
    if (town) l.town = town;
  }

  return {
    loops: sliced,
    note: noteParts.join(" "),
    yearFrom,
    yearTo,
  };
}

export async function lookupTowns(zips: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(zips.filter((z) => /^\d{5}$/.test(z)))].slice(0, 80);
  const out: Record<string, string> = {};
  for (let i = 0; i < unique.length; i += 8) {
    const chunk = unique.slice(i, i + 8);
    await Promise.all(
      chunk.map(async (zip) => {
        try {
          const data = (await getJson(`https://api.zippopotam.us/us/${zip}`, "Town", 8_000)) as {
            places?: { "place name"?: string }[];
          };
          const name = String(data.places?.[0]?.["place name"] ?? "").trim();
          if (name) out[zip] = name;
        } catch {
          /* leave blank — zip still shows */
        }
      }),
    );
  }
  return out;
}
