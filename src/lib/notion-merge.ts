/**
 * Pure backup merge. Phone wins live status and non-empty text.
 * Counts take the max. Newest 60 days. FAQs union by id or question.
 */
import type { DayEntry, DayProfile } from "./day-book.ts";
import type { NotionFaq } from "./notion-ids.ts";
import type { LoopResult, LoopStatus, StreetLoop } from "./streets-types.ts";
import type { StormEvent } from "./weather-types.ts";

export const MAX_BACKUP_DAYS = 60;
export const MAX_BACKUP_STREETS = 120;
export const MAX_BACKUP_FAQS = 40;

const STATUSES: LoopStatus[] = ["fresh", "working", "done", "skip"];
const RESULTS: LoopResult[] = ["", "no-answer", "not-now", "callback", "appointment"];

export type SurviveFields = {
  earned: string;
  byDate: string;
  why1: string;
  why2: string;
  why3: string;
  writtenOn: string;
  demon: string;
  origin: string;
  radar: string;
  attack: string;
  offBlock: string;
  phoneDown: string;
  gear: string;
  drop: string;
  alreadyHave: string;
  stackMonth: string;
  skill: string;
  drill: string;
  windshield: string;
  nightBook: string;
};

export type MindsetRow = { name: string; body: string };

export type RestoreMindset = {
  survive: Partial<SurviveFields>;
  profile: Partial<DayProfile>;
  ageMin?: number;
  ageMax?: number;
  companyName?: string;
  warrantyLine?: string;
};

function emptyDay(date: string): DayEntry {
  return {
    date,
    knocks: 0,
    talks: 0,
    looks: 0,
    sets: 0,
    cluster: "",
    storm: "",
    afterAction: "",
    tomorrowStreet: "",
  };
}

export function packLabeled(fields: Record<string, string | number | undefined>) {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === "") continue;
    const s = String(v).trim();
    if (!s) continue;
    lines.push(`${k}: ${s.replace(/\r?\n/g, " · ")}`);
  }
  return lines.join("\n");
}

export function unpackLabeled(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of body.split("\n")) {
    const m = line.match(/^([A-Za-z][A-Za-z0-9]*): (.*)$/);
    if (!m?.[1]) continue;
    out[m[1]] = (m[2] ?? "").replace(/ · /g, "\n").trim();
  }
  return out;
}

function n(v: unknown) {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? Math.max(0, Math.round(x)) : 0;
}

function s(v: unknown) {
  return typeof v === "string" ? v : "";
}

export function asLoopStatus(v: unknown): LoopStatus {
  return STATUSES.includes(v as LoopStatus) ? (v as LoopStatus) : "fresh";
}

export function asLoopResult(v: unknown): LoopResult {
  return RESULTS.includes(v as LoopResult) ? (v as LoopResult) : "";
}

export function mergeDays(current: Record<string, DayEntry>, incoming: DayEntry[]): Record<string, DayEntry> {
  const days = { ...current };
  for (const raw of incoming) {
    const date = s(raw.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const cur = days[date];
    const next: DayEntry = {
      date,
      knocks: n(raw.knocks),
      talks: n(raw.talks),
      looks: n(raw.looks),
      sets: n(raw.sets),
      cluster: s(raw.cluster),
      storm: s(raw.storm),
      afterAction: s(raw.afterAction),
      tomorrowStreet: s(raw.tomorrowStreet),
    };
    days[date] = cur
      ? {
          date,
          knocks: Math.max(cur.knocks, next.knocks),
          talks: Math.max(cur.talks, next.talks),
          looks: Math.max(cur.looks, next.looks),
          sets: Math.max(cur.sets, next.sets),
          cluster: cur.cluster || next.cluster,
          storm: cur.storm || next.storm,
          afterAction: cur.afterAction || next.afterAction,
          tomorrowStreet: cur.tomorrowStreet || next.tomorrowStreet,
        }
      : { ...emptyDay(date), ...next };
  }
  const keys = Object.keys(days).sort();
  if (keys.length <= MAX_BACKUP_DAYS) return days;
  const keep = keys.slice(-MAX_BACKUP_DAYS);
  const pruned: Record<string, DayEntry> = {};
  for (const k of keep) {
    const hit = days[k];
    if (hit) pruned[k] = hit;
  }
  return pruned;
}

export function sanitizeLoop(raw: Partial<StreetLoop> & { id: string }): StreetLoop {
  const streets = Array.isArray(raw.streets)
    ? raw.streets.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const title = s(raw.title);
  const zip = s(raw.zip) || (/^\d{5}$/.test(title) ? title : "");
  return {
    id: raw.id,
    title,
    zip,
    streets,
    county: s(raw.county),
    state: s(raw.state),
    medianYear: n(raw.medianYear) || new Date().getFullYear() - 20,
    homes: n(raw.homes),
    lat: typeof raw.lat === "number" && Number.isFinite(raw.lat) ? raw.lat : 0,
    lon: typeof raw.lon === "number" && Number.isFinite(raw.lon) ? raw.lon : 0,
    status: asLoopStatus(raw.status),
    lastResult: asLoopResult(raw.lastResult),
  };
}

export function mergeLoops(current: StreetLoop[], incoming: StreetLoop[]): StreetLoop[] {
  const have = new Map(current.map((l) => [l.id, l]));
  for (const raw of incoming) {
    if (!raw?.id) continue;
    const l = sanitizeLoop(raw);
    const cur = have.get(l.id);
    have.set(
      l.id,
      cur
        ? {
            ...l,
            status: cur.status || l.status,
            lastResult: cur.lastResult || l.lastResult,
          }
        : l,
    );
  }
  return [...have.values()];
}

export function sanitizeStorm(raw: Partial<StormEvent> & { id: string }): StormEvent {
  const places = Array.isArray(raw.places) ? raw.places.map((x) => String(x).trim()).filter(Boolean) : [];
  return {
    id: raw.id,
    date: s(raw.date),
    kind: raw.kind === "wind" ? "wind" : "hail",
    county: s(raw.county),
    state: s(raw.state),
    magnitude: s(raw.magnitude),
    places,
    say: s(raw.say),
    source: s(raw.source),
    lat: typeof raw.lat === "number" && Number.isFinite(raw.lat) ? raw.lat : 0,
    lon: typeof raw.lon === "number" && Number.isFinite(raw.lon) ? raw.lon : 0,
    remark: s(raw.remark),
  };
}

export function mergeStorms(current: StormEvent[], incoming: StormEvent[]): StormEvent[] {
  const have = new Map(current.map((row) => [row.id, row]));
  for (const raw of incoming) {
    if (!raw?.id) continue;
    const next = sanitizeStorm(raw);
    have.set(next.id, have.get(next.id) ?? next);
  }
  return [...have.values()];
}

export function mergeFaqs(current: NotionFaq[], incoming: NotionFaq[]): NotionFaq[] {
  const have = new Map(current.map((f) => [f.id, f]));
  const byQ = new Map(current.map((f) => [f.q.trim().toLowerCase(), f]));
  for (const f of incoming) {
    const q = s(f.q).trim();
    const a = s(f.a).trim();
    if (!q || !a) continue;
    const id = s(f.id) || `f_${q.slice(0, 12)}`;
    const cur = have.get(id) ?? byQ.get(q.toLowerCase());
    if (cur) {
      const merged = { ...cur, q: cur.q || q, a: cur.a || a };
      have.set(cur.id, merged);
    } else {
      have.set(id, { id, q, a });
    }
  }
  return [...have.values()].slice(0, MAX_BACKUP_FAQS);
}

export function packMindset(
  survive: SurviveFields,
  profile: DayProfile,
  extra: { ageMin: number; ageMax: number; companyName: string; warrantyLine: string },
): MindsetRow[] {
  return [
    {
      name: "Why",
      body: packLabeled({
        earned: survive.earned,
        byDate: survive.byDate,
        why1: survive.why1,
        why2: survive.why2,
        why3: survive.why3,
        writtenOn: survive.writtenOn,
      }),
    },
    {
      name: "Demon",
      body: packLabeled({
        demon: survive.demon,
        origin: survive.origin,
        radar: survive.radar,
        attack: survive.attack,
      }),
    },
    {
      name: "Pace",
      body: packLabeled({
        offBlock: survive.offBlock,
        phoneDown: survive.phoneDown,
        gear: survive.gear,
        drop: survive.drop,
        alreadyHave: survive.alreadyHave,
      }),
    },
    {
      name: "Stack",
      body: packLabeled({
        ...(survive.skill.trim() || survive.drill.trim()
          ? {
              stackMonth: survive.stackMonth,
              skill: survive.skill,
              drill: survive.drill,
              windshield: survive.windshield,
              nightBook: survive.nightBook,
            }
          : {}),
      }),
    },
    {
      name: "Profile",
      body: packLabeled({
        goBy: profile.goBy,
        company: profile.company,
        counties: profile.counties,
        states: profile.states,
        knockWindow: profile.knockWindow,
        paperWindow: profile.paperWindow,
        hardStop: profile.hardStop,
        ...(profile.goBy.trim() || profile.counties.trim() || profile.states.trim()
          ? { ageMin: extra.ageMin, ageMax: extra.ageMax }
          : {}),
      }),
    },
    {
      name: "Company",
      body: packLabeled({
        companyName: extra.companyName.trim() === "Roofus" ? "" : extra.companyName,
        warrantyLine:
          extra.warrantyLine.trim() === "See the actual Owens Corning warranty."
            ? ""
            : extra.warrantyLine,
      }),
    },
  ];
}

function fallbackLines(body: string) {
  return body.split("\n").map((x) => x.trim());
}

export function unpackMindset(rows: Record<string, string>): RestoreMindset {
  const survive: Partial<SurviveFields> = {};
  const profile: Partial<DayProfile> = {};
  const out: RestoreMindset = { survive, profile };

  const why = unpackLabeled(rows.Why ?? "");
  if (Object.keys(why).length) {
    if (why.earned) survive.earned = why.earned;
    if (why.byDate) survive.byDate = why.byDate;
    if (why.why1) survive.why1 = why.why1;
    if (why.why2) survive.why2 = why.why2;
    if (why.why3) survive.why3 = why.why3;
    if (why.writtenOn) survive.writtenOn = why.writtenOn;
  } else if (rows.Why) {
    const lines = fallbackLines(rows.Why);
    if (lines[0]) survive.earned = lines[0];
    if (lines[1]) survive.byDate = lines[1];
    if (lines[2]) survive.why1 = lines[2];
    if (lines[3]) survive.why2 = lines[3];
    if (lines[4]) survive.why3 = lines[4];
  }

  const demon = unpackLabeled(rows.Demon ?? "");
  if (Object.keys(demon).length) {
    if (demon.demon) survive.demon = demon.demon;
    if (demon.origin) survive.origin = demon.origin;
    if (demon.radar) survive.radar = demon.radar;
    if (demon.attack) survive.attack = demon.attack;
  } else if (rows.Demon) {
    const lines = fallbackLines(rows.Demon);
    if (lines[0]) survive.demon = lines[0];
    if (lines.slice(1).join("\n").trim()) survive.origin = lines.slice(1).join("\n");
  }

  const pace = unpackLabeled(rows.Pace ?? "");
  if (Object.keys(pace).length) {
    if (pace.offBlock) survive.offBlock = pace.offBlock;
    if (pace.phoneDown) survive.phoneDown = pace.phoneDown;
    if (pace.gear) survive.gear = pace.gear;
    if (pace.drop) survive.drop = pace.drop;
    if (pace.alreadyHave) survive.alreadyHave = pace.alreadyHave;
  } else if (rows.Pace) {
    const lines = fallbackLines(rows.Pace);
    if (lines[0]) survive.offBlock = lines[0];
    if (lines.slice(1).join("\n").trim()) survive.phoneDown = lines.slice(1).join("\n");
  }

  const stack = unpackLabeled(rows.Stack ?? "");
  if (Object.keys(stack).length) {
    if (stack.stackMonth) survive.stackMonth = stack.stackMonth;
    if (stack.skill) survive.skill = stack.skill;
    if (stack.drill) survive.drill = stack.drill;
    if (stack.windshield) survive.windshield = stack.windshield;
    if (stack.nightBook) survive.nightBook = stack.nightBook;
  } else if (rows.Stack) {
    const lines = fallbackLines(rows.Stack);
    if (lines[0]) survive.stackMonth = lines[0];
    if (lines[1]) survive.skill = lines[1];
    if (lines.slice(2).join("\n").trim()) survive.drill = lines.slice(2).join("\n");
  }

  const prof = unpackLabeled(rows.Profile ?? "");
  if (prof.goBy) profile.goBy = prof.goBy;
  if (prof.company) profile.company = prof.company;
  if (prof.counties) profile.counties = prof.counties;
  if (prof.states) profile.states = prof.states;
  if (prof.knockWindow) profile.knockWindow = prof.knockWindow;
  if (prof.paperWindow) profile.paperWindow = prof.paperWindow;
  if (prof.hardStop) profile.hardStop = prof.hardStop;
  if (prof.ageMin) out.ageMin = n(prof.ageMin);
  if (prof.ageMax) out.ageMax = n(prof.ageMax);

  const company = unpackLabeled(rows.Company ?? "");
  if (company.companyName) out.companyName = company.companyName;
  if (company.warrantyLine) out.warrantyLine = company.warrantyLine;

  return out;
}

export function rowsWithBody(rows: MindsetRow[]): MindsetRow[] {
  return rows.filter((r) => r.body.trim());
}

/** A zip with no coords is still a zip. Do not drop it on restore. */
export function loopWorthKeeping(l: StreetLoop): boolean {
  return Boolean(l.id && (l.zip.trim() || l.title.trim() || l.streets.length));
}

export function restoreTally(pulled: {
  days: DayEntry[];
  loops: StreetLoop[];
  storms: StormEvent[];
  mindset: Record<string, string>;
  faqs: NotionFaq[];
}): string {
  const bits: string[] = [];
  if (pulled.days.length) {
    bits.push(`${pulled.days.length} day${pulled.days.length === 1 ? "" : "s"}`);
  }
  if (pulled.loops.length) {
    bits.push(`${pulled.loops.length} zip${pulled.loops.length === 1 ? "" : "s"}`);
  }
  if (pulled.storms.length) {
    bits.push(`${pulled.storms.length} storm${pulled.storms.length === 1 ? "" : "s"}`);
  }
  if (Object.values(pulled.mindset).some((v) => v.trim())) bits.push("mindset");
  if (pulled.faqs.length) bits.push("memory");
  if (!bits.length) {
    return "Notion had nothing to copy onto this phone. Backup from the phone that has the day, then Restore here.";
  }
  return `Brought back ${bits.join(", ")}.`;
}

export function fillSurvive(cur: SurviveFields, incoming: Partial<SurviveFields>): Partial<SurviveFields> {
  const patch: Partial<SurviveFields> = {};
  if (!cur.earned.trim() && incoming.earned?.trim()) {
    patch.earned = incoming.earned;
    if (incoming.byDate) patch.byDate = incoming.byDate;
    if (incoming.why1) patch.why1 = incoming.why1;
    if (incoming.why2) patch.why2 = incoming.why2;
    if (incoming.why3) patch.why3 = incoming.why3;
    if (incoming.writtenOn) patch.writtenOn = incoming.writtenOn;
  }
  if (!cur.demon.trim() && incoming.demon?.trim()) {
    patch.demon = incoming.demon;
    if (incoming.origin) patch.origin = incoming.origin;
    if (incoming.radar) patch.radar = incoming.radar;
    if (incoming.attack) patch.attack = incoming.attack;
  }
  if (!cur.radar.trim() && incoming.radar?.trim()) patch.radar = incoming.radar;
  if (!cur.attack.trim() && incoming.attack?.trim()) patch.attack = incoming.attack;
  if (!cur.offBlock.trim() && incoming.offBlock?.trim()) {
    patch.offBlock = incoming.offBlock;
    if (incoming.phoneDown) patch.phoneDown = incoming.phoneDown;
  }
  if (!cur.gear.trim() && incoming.gear?.trim()) patch.gear = incoming.gear;
  if (!cur.drop.trim() && incoming.drop?.trim()) patch.drop = incoming.drop;
  if (!cur.alreadyHave.trim() && incoming.alreadyHave?.trim()) patch.alreadyHave = incoming.alreadyHave;
  if (!cur.skill.trim() && incoming.skill?.trim()) {
    patch.skill = incoming.skill;
    if (incoming.stackMonth) patch.stackMonth = incoming.stackMonth;
    if (incoming.drill) patch.drill = incoming.drill;
    if (incoming.windshield) patch.windshield = incoming.windshield;
    if (incoming.nightBook) patch.nightBook = incoming.nightBook;
  }
  if (!cur.windshield.trim() && incoming.windshield?.trim()) patch.windshield = incoming.windshield;
  if (!cur.nightBook.trim() && incoming.nightBook?.trim()) patch.nightBook = incoming.nightBook;
  return patch;
}

export function fillProfile(cur: DayProfile, incoming: Partial<DayProfile>): DayProfile {
  const next = { ...cur };
  const keys = [
    "goBy",
    "company",
    "counties",
    "states",
    "knockWindow",
    "paperWindow",
    "hardStop",
  ] as const;
  for (const k of keys) {
    if (!next[k].trim() && incoming[k]?.trim()) next[k] = incoming[k];
  }
  if (!next.setupDone && next.counties.trim() && next.states.trim()) next.setupDone = true;
  return next;
}
