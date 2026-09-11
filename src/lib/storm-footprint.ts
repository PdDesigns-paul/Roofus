/**
 * Slice 3: LSR pins tag the loop. MESH is optional footnote — never porch copy.
 * Grade still comes from gradeStormAgainstLoops. Keep still gates Script A.
 */
import {
  ageBand,
  ageBandWhy,
  type ScoutCard,
  type StormBand,
  type TargetYears,
} from "./scout-types.ts";
import { loopLabel } from "./streets-rank.ts";
import type { StreetLoop } from "./streets-types.ts";
import { countyBasename, stateAbbr } from "./us-state-fips.ts";
import { gradeStormAgainstLoops } from "./weather-grade.ts";
import { stormsNearLoop } from "./weather-match.ts";
import type { PulseGrade, StormEvent } from "./weather-types.ts";

export type StormFootprint = {
  loopId: string;
  lsrCount: number;
  alertHit: boolean;
  meshMm?: number;
  stormBand: StormBand;
  stormSay: string;
  sources: string[];
};

export type AlertArea = {
  county: string;
  state?: string;
  event?: string;
};

const STORMISH_ALERT = /hail|thunder|tornado|wind/i;
const GRADE_RANK: Record<PulseGrade, number> = { H: 3, M: 2, L: 1 };

type LoopPin = {
  id: string;
  county: string;
  lat: number;
  lon: number;
  state?: string;
};

function asGradeLoop(loop: LoopPin): StreetLoop {
  return {
    id: loop.id,
    title: "",
    zip: "",
    town: "",
    place: "",
    township: "",
    streets: [],
    county: loop.county,
    state: loop.state ?? "",
    medianYear: 0,
    homes: 0,
    lat: loop.lat,
    lon: loop.lon,
    status: "fresh",
    lastResult: "",
  };
}

function bandForNearby(loop: LoopPin, nearby: StormEvent[]): StormBand {
  if (!nearby.length) return "quiet";
  const gradeLoop = asGradeLoop(loop);
  let best: StormBand = "L";
  for (const storm of nearby) {
    const grade = gradeStormAgainstLoops(storm, [gradeLoop]).grade;
    if (grade === "H") return "H";
    if (GRADE_RANK[grade] > (GRADE_RANK[best as PulseGrade] ?? 0)) best = grade;
  }
  return best;
}

function pickSay(nearby: StormEvent[], loop: LoopPin): string {
  if (!nearby.length) return "";
  const gradeLoop = asGradeLoop(loop);
  const ranked = [...nearby].sort((a, b) => {
    const ga = gradeStormAgainstLoops(a, [gradeLoop]).grade;
    const gb = gradeStormAgainstLoops(b, [gradeLoop]).grade;
    return (GRADE_RANK[gb] ?? 0) - (GRADE_RANK[ga] ?? 0);
  });
  for (const storm of ranked) {
    const say = storm.say.trim();
    if (say) return say;
  }
  return "";
}

export function alertHitsLoop(
  loop: { county: string; state?: string },
  alerts: AlertArea[],
): boolean {
  const county = countyBasename(loop.county).toLowerCase();
  if (!county) return false;
  const st = stateAbbr(loop.state ?? "") ?? (loop.state ?? "").trim().toUpperCase();
  return alerts.some((alert) => {
    if (countyBasename(alert.county).toLowerCase() !== county) return false;
    const alertSt = stateAbbr(alert.state ?? "") ?? (alert.state ?? "").trim().toUpperCase();
    if (st && alertSt && st !== alertSt) return false;
    if (alert.event && !STORMISH_ALERT.test(alert.event)) return false;
    return true;
  });
}

/** areaDesc looks like "Cumberland, PA; York, PA". */
export function parseNwsAlertAreas(
  body: { features?: { properties?: { event?: string; areaDesc?: string } }[] },
  fallbackState = "",
): AlertArea[] {
  const out: AlertArea[] = [];
  for (const feature of body.features ?? []) {
    const event = String(feature.properties?.event ?? "").trim();
    const areaDesc = String(feature.properties?.areaDesc ?? "");
    for (const part of areaDesc.split(";")) {
      const bits = part
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const county = bits[0] ?? "";
      if (!county) continue;
      out.push({ county, state: bits[1] || fallbackState, event });
    }
  }
  return out;
}

export function footprintForLoop(
  loop: LoopPin,
  storms: StormEvent[],
  extras?: { alerts?: AlertArea[]; meshMm?: number },
): StormFootprint {
  const nearby = stormsNearLoop(storms, loop);
  const tag: StormFootprint = {
    loopId: loop.id,
    lsrCount: nearby.length,
    alertHit: extras?.alerts ? alertHitsLoop(loop, extras.alerts) : false,
    stormBand: bandForNearby(loop, nearby),
    stormSay: pickSay(nearby, loop),
    sources: [...new Set(nearby.map((s) => s.source.trim()).filter(Boolean))],
  };
  // MESH is radar mm. Do not convert LSR inches into meshMm.
  if (extras?.meshMm != null && Number.isFinite(extras.meshMm)) tag.meshMm = extras.meshMm;
  return tag;
}

export function tagLoops(
  loops: LoopPin[],
  storms: StormEvent[],
  extras?: { alerts?: AlertArea[]; meshMmByLoop?: Record<string, number> },
): StormFootprint[] {
  return loops
    .filter((loop) => loop.id && Number.isFinite(loop.lat) && Number.isFinite(loop.lon))
    .map((loop) =>
      footprintForLoop(loop, storms, {
        alerts: extras?.alerts,
        meshMm: extras?.meshMmByLoop?.[loop.id],
      }),
    );
}

export function applyStormFootprint(
  card: ScoutCard,
  tag: StormFootprint,
  checkedAt = "",
): ScoutCard {
  const next: ScoutCard = {
    ...card,
    lsrCount: tag.lsrCount,
    alertHit: tag.alertHit,
    stormBand: tag.stormBand,
    stormSay: tag.stormSay,
    sources: [...new Set([...card.sources, ...tag.sources])],
    checkedAt: checkedAt || card.checkedAt,
  };
  if (tag.meshMm != null && Number.isFinite(tag.meshMm)) next.meshMm = tag.meshMm;
  else delete next.meshMm;
  return next;
}

export function scoutCardFromLoop(
  loop: StreetLoop,
  tag: StormFootprint,
  target: TargetYears,
  existing?: ScoutCard,
  now = new Date().getFullYear(),
  checkedAt = new Date().toISOString(),
): ScoutCard {
  const year = Math.round(loop.medianYear);
  const band = ageBand(loop, target, now);
  const base: ScoutCard = existing ?? {
    loopId: loop.id,
    loopLabel: loopLabel(loop),
    zip: loop.zip,
    censusYear: year,
    ageYears: year >= 1800 ? now - year : 0,
    ageBand: band,
    stormBand: "quiet",
    stormSay: "",
    keep: "pending",
    keptAt: "",
    lsrCount: 0,
    alertHit: false,
    look: "unknown",
    permits: "unknown",
    access: "unknown",
    fatigue: "unknown",
    why: ageBandWhy(band, loop, target),
    confidence: "low",
    checkedAt: "",
    sources: [],
  };
  return applyStormFootprint(
    {
      ...base,
      loopId: loop.id,
      loopLabel: loopLabel(loop),
      zip: loop.zip || base.zip,
      censusYear: Number.isFinite(year) && year >= 1800 ? year : base.censusYear,
      ageYears: year >= 1800 ? now - year : base.ageYears,
      ageBand: band,
      why: base.why || ageBandWhy(band, loop, target),
    },
    tag,
    checkedAt,
  );
}

export function mergeFootprintsIntoCards(
  cards: Record<string, ScoutCard>,
  tags: StormFootprint[],
  loops: StreetLoop[],
  target: TargetYears,
  checkedAt: string,
): Record<string, ScoutCard> {
  const byId = new Map(loops.map((loop) => [loop.id, loop]));
  const next = { ...cards };
  for (const tag of tags) {
    const loop = byId.get(tag.loopId);
    if (loop) {
      next[tag.loopId] = scoutCardFromLoop(
        loop,
        tag,
        target,
        next[tag.loopId],
        undefined,
        checkedAt,
      );
      continue;
    }
    const prev = next[tag.loopId];
    if (prev) next[tag.loopId] = applyStormFootprint(prev, tag, checkedAt);
  }
  return next;
}
