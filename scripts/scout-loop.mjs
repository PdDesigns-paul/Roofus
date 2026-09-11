#!/usr/bin/env node
/**
 * Slice 4: sidecar loop scout. Not the phone app.
 *
 *   node --experimental-strip-types scripts/scout-loop.mjs --demo
 *
 * Open data first (IEM). Missing XAI_API_KEY is success.
 * Playwright only with --playwright when the feed is mute.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildWeatherLog } from "../src/lib/weather-build.ts";
import { DEMO_LOOPS } from "../src/lib/demo-loops.ts";
import { stormsNearLoop } from "../src/lib/weather-match.ts";
import {
  buildScoutCard,
  factsFromAdapterText,
  scoutCardMarkdown,
  shouldSkipScout,
} from "../src/lib/scout-run.ts";
import { targetYearsFromAge } from "../src/lib/scout-types.ts";
import { fetchWfoPns, scrapeWfoRecap, wfoForCounty } from "./scout-wfo-recap.mjs";

const UA = "RoofusCoach/1.0 (https://roofus.coach; sidecar scout)";
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  return process.argv[i + 1] ?? fallback;
}

function flag(name) {
  return process.argv.includes(`--${name}`);
}

function num(name, fallback) {
  const raw = arg(name, "");
  const n = Number(raw);
  return Number.isFinite(n) && raw !== "" ? n : fallback;
}

function demoLoop() {
  return DEMO_LOOPS.find((l) => /cumberland/i.test(l.county)) ?? DEMO_LOOPS[0];
}

async function xaiFacts(loop) {
  const key = process.env.XAI_API_KEY;
  if (!key) return { miss: true };
  const from = new Date();
  from.setDate(from.getDate() - 2);
  const fromDate = from.toISOString().slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);
  const prompt = `You are a storm fact checker for one roofing canvass loop. Generic — not a named company.
Last 48 hours (${fromDate} to ${toDate}).
County: ${loop.county}. State: ${loop.state}. Streets: ${loop.streets.join(", ")}. ${loop.lat},${loop.lon}.

Search web + X for hail / wind damage with a quoted size or a damage noun (tree, shingle, tarp).
Do not invent hail size. Do not name owners, phones, or parcels. No Nextdoor or Facebook.

Return ONLY JSON:
{"miss":boolean,"quotedSize":"","damageNouns":[],"sourceUrl":"","fatigue":"quiet"|"signs"|"unknown"}`;
  const res = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "grok-4.5",
      input: prompt,
      tools: [{ type: "web_search" }, { type: "x_search", from_date: fromDate, to_date: toDate }],
      max_output_tokens: 800,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) return { miss: true };
  const body = await res.json();
  let text = "";
  for (const item of body.output ?? []) {
    if (item.type !== "message") continue;
    for (const c of item.content ?? []) {
      if (c.text) text += c.text;
    }
  }
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fence ? fence[1] : text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return { miss: true };
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    const url = String(parsed.sourceUrl ?? "");
    if (/nextdoor|facebook/i.test(url)) parsed.sourceUrl = "";
    return {
      miss: Boolean(parsed.miss) && !parsed.quotedSize && !(parsed.damageNouns ?? []).length,
      quotedSize: String(parsed.quotedSize ?? "").trim() || undefined,
      damageNouns: Array.isArray(parsed.damageNouns) ? parsed.damageNouns.map(String) : [],
      sourceUrl: url || undefined,
      fatigue: parsed.fatigue === "signs" ? "signs" : "unknown",
    };
  } catch {
    return { miss: true };
  }
}

async function queryArcGis(url, lat, lon) {
  const params = new URLSearchParams({
    f: "json",
    geometry: `${lon},${lat}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    distance: "400",
    units: "esriSRUnit_Meter",
    outFields: "*",
    returnGeometry: "false",
    resultRecordCount: "25",
  });
  const join = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${join}${params.toString()}`, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return { miss: true };
  const data = await res.json();
  const features = Array.isArray(data.features) ? data.features : [];
  let n = 0;
  for (const f of features) {
    const attrs = f.attributes ?? {};
    const keys = Object.keys(attrs).filter(
      (k) => !/owner|phone|parcel|email|name|resident|apn/i.test(k),
    );
    if (keys.length) n += 1;
  }
  if (!n) return { miss: true, permits: "unknown" };
  return { miss: false, permits: n >= 8 ? "many" : "few" };
}

function toInput(raw) {
  return {
    id: raw.id,
    zip: raw.zip ?? "",
    title: raw.title ?? raw.place ?? "",
    place: raw.place ?? "",
    town: raw.town ?? "",
    township: raw.township ?? "",
    streets: raw.streets ?? [],
    county: raw.county,
    state: raw.state,
    medianYear: Number(raw.medianYear) || 0,
    lat: Number(raw.lat),
    lon: Number(raw.lon),
    status: raw.status ?? "fresh",
  };
}

async function main() {
  const useDemo = flag("demo");
  const demo = useDemo ? demoLoop() : null;
  const streetsRaw = arg("streets", demo ? demo.streets.join(",") : "");
  const loop = toInput({
    id: arg("id", demo?.id ?? ""),
    zip: arg("zip", demo?.zip ?? ""),
    place: arg("place", demo?.place ?? ""),
    town: arg("town", demo?.town ?? ""),
    township: arg("township", demo?.township ?? ""),
    streets: streetsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    county: arg("county", demo?.county ?? ""),
    state: arg("state", demo ? "PA" : ""),
    medianYear: num("median-year", demo?.medianYear ?? 0),
    lat: num("lat", demo?.lat ?? NaN),
    lon: num("lon", demo?.lon ?? NaN),
    status: arg("status", demo?.status ?? "fresh"),
  });
  if (
    !loop.id ||
    !loop.county ||
    !loop.state ||
    !Number.isFinite(loop.lat) ||
    !Number.isFinite(loop.lon)
  ) {
    process.stderr.write(
      "Need --id --county --state --lat --lon (or --demo).\nExample: node --experimental-strip-types scripts/scout-loop.mjs --demo\n",
    );
    process.exit(2);
  }

  const ageMin = num("age-min", 17);
  const ageMax = num("age-max", 25);
  const days = num("days", 2);
  const target = targetYearsFromAge(ageMin, ageMax);
  const gate = shouldSkipScout(loop, target);
  const outDir = arg("out", join(root, "artifacts", "scout"));

  let storms = [];
  let adapter = { miss: true };

  if (!gate.skip) {
    try {
      const iem = await buildWeatherLog({ counties: loop.county, states: loop.state, days });
      storms = iem.storms;
    } catch (e) {
      process.stderr.write(
        `IEM miss: ${e instanceof Error ? e.message : "unknown"}. Continuing.\n`,
      );
    }

    try {
      const news = await xaiFacts(loop);
      if (!news.miss) adapter = news;
    } catch {
      /* missing key or crawl fail = IEM-only success */
    }

    const nearby = stormsNearLoop(storms, loop);
    const mute = nearby.length === 0 && adapter.miss;
    const wfo = arg("wfo", wfoForCounty(loop.county, loop.state));

    if (mute && wfo) {
      try {
        const pns = await fetchWfoPns(wfo, factsFromAdapterText, loop.county);
        if (!pns.miss) adapter = pns;
      } catch {
        adapter = { miss: true };
      }
    }

    if (mute && adapter.miss && flag("playwright") && wfo) {
      const shot = join(outDir, `${loop.id}-wfo.png`);
      await mkdir(outDir, { recursive: true });
      adapter = await scrapeWfoRecap({
        wfo,
        county: loop.county,
        headed: flag("headed"),
        pause: flag("pause"),
        screenshot: shot,
        factsFromText: factsFromAdapterText,
      });
    }

    const arcgis = arg("arcgis", "");
    if (arcgis) {
      try {
        const gis = await queryArcGis(arcgis, loop.lat, loop.lon);
        if (!gis.miss) adapter = { ...adapter, miss: false, permits: gis.permits };
      } catch {
        /* leave permits unknown */
      }
    }
  }

  const card = buildScoutCard({ loop, target, storms, adapter });
  await mkdir(outDir, { recursive: true });
  const jsonPath = join(outDir, `${loop.id}.json`);
  const mdPath = join(outDir, `${loop.id}.md`);
  await writeFile(jsonPath, `${JSON.stringify(card, null, 2)}\n`);
  await writeFile(mdPath, scoutCardMarkdown(card));
  process.stdout.write(`${jsonPath}\n${mdPath}\n`);
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.message : e}\n`);
  process.exit(1);
});
