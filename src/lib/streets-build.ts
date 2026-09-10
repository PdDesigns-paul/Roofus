/**
 * Age-band block groups, clustered into park-once loops.
 * Township is a fence. The card is 40–150 homes / a handful of streets.
 */
import { clusterSeeds, loopsFromClusters, pointInPolygon, townshipLabel, unionBbox, type ClusterSeed } from "@/lib/streets-cluster";
import { fairCountySlice, nearestZip } from "@/lib/streets-rank";
import { countyBasename, isMcdState, parseList, stateFips } from "@/lib/us-state-fips";
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
  return out.slice(0, 8);
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
  const inBand = (minHomes: number, from: number, to: number) =>
    rows.filter((r) => r.medianYear >= from && r.medianYear <= to && r.homes >= minHomes);
  let core = inBand(40, yearFrom, yearTo);
  if (core.length < 8) core = inBand(20, yearFrom, yearTo);
  if (core.length < 2) {
    const loose = rows.filter((r) => r.medianYear >= yearFrom - 8 && r.medianYear <= yearTo + 8);
    if (loose.length) core = loose;
  }
  const target = Math.round((yearFrom + yearTo) / 2);
  const scored = core.slice();
  scored.sort((a, b) => {
    const da = Math.abs(a.medianYear - target) - Math.abs(b.medianYear - target);
    if (da) return da;
    return b.homes - a.homes;
  });
  return scored.slice(0, 48);
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
      resultRecordCount: "200",
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

type PlacePoly = { name: string; id: string; rings?: number[][][]; statistical: boolean };

async function couSubsForCounty(county: CountyHit): Promise<PlacePoly[]> {
  const rows = await tigerQuery(
    "Places_CouSub_ConCity_SubMCD/MapServer/1",
    {
      where: `STATE='${county.stateFp}' AND COUNTY='${county.countyFp}'`,
      outFields: "NAME,BASENAME,GEOID,FUNCSTAT,COUSUB",
      returnGeometry: "true",
      resultRecordCount: "80",
    },
    25_000,
  );
  return rows.map((f) => {
    const basename = String(f.attributes.BASENAME ?? f.attributes.NAME ?? "").trim();
    const func = String(f.attributes.FUNCSTAT ?? "").toUpperCase();
    return {
      name: townshipLabel(basename || String(f.attributes.NAME ?? "")),
      id: String(f.attributes.GEOID ?? f.attributes.COUSUB ?? basename),
      rings: f.geometry?.rings,
      statistical: func === "S",
    };
  });
}

async function cdpsForCounty(county: CountyHit, zips: ZipMeta[]): Promise<PlacePoly[]> {
  let envelope = "";
  if (zips.length) {
    const lats = zips.map((z) => z.lat);
    const lons = zips.map((z) => z.lon);
    envelope = `${Math.min(...lons) - 0.15},${Math.min(...lats) - 0.15},${Math.max(...lons) + 0.15},${Math.max(...lats) + 0.15}`;
  }
  const params: Record<string, string> = {
    where: `STATE='${county.stateFp}'`,
    outFields: "NAME,BASENAME,GEOID",
    returnGeometry: "true",
    resultRecordCount: "80",
  };
  if (envelope) {
    params.geometry = envelope;
    params.geometryType = "esriGeometryEnvelope";
    params.inSR = "4326";
    params.spatialRel = "esriSpatialRelIntersects";
  }
  try {
    const rows = await tigerQuery("Places_CouSub_ConCity_SubMCD/MapServer/5", params, 25_000);
    return rows.map((f) => ({
      name: townshipLabel(String(f.attributes.BASENAME ?? f.attributes.NAME ?? "")),
      id: String(f.attributes.GEOID ?? ""),
      rings: f.geometry?.rings,
      statistical: false,
    }));
  } catch {
    return [];
  }
}

function hitPlace(lat: number, lon: number, places: PlacePoly[]): PlacePoly | null {
  for (const p of places) {
    if (p.rings && pointInPolygon(lon, lat, p.rings)) return p;
  }
  return null;
}

async function clusterCounty(
  county: CountyHit,
  yearFrom: number,
  yearTo: number,
): Promise<StreetLoop[]> {
  const bgs = pickBands(await blockGroups(county), yearFrom, yearTo);
  const [centers, zipList, couSubs] = await Promise.all([
    bgCenters(bgs.map((b) => b.geoid)),
    zipsForCounty(county),
    couSubsForCounty(county),
  ]);
  const zips = [...zipList];
  const cdps = await cdpsForCounty(county, zips);
  const ccdState = !isMcdState(county.stateFp);
  const seeds: ClusterSeed[] = [];

  for (const bg of bgs) {
    const c = centers.get(bg.geoid);
    if (!c) continue;
    let zip = nearestZip(c.lat, c.lon, zips);
    if (!zip) {
      const hit = await zipAt(c.lat, c.lon);
      if (hit) {
        if (!zips.some((z) => z.zip === hit.zip)) zips.push(hit);
        zip = hit.zip;
      }
    }
    const cou = hitPlace(c.lat, c.lon, couSubs);
    const cdp = hitPlace(c.lat, c.lon, cdps);
    const statistical = ccdState || Boolean(cou?.statistical);
    seeds.push({
      geoid: bg.geoid,
      homes: bg.homes,
      medianYear: bg.medianYear,
      lat: c.lat,
      lon: c.lon,
      bbox: c.bbox,
      zip,
      township: statistical ? "" : cou?.name ?? "",
      townshipId: statistical ? "_ccd" : cou?.id || "_",
      cdp: cdp?.name ?? "",
      ccd: statistical,
    });
  }

  const groups = clusterSeeds(seeds);
  const streetCache = new Map<string, string[]>();
  async function streetsFor(members: ClusterSeed[]): Promise<string[]> {
    const key = members.map((m) => m.geoid).sort().join(",");
    const hit = streetCache.get(key);
    if (hit) return hit;
    const box = unionBbox(members.map((m) => m.bbox));
    try {
      const streets = box ? await roadsIn(box) : [];
      streetCache.set(key, streets);
      return streets;
    } catch {
      streetCache.set(key, []);
      return [];
    }
  }

  const fetched = new Map<string, string[]>();
  await Promise.all(
    groups.map(async (members) => {
      const streets = await streetsFor(members);
      fetched.set(members.map((m) => m.geoid).sort().join(","), streets);
    }),
  );

  return loopsFromClusters(
    groups,
    (members) => fetched.get(members.map((m) => m.geoid).sort().join(",")) ?? [],
    { name: county.name, geoid: county.geoid, stateFp: county.stateFp },
  );
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
  const failed: string[] = [];

  for (const county of counties) {
    try {
      loops.push(...(await clusterCounty(county, yearFrom, yearTo)));
    } catch {
      failed.push(county.name);
    }
  }

  loops.sort((a, b) => {
    const target = Math.round((yearFrom + yearTo) / 2);
    const da = Math.abs(a.medianYear - target) - Math.abs(b.medianYear - target);
    if (da) return da;
    if (a.county !== b.county) return a.county.localeCompare(b.county);
    if (a.township !== b.township) return a.township.localeCompare(b.township);
    return b.homes - a.homes;
  });

  const sliced = fairCountySlice(loops, countyNames, 80, 12);
  const towns = await lookupTowns(sliced.map((l) => l.zip));
  for (const l of sliced) {
    const town = towns[l.zip];
    if (town) l.town = town;
  }

  const foundKeys = new Set(sliced.map((l) => countyBasename(l.county).toLowerCase()));
  const emptyCounties = [...new Set([...counties.map((c) => c.name), ...failed])]
    .filter((name) => !foundKeys.has(countyBasename(name).toLowerCase()));

  const noteParts = [
    `Roofs about ${ageMin}–${ageMax} years old (built ${yearFrom}–${yearTo}). Each card is a park-once loop. Township is the folder.`,
    "Streets are Census names in that pocket — not a developer list, not every house in the zip. Old zip Working does not carry over.",
    "Storms are not in this list.",
  ];
  if (missing.length) noteParts.push(`Skipped (not found): ${missing.join(", ")}.`);
  if (emptyCounties.length) {
    noteParts.push(
      `${emptyCounties.join(", ")}: found the county, no age-band loops yet. Try a wider year range.`,
    );
  }
  if (!sliced.length) {
    noteParts.push("No loops in that age band. Try a wider year range.");
  }

  return {
    loops: sliced,
    note: noteParts.join(" "),
    yearFrom,
    yearTo,
    missing,
    emptyCounties,
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
