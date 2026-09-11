/**
 * Slice 4: sidecar scout card builder. Open data in, one pocket card out.
 * The CLI lives in scripts/ — routes must not import that file.
 */
import {
  ageBand,
  ageBandWhy,
  type ScoutAccess,
  type ScoutCard,
  type ScoutFatigue,
  type ScoutLook,
  type ScoutPermits,
  type StormBand,
  type TargetYears,
} from "./scout-types.ts";
import { loopLabel } from "./streets-rank.ts";
import type { StreetLoop } from "./streets-types.ts";
import { gradeStormAgainstLoops } from "./weather-grade.ts";
import { stormsNearLoop } from "./weather-match.ts";
import type { PulseGrade, StormEvent } from "./weather-types.ts";

export type ScoutLoopInput = {
  id: string;
  zip?: string;
  title?: string;
  place?: string;
  town?: string;
  township?: string;
  streets: string[];
  county: string;
  state: string;
  medianYear: number;
  lat: number;
  lon: number;
  status: string;
};

export type AdapterFacts = {
  miss: boolean;
  quotedSize?: string;
  damageNouns?: string[];
  places?: string[];
  sourceUrl?: string;
  fatigue?: ScoutFatigue;
  look?: ScoutLook;
  permits?: ScoutPermits;
  access?: ScoutAccess;
};

const GRADE_RANK: Record<PulseGrade, number> = { H: 3, M: 2, L: 1 };
const PII_KEY = /owner|phone|parcel|email|resident|apn/i;
const PHONE = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const SOCIAL = /\bhttps?:\/\/(?:www\.)?(?:nextdoor|facebook|fb)\.com\S*/gi;
const PARCEL = /\b(?:parcel|apn|pid)\s*[:#]?\s*[A-Z0-9-]+\b/gi;
const OWNER_LINE = /\b(?:owner|resident)\s*[:#-]?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/gi;
/** Word-boundary nouns. `tree` must not match street; `wire` must not match wireless. */
const DAMAGE_NOUNS: [string, RegExp][] = [
  ["tree", /\btrees?\b/i],
  ["shingle", /\bshingles?\b/i],
  ["siding", /\bsiding\b/i],
  ["gutter", /\bgutters?\b/i],
  ["window", /\bwindows?\b/i],
  ["vehicle", /\bvehicles?\b/i],
  ["wire", /\bwires?\b/i],
  ["tarp", /\btarps?\b/i],
];

export function isSkipStatus(status: string): boolean {
  const s = status.trim().toLowerCase();
  return s === "skip" || s === "hostile";
}

export function shouldSkipScout(
  loop: Pick<ScoutLoopInput, "status" | "medianYear">,
  target: TargetYears,
  now = new Date().getFullYear(),
): { skip: boolean; reason: string } {
  if (isSkipStatus(loop.status)) {
    return { skip: true, reason: "Skip / Hostile. Sidecar does not scrape." };
  }
  if (ageBand({ medianYear: loop.medianYear }, target, now) === "veto") {
    return { skip: true, reason: "Age veto. Sidecar does not scrape." };
  }
  return { skip: false, reason: "" };
}

export function stripPii(text: string): string {
  return text
    .replace(OWNER_LINE, "")
    .replace(PARCEL, "")
    .replace(PHONE, "")
    .replace(EMAIL, "")
    .replace(SOCIAL, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Quoted size only. Empty string if they did not write a number or a coin/ball name. */
export function parseQuotedSize(text: string): string {
  const t = stripPii(text);
  const inch = t.match(/(\d+(?:\.\d+)?)\s*(?:inch(?:es)?|in)\b/i);
  if (inch) return `${inch[1]} inch`;
  const named = t.match(
    /\b(pea|marble|dime|nickel|quarter|golf[\s-]?ball|ping[\s-]?pong|walnut|baseball|grapefruit|tennis[\s-]?ball)(?:[\s-]*size)?\b/i,
  );
  if (named) return named[1].toLowerCase().replace(/\s+/g, " ");
  return "";
}

export function parseDamageNouns(text: string): string[] {
  const t = stripPii(text);
  return DAMAGE_NOUNS.filter(([, re]) => re.test(t)).map(([noun]) => noun);
}

/** True when the recap actually names this county. McKean is not Cumberland. */
export function textNamesCounty(text: string, county: string): boolean {
  const name = county.replace(/\s+county$/i, "").trim();
  if (!name) return false;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

export function factsFromAdapterText(text: string, sourceUrl = ""): AdapterFacts {
  if (/<html[\s>]|GoogleAnalyticsObject/i.test(text)) return { miss: true };
  const clean = stripPii(text);
  if (!clean) return { miss: true };
  const quotedSize = parseQuotedSize(clean);
  const damageNouns = parseDamageNouns(clean);
  if (!quotedSize && !damageNouns.length) return { miss: true };
  const url = sourceUrl && !/nextdoor|facebook/i.test(sourceUrl) ? sourceUrl : "";
  return {
    miss: false,
    quotedSize: quotedSize || undefined,
    damageNouns,
    sourceUrl: url || undefined,
    fatigue: /\btarps?\b|\broofing signs?\b|\bcontractor signs?\b/i.test(clean) ? "signs" : "unknown",
  };
}

function asGradeLoop(loop: ScoutLoopInput): StreetLoop {
  return {
    id: loop.id,
    title: loop.title ?? loop.place ?? "",
    zip: loop.zip ?? "",
    town: loop.town ?? "",
    place: loop.place ?? "",
    township: loop.township ?? "",
    streets: loop.streets,
    county: loop.county,
    state: loop.state,
    medianYear: loop.medianYear,
    homes: 0,
    lat: loop.lat,
    lon: loop.lon,
    status: "fresh",
    lastResult: "",
  };
}

export function stormBandFromStorms(loop: ScoutLoopInput, storms: StormEvent[]): StormBand {
  const nearby = stormsNearLoop(storms, loop);
  if (!nearby.length) return "quiet";
  const gradeLoop = asGradeLoop(loop);
  let best: StormBand = "L";
  for (const storm of nearby) {
    const grade = gradeStormAgainstLoops(storm, [gradeLoop]).grade;
    if (grade === "H") return "H";
    if ((GRADE_RANK[grade] ?? 0) > (GRADE_RANK[best as PulseGrade] ?? 0)) best = grade;
  }
  return best;
}

function pickStormSay(loop: ScoutLoopInput, storms: StormEvent[], adapter?: AdapterFacts): string {
  const nearby = stormsNearLoop(storms, loop);
  for (const storm of nearby) {
    const say = storm.say.trim();
    if (say) return say;
  }
  const quoted = adapter && !adapter.miss ? (adapter.quotedSize?.trim() ?? "") : "";
  return quoted;
}

export function buildScoutCard(opts: {
  loop: ScoutLoopInput;
  target: TargetYears;
  storms?: StormEvent[];
  adapter?: AdapterFacts;
  alertHit?: boolean;
  now?: number;
  checkedAt?: string;
}): ScoutCard {
  const now = opts.now ?? new Date().getFullYear();
  const checkedAt = opts.checkedAt ?? new Date().toISOString();
  const storms = opts.storms ?? [];
  const adapter = opts.adapter ?? { miss: true };
  const gate = shouldSkipScout(opts.loop, opts.target, now);
  const liveStorms = gate.skip ? [] : storms;
  const nearby = stormsNearLoop(liveStorms, opts.loop);
  const year = Math.round(opts.loop.medianYear);
  const band = ageBand({ medianYear: opts.loop.medianYear }, opts.target, now);
  const stormBand = gate.skip ? "quiet" : stormBandFromStorms(opts.loop, liveStorms);
  const stormSay = gate.skip ? "" : pickStormSay(opts.loop, liveStorms, adapter);
  const sources: string[] = [];
  for (const storm of nearby) {
    if (storm.source.trim()) sources.push(storm.source.trim());
  }
  if (!adapter.miss && adapter.sourceUrl) sources.push(adapter.sourceUrl);
  const why = [
    ageBandWhy(band, { medianYear: opts.loop.medianYear }, opts.target),
    gate.reason,
    nearby.length
      ? `${nearby.length} NWS LSR pin${nearby.length === 1 ? "" : "s"} within ~10 miles.`
      : "",
    !adapter.miss && adapter.damageNouns?.length
      ? `Damage nouns: ${adapter.damageNouns.join(", ")}.`
      : "",
    adapter.miss && !gate.skip && !nearby.length
      ? "Adapter miss. Unknown — not a guessed year or hail size."
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  let confidence: ScoutCard["confidence"] = "low";
  if (nearby.length && !adapter.miss) confidence = "high";
  else if (nearby.length) confidence = "medium";

  const card: ScoutCard = {
    loopId: opts.loop.id,
    loopLabel: loopLabel(opts.loop),
    zip: opts.loop.zip ?? "",
    censusYear: year >= 1800 && year <= now + 2 ? year : 0,
    ageYears: year >= 1800 && year <= now + 2 ? now - year : 0,
    ageBand: band,
    stormBand,
    stormSay,
    keep: "pending",
    keptAt: "",
    lsrCount: nearby.length,
    alertHit: Boolean(opts.alertHit),
    look: !adapter.miss && adapter.look ? adapter.look : "unknown",
    permits: !adapter.miss && adapter.permits ? adapter.permits : "unknown",
    access: !adapter.miss && adapter.access ? adapter.access : "unknown",
    fatigue: !adapter.miss && adapter.fatigue ? adapter.fatigue : "unknown",
    why,
    confidence,
    checkedAt,
    sources: [...new Set(sources)],
  };
  return card;
}

export function scoutCardMarkdown(card: ScoutCard): string {
  const mesh = card.meshMm != null ? String(card.meshMm) : "empty";
  return [
    `# ${card.loopLabel || card.loopId}`,
    "",
    `- ageBand: ${card.ageBand}${card.censusYear ? ` (median ~${card.censusYear})` : ""}`,
    `- stormBand: ${card.stormBand}`,
    `- lsrCount: ${card.lsrCount}`,
    `- alertHit: ${card.alertHit}`,
    `- meshMm: ${mesh}`,
    `- keep: ${card.keep}`,
    `- look / permits / access / fatigue: ${card.look} / ${card.permits} / ${card.access} / ${card.fatigue}`,
    `- confidence: ${card.confidence}`,
    `- why: ${card.why || "(none)"}`,
    `- stormSay: ${card.stormSay || "(none)"}`,
    `- sources: ${card.sources.join("; ") || "(none)"}`,
    "",
    "Do not say this on the porch unless Keep.",
    "",
  ].join("\n");
}

export function cardKeysLookClean(card: ScoutCard): boolean {
  return !Object.keys(card).some((k) => PII_KEY.test(k));
}
