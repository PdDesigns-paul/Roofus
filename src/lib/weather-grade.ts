/**
 * Last-48h pulse grades. H on a loop they keep overrides Working for tomorrow.
 * M/L never pick the day. Keep is the only porch language.
 */
import { loopLabel } from "./streets-rank.ts";
import type { StreetLoop } from "./streets-types.ts";
import { stormsNearLoop } from "./weather-match.ts";
import type { PulseGrade, PulseLead, StormEvent } from "./weather-types.ts";

function hailHeavy(magnitude: string, remark: string) {
  const n = parseFloat(magnitude);
  if (Number.isFinite(n) && n >= 0.75) return true;
  return /inch hail|hail/i.test(magnitude) || /\d(\.\d+)?\s*inch/i.test(remark);
}

function personalDamage(remark: string, magnitude: string) {
  return /tree|wire|shingle|roof|siding|downed|photo|house|vehicle/i.test(`${remark} ${magnitude}`);
}

export function pulseIsFresh(at: string, hours = 48) {
  const t = Date.parse(at);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < hours * 3600 * 1000;
}

export function gradeStormAgainstLoops(storm: StormEvent, loops: StreetLoop[]): PulseLead {
  const live = loops.filter((l) => l.status !== "skip");
  const hit = live.find((l) => stormsNearLoop([storm], l).length > 0) ?? null;
  const tight = Boolean(hit);
  const heavy = hailHeavy(storm.magnitude, storm.remark);
  const damage = personalDamage(storm.remark, storm.magnitude);

  let grade: PulseGrade = "L";
  if (tight && (heavy || damage)) grade = "H";
  else if (tight) grade = "M";
  else if (storm.county) grade = "M";

  return {
    id: `p-${storm.id}`,
    grade,
    kind: storm.kind,
    date: storm.date,
    county: storm.county,
    state: storm.state,
    places: storm.places,
    say: storm.say,
    why: tight
      ? grade === "H"
        ? "NWS on a loop you already keep — restoration + age-band."
        : "On a loop, lighter signal."
      : "Township / county only — no loop on file. Confirm year before a full day.",
    sources: [storm.source || "NWS Local Storm Report"],
    loopId: hit?.id ?? "",
    loopLabel: hit ? loopLabel(hit) : "",
    lat: storm.lat,
    lon: storm.lon,
    remark: storm.remark,
  };
}

export function applyCrawlUpgrade(lead: PulseLead, crawled: PulseLead[]): PulseLead {
  const extra = crawled.filter((c) => {
    if (c.loopId && lead.loopId && c.loopId === lead.loopId) return true;
    const sameCounty = c.county.toLowerCase() === lead.county.toLowerCase();
    const placeHit = c.places.some((p) =>
      lead.places.some((q) => q.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(q.toLowerCase())),
    );
    return sameCounty && (placeHit || (!lead.loopId && !c.loopId));
  });
  if (!extra.length) return lead;
  const sources = [...new Set([...lead.sources, ...extra.flatMap((e) => e.sources)])];
  const multi = sources.length >= 2 || extra.some((e) => e.grade === "H");
  let grade = lead.grade;
  if (lead.loopId && multi) grade = "H";
  return {
    ...lead,
    grade,
    sources,
    why: multi && lead.loopId ? "NWS plus local news or X on a loop you keep." : lead.why,
    say: lead.say,
  };
}

export function hOverrideLoop(loops: StreetLoop[], leads: PulseLead[]): StreetLoop | null {
  const hIds = leads.filter((l) => l.grade === "H" && l.loopId).map((l) => l.loopId);
  return (
    loops.find((l) => hIds.includes(l.id) && l.status !== "skip" && l.status !== "done") ??
    loops.find((l) => hIds.includes(l.id) && l.status !== "skip") ??
    null
  );
}

export function leadToStorm(lead: PulseLead): StormEvent {
  return {
    id: lead.id.replace(/^p-/, "k-"),
    date: lead.date,
    kind: lead.kind,
    county: lead.county,
    state: lead.state,
    magnitude: lead.grade === "H" ? `${lead.kind} (H)` : lead.kind,
    places: lead.places,
    say: lead.say,
    source: lead.sources.join(", "),
    lat: lead.lat,
    lon: lead.lon,
    remark: lead.remark,
  };
}

/** Pulse rows they have not Keep / Toss yet. Kept say is enough — ids differ after Keep. */
export function openPulseLeads(leads: PulseLead[], kept: StormEvent[], tossed: string[]): PulseLead[] {
  const tossedSet = new Set(tossed);
  const keptIds = new Set(kept.map((k) => k.id));
  const keptSay = new Set(kept.map((k) => k.say.trim().toLowerCase()).filter(Boolean));
  return leads.filter((l) => {
    if (tossedSet.has(l.id)) return false;
    if (keptIds.has(l.id) || keptIds.has(l.id.replace(/^p-/, "k-"))) return false;
    if (l.say.trim() && keptSay.has(l.say.trim().toLowerCase())) return false;
    return true;
  });
}

