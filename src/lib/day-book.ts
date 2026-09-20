/**
 * Today's log. Phone is the live book — Notion is an optional copy.
 * Counts prune to the newest 60 days. Profile (counties, hours) is set once.
 * Labor is first-party: the canvasser sees the clock. A trainer reads the same book.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clusterPlanLabel } from "./streets-rank.ts";
import { emptyWalk, restoreWalk, serializeWalk, type InspectWalkProgress } from "./inspect-walk.ts";
import { ANON_OWNER, bookKey, writeOwner } from "./book-owner.ts";
import { restoreTrail, appendTrailPoint, type TrailPoint } from "./trail.ts";



export type DayCounts = {
  knocks: number;
  talks: number;
  looks: number;
  sets: number;
};

export const COUNT_KEYS = ["knocks", "talks", "looks", "sets"] as const;
export type CountKey = (typeof COUNT_KEYS)[number];

export function isCountKey(key: string): key is CountKey {
  return (COUNT_KEYS as readonly string[]).includes(key);
}

export type AfterAction = { wins: string; better: string; plan: string };

/** When a tile or pin status wrote. Not a CRM. Counts stay the day total. */
export type DayStamp = { at: string; unit: string; pinId?: string };

export const MAX_DAY_STAMPS = 200;

/** One local shift on a calendar day. No payroll. Breaks stored, not a UI yet. */
export type LaborSegment = {
  kind: "work" | "break";
  startedAt: string;
  endedAt: string | null;
};

export type { TrailPoint } from "./trail.ts";

/** v0 fields stay written so office restore still works. breaksMin is derived. */
export type LaborShift = {
  date: string;
  startedAt: string | null;
  endedAt: string | null;
  breaksMin: number;
  segments: LaborSegment[];
  trailOn: boolean;
};


export type DayEntry = DayCounts & {
  date: string;
  cluster: string;
  storm: string;
  afterAction: string;
  tomorrowStreet: string;
  labor: LaborShift;
  stamps: DayStamp[];
  trail: TrailPoint[];
};

export function unpackAfterAction(body: string): AfterAction {
  const raw = body.trim();
  const out: AfterAction = { wins: "", better: "", plan: "" };
  if (!raw) return out;
  const labeled: Partial<AfterAction> = {};
  let cur: keyof AfterAction | null = null;
  const buf: string[] = [];
  const flush = () => {
    if (!cur) return;
    labeled[cur] = buf.join("\n").trim();
    buf.length = 0;
  };
  for (const line of raw.split("\n")) {
    const m = line.match(/^(Wins|Better|Plan):\s?(.*)$/i);
    if (m?.[1]) {
      flush();
      const key = m[1].toLowerCase() as keyof AfterAction;
      cur = key;
      buf.push(m[2] ?? "");
      continue;
    }
    if (cur) buf.push(line);
  }
  flush();
  if (labeled.wins || labeled.better || labeled.plan) {
    return {
      wins: labeled.wins ?? "",
      better: labeled.better ?? "",
      plan: labeled.plan ?? "",
    };
  }
  return { wins: raw, better: "", plan: "" };
}

export function packAfterAction(a: AfterAction): string {
  const lines: string[] = [];
  if (a.wins.trim()) lines.push(`Wins: ${a.wins.trim()}`);
  if (a.better.trim()) lines.push(`Better: ${a.better.trim()}`);
  if (a.plan.trim()) lines.push(`Plan: ${a.plan.trim()}`);
  return lines.join("\n");
}


export type DayProfile = {
  setupDone: boolean;
  goBy: string;
  company: string;
  counties: string;
  states: string;
  knockWindow: string;
  paperWindow: string;
  hardStop: string;
  ownerId: string | null;
  ownerLabel: string;
};

export const BLANK_PROFILE: DayProfile = {
  setupDone: false,
  goBy: "",
  company: "",
  counties: "",
  states: "",
  knockWindow: "",
  paperWindow: "",
  hardStop: "",
  ownerId: null,
  ownerLabel: ANON_OWNER.ownerLabel,
};

export function restoreProfile(raw: unknown): DayProfile {
  const r = raw && typeof raw === "object" ? (raw as Partial<DayProfile>) : {};
  const ownerId = typeof r.ownerId === "string" && r.ownerId.trim() ? r.ownerId.trim() : null;
  const label = typeof r.ownerLabel === "string" ? r.ownerLabel.trim() : "";
  return {
    setupDone: Boolean(r.setupDone),
    goBy: typeof r.goBy === "string" ? r.goBy : "",
    company: typeof r.company === "string" ? r.company : "",
    counties: typeof r.counties === "string" ? r.counties : "",
    states: typeof r.states === "string" ? r.states : "",
    knockWindow: typeof r.knockWindow === "string" ? r.knockWindow : "",
    paperWindow: typeof r.paperWindow === "string" ? r.paperWindow : "",
    hardStop: typeof r.hardStop === "string" ? r.hardStop : "",
    ownerId,
    ownerLabel: label || (ownerId ? "Signed in" : ANON_OWNER.ownerLabel),
  };
}


const MAX_DAYS = 60;

export const EMPTY_COUNTS: DayCounts = { knocks: 0, talks: 0, looks: 0, sets: 0 };

export function emptyShift(date: string): LaborShift {
  return { date, startedAt: null, endedAt: null, breaksMin: 0, segments: [], trailOn: false };
}

function isoOrNull(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  return Number.isFinite(Date.parse(v)) ? v : null;
}

function nCount(v: unknown): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? Math.max(0, Math.round(x)) : 0;
}

function restoreSegment(raw: unknown): LaborSegment | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { kind?: unknown; startedAt?: unknown; endedAt?: unknown };
  const kind = r.kind === "break" ? "break" : r.kind === "work" ? "work" : null;
  const startedAt = isoOrNull(r.startedAt);
  if (!kind || !startedAt) return null;
  return { kind, startedAt, endedAt: isoOrNull(r.endedAt) };
}

function spanMin(startIso: string, endMs: number): number {
  const start = Date.parse(startIso);
  if (!Number.isFinite(start) || !Number.isFinite(endMs)) return 0;
  return Math.max(0, Math.round((endMs - start) / 60000));
}

function closedBreaksMin(segments: LaborSegment[]): number {
  let n = 0;
  for (const seg of segments) {
    if (seg.kind !== "break" || !seg.endedAt) continue;
    n += spanMin(seg.startedAt, Date.parse(seg.endedAt));
  }
  return n;
}

function lastOpenSegment(segments: LaborSegment[] | undefined): LaborSegment | null {
  if (!segments?.length) return null;
  const last = segments[segments.length - 1];
  return last && !last.endedAt ? last : null;
}

/** Old clocks in memory may still be v0 until persist merge. */
function liveShift(shift: LaborShift): LaborShift {
  return Array.isArray(shift.segments) ? shift : restoreShift(shift.date, shift);
}

function closeOpenSegment(segments: LaborSegment[], at: string): LaborSegment[] {
  const last = segments[segments.length - 1];
  if (!last || last.endedAt) return segments;
  return segments.map((seg, i) => (i === segments.length - 1 ? { ...seg, endedAt: at } : seg));
}

/** Write derived v0 fields. Keep stored breaksMin when the blob has no break segments. */
export function sealShift(date: string, segments: LaborSegment[], fallbackBreaks = 0, trailOn = false): LaborShift {
  const firstWork = segments.find((seg) => seg.kind === "work") ?? segments[0];
  const open = lastOpenSegment(segments);
  const last = segments[segments.length - 1];
  const hasBreak = segments.some((seg) => seg.kind === "break");
  const stored = Number.isFinite(fallbackBreaks) ? Math.max(0, Math.round(fallbackBreaks)) : 0;
  return {
    date,
    segments,
    startedAt: firstWork?.startedAt ?? null,
    endedAt: open ? null : (last?.endedAt ?? null),
    breaksMin: hasBreak ? closedBreaksMin(segments) : stored,
    trailOn: Boolean(trailOn),
  };
}

export function restoreShift(date: string, raw: unknown): LaborShift {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const startedAt = isoOrNull(r.startedAt);
  const endedAt = isoOrNull(r.endedAt);
  const breaks = Number(r.breaksMin);
  const fallback = Number.isFinite(breaks) ? Math.max(0, Math.round(breaks)) : 0;
  let segments: LaborSegment[] = [];
  if (Array.isArray(r.segments)) {
    for (const item of r.segments) {
      const seg = restoreSegment(item);
      if (seg) segments.push(seg);
    }
  }
  // v0 blob → one work segment. Do not wipe a clock that only has startedAt/endedAt.
  if (segments.length === 0 && startedAt) {
    segments = [{ kind: "work", startedAt, endedAt }];
  }
  return sealShift(date, segments, fallback, r.trailOn === true);
}

export function startWork(shift: LaborShift, at: string): LaborShift {
  const cur = liveShift(shift);
  if (lastOpenSegment(cur.segments)) return cur;
  const trailOn = cur.endedAt ? false : Boolean(cur.trailOn);
  return sealShift(
    cur.date,
    [...cur.segments, { kind: "work", startedAt: at, endedAt: null }],
    cur.breaksMin,
    trailOn,
  );
}

export function pauseLabor(shift: LaborShift, at: string): LaborShift {
  const cur = liveShift(shift);
  const open = lastOpenSegment(cur.segments);
  if (!open || open.kind !== "work") return cur;
  return sealShift(
    cur.date,
    [...closeOpenSegment(cur.segments, at), { kind: "break", startedAt: at, endedAt: null }],
    cur.breaksMin,
    cur.trailOn,
  );
}

export function resumeLabor(shift: LaborShift, at: string): LaborShift {
  const cur = liveShift(shift);
  const open = lastOpenSegment(cur.segments);
  if (!open || open.kind !== "break") return cur;
  return sealShift(
    cur.date,
    [...closeOpenSegment(cur.segments, at), { kind: "work", startedAt: at, endedAt: null }],
    cur.breaksMin,
    cur.trailOn,
  );
}

export function endLabor(shift: LaborShift, at: string): LaborShift {
  const cur = liveShift(shift);
  if (!lastOpenSegment(cur.segments)) return cur;
  return sealShift(cur.date, closeOpenSegment(cur.segments, at), cur.breaksMin, false);
}

export function setLaborTrailOn(shift: LaborShift, on: boolean): LaborShift {
  const cur = liveShift(shift);
  if (!lastOpenSegment(cur.segments)) return cur;
  return { ...cur, trailOn: Boolean(on) };
}

export function laborIsPaused(shift: LaborShift): boolean {
  return lastOpenSegment(liveShift(shift).segments)?.kind === "break";
}

export function laborIsRunning(shift: LaborShift): boolean {
  return lastOpenSegment(liveShift(shift).segments)?.kind === "work";
}

export function restoreStamp(raw: unknown): DayStamp | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { at?: unknown; unit?: unknown; pinId?: unknown };
  const at = isoOrNull(r.at);
  const unit = typeof r.unit === "string" ? r.unit.trim() : "";
  if (!at || !unit || unit.length > 32) return null;
  const pinId = typeof r.pinId === "string" ? r.pinId.trim() : "";
  return pinId ? { at, unit, pinId } : { at, unit };
}

export function restoreStamps(raw: unknown): DayStamp[] {
  if (!Array.isArray(raw)) return [];
  const out: DayStamp[] = [];
  for (const item of raw) {
    const stamp = restoreStamp(item);
    if (stamp) out.push(stamp);
  }
  return out.length > MAX_DAY_STAMPS ? out.slice(out.length - MAX_DAY_STAMPS) : out;
}

/** Oldest drop first. One stamp per plus, not a timeline of edits. */
export function appendStamp(stamps: DayStamp[], stamp: DayStamp, cap = MAX_DAY_STAMPS): DayStamp[] {
  const next = [...stamps, stamp];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

export function applyCountWrite(
  day: DayEntry,
  key: CountKey,
  delta: number,
  at: string,
  pinId?: string,
): DayEntry {
  const nextCount = Math.max(0, day[key] + delta);
  const stamps = Array.isArray(day.stamps) ? day.stamps : [];
  if (delta <= 0) {
    // Minus does not invent a negative stamp and does not rewrite when.
    return { ...day, [key]: nextCount, stamps };
  }
  const stamp: DayStamp = { at, unit: key };
  const id = pinId?.trim();
  if (id) stamp.pinId = id;
  return { ...day, [key]: nextCount, stamps: appendStamp(stamps, stamp) };
}

/** Local hours 0–23. Pack labels belong at render, not here. */
export function stampsByHour(stamps: DayStamp[], unit?: string): number[] {
  const hours = Array.from({ length: 24 }, () => 0);
  for (const stamp of stamps) {
    if (unit && stamp.unit !== unit) continue;
    const t = Date.parse(stamp.at);
    if (!Number.isFinite(t)) continue;
    hours[new Date(t).getHours()] += 1;
  }
  return hours;
}


export function restoreDay(date: string, raw: unknown): DayEntry {
  const r = raw && typeof raw === "object" ? (raw as Partial<DayEntry> & { stamps?: unknown }) : {};
  return {
    date,
    knocks: nCount(r.knocks),
    talks: nCount(r.talks),
    looks: nCount(r.looks),
    sets: nCount(r.sets),
    cluster: typeof r.cluster === "string" ? r.cluster : "",
    storm: typeof r.storm === "string" ? r.storm : "",
    afterAction: typeof r.afterAction === "string" ? r.afterAction : "",
    tomorrowStreet: typeof r.tomorrowStreet === "string" ? r.tomorrowStreet : "",
    labor: restoreShift(date, r.labor),
    stamps: restoreStamps(r.stamps),
    trail: restoreTrail((r as { trail?: unknown }).trail),
  };
}

export function restoreDays(days: unknown): Record<string, DayEntry> {
  if (!days || typeof days !== "object") return {};
  const out: Record<string, DayEntry> = {};
  for (const [k, v] of Object.entries(days as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) continue;
    out[k] = restoreDay(k, v);
  }
  return out;
}

export function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function blankDay(date: string): DayEntry {
  return {
    date,
    ...EMPTY_COUNTS,
    cluster: "",
    storm: "",
    afterAction: "",
    tomorrowStreet: "",
    labor: emptyShift(date),
    stamps: [],
    trail: [],
  };
}

/** Worked minutes. Null when they never started — never invent a 3:30. */
export function shiftMinutes(shift: LaborShift, now = Date.now()): number | null {
  const live = liveShift(shift);
  const work = live.segments.filter((seg) => seg.kind === "work");
  if (work.length === 0) {
    if (!live.startedAt) return null;
    const start = Date.parse(live.startedAt);
    if (!Number.isFinite(start)) return null;
    const end = live.endedAt ? Date.parse(live.endedAt) : now;
    if (!Number.isFinite(end)) return null;
    return Math.max(0, Math.round((end - start) / 60000) - (live.breaksMin || 0));
  }
  let min = 0;
  for (const seg of work) {
    const end = seg.endedAt ? Date.parse(seg.endedAt) : now;
    min += spanMin(seg.startedAt, end);
  }
  // v0 stored a number, not a break segment. Subtract only until Pause exists.
  if (!live.segments.some((seg) => seg.kind === "break")) {
    min = Math.max(0, min - (live.breaksMin || 0));
  }
  return min;
}

export function formatElapsed(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/** Bar label. Same minutes, less width. */
export function compactElapsed(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatClockTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function findOpenLabor(days: Record<string, DayEntry>, today = localDateKey()): LaborShift | null {
  const todayRow = days[today];
  if (todayRow && lastOpenSegment(todayRow.labor.segments)) return todayRow.labor;
  if (todayRow?.labor.startedAt && !todayRow.labor.endedAt) return todayRow.labor;
  const keys = Object.keys(days).sort().reverse();
  for (const k of keys) {
    const row = days[k];
    if (!row) continue;
    if (lastOpenSegment(row.labor.segments) || (row.labor.startedAt && !row.labor.endedAt)) {
      return row.labor;
    }
  }
  return null;
}

export function weekTally(days: Record<string, DayEntry>, today = localDateKey()): DayCounts {
  const out: DayCounts = { knocks: 0, talks: 0, looks: 0, sets: 0 };
  const start = new Date(`${today}T12:00:00`);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() - i);
    const row = days[localDateKey(d)];
    if (!row) continue;
    out.knocks += row.knocks;
    out.talks += row.talks;
    out.looks += row.looks;
    out.sets += row.sets;
  }
  return out;
}

export function weekTallyLine(t: DayCounts): string {
  return `Last 7 days: ${t.knocks} doors · ${t.talks} talks · ${t.looks} looks · ${t.sets} sets`;
}

export function weekLaborMinutes(days: Record<string, DayEntry>, today = localDateKey(), now = Date.now()): number {
  let total = 0;
  const start = new Date(`${today}T12:00:00`);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() - i);
    const row = days[localDateKey(d)];
    if (!row) continue;
    const min = shiftMinutes(row.labor, now);
    if (min != null) total += min;
  }
  return total;
}

export function rateLabel(part: number, whole: number): string | null {
  if (whole <= 0) return null;
  return `${Math.round((part / whole) * 100)}%`;
}

export type WeekLaborView = {
  minutes: number;
  hoursLabel: string;
  counts: DayCounts;
  talkOfDoors: string | null;
  lookOfTalks: string | null;
  setOfLooks: string | null;
  doorsPerHour: string | null;
};

export type HoursRange = "week" | "30";

export type HoursPoint = {
  date: string;
  /** Null when they never started — a gap, not a 0h bar. */
  minutes: number | null;
  counts: DayCounts;
};

export type HoursSeries = WeekLaborView & {
  range: HoursRange;
  points: HoursPoint[];
  clocked: boolean;
};

export function rangeDateKeys(today: string, length: number): string[] {
  const start = new Date(`${today}T12:00:00`);
  const keys: string[] = [];
  for (let i = length - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(start.getDate() - i);
    keys.push(localDateKey(d));
  }
  return keys;
}

export function hoursSeries(
  days: Record<string, DayEntry>,
  range: HoursRange,
  today = localDateKey(),
  now = Date.now(),
): HoursSeries {
  const keys = rangeDateKeys(today, range === "week" ? 7 : 30);
  const points: HoursPoint[] = keys.map((date) => {
    const row = days[date];
    return {
      date,
      minutes: row ? shiftMinutes(row.labor, now) : null,
      counts: row
        ? { knocks: row.knocks, talks: row.talks, looks: row.looks, sets: row.sets }
        : { ...EMPTY_COUNTS },
    };
  });
  const counts: DayCounts = { ...EMPTY_COUNTS };
  let minutes = 0;
  let clocked = false;
  for (const point of points) {
    if (point.minutes != null) {
      clocked = true;
      minutes += point.minutes;
    }
    counts.knocks += point.counts.knocks;
    counts.talks += point.counts.talks;
    counts.looks += point.counts.looks;
    counts.sets += point.counts.sets;
  }
  return {
    range,
    points,
    clocked,
    minutes,
    hoursLabel: clocked ? formatElapsed(minutes) : "",
    counts,
    talkOfDoors: rateLabel(counts.talks, counts.knocks),
    lookOfTalks: rateLabel(counts.looks, counts.talks),
    setOfLooks: rateLabel(counts.sets, counts.looks),
    doorsPerHour: minutes >= 30 && counts.knocks > 0 ? (counts.knocks / (minutes / 60)).toFixed(1) : null,
  };
}

/** First-party week: hours + conversion. Same payload a trainer would read. */
export function weekLaborView(days: Record<string, DayEntry>, today = localDateKey(), now = Date.now()): WeekLaborView {
  const series = hoursSeries(days, "week", today, now);
  return {
    minutes: series.minutes,
    hoursLabel: series.hoursLabel,
    counts: series.counts,
    talkOfDoors: series.talkOfDoors,
    lookOfTalks: series.lookOfTalks,
    setOfLooks: series.setOfLooks,
    doorsPerHour: series.doorsPerHour,
  };
}

export function laborForCoach(shift: LaborShift): string {
  if (!shift.startedAt) return "Clock is empty. Do not invent a start time.";
  const min = shiftMinutes(shift);
  const parts = [`Started: ${shift.startedAt}`];
  if (shift.endedAt) parts.push(`Ended: ${shift.endedAt}`);
  if (min != null) parts.push(`Minutes on the clock: ${min}`);
  const line = parts.join(" / ");
  return laborIsPaused(shift) ? `Paused. ${line}` : line;
}

type DayBookState = {
  profile: DayProfile;
  days: Record<string, DayEntry>;
  inspectWalk: InspectWalkProgress;
  ensureToday: () => DayEntry;
  today: () => DayEntry;
  patchProfile: (patch: Partial<DayProfile>) => void;
  finishSetup: (profile: Partial<DayProfile>) => void;
  bump: (key: keyof DayCounts, delta: number, pinId?: string) => void;
  patchToday: (patch: Partial<Omit<DayEntry, "date">>) => void;
  startDay: () => void;
  pauseDay: () => void;
  resumeDay: () => void;
  endDay: () => void;
  setTrailOn: (on: boolean) => void;
  addTrailPoint: (point: TrailPoint) => void;
  patchInspectWalk: (patch: Partial<InspectWalkProgress>) => void;
  resetInspectWalk: () => void;
};

function prune(days: Record<string, DayEntry>, keep: string) {
  const keys = Object.keys(days).sort();
  if (keys.length <= MAX_DAYS) return days;
  const next = { ...days };
  for (const k of keys) {
    if (k === keep) continue;
    if (Object.keys(next).length <= MAX_DAYS) break;
    delete next[k];
  }
  return next;
}

export const useDayBook = create<DayBookState>()(
  persist(
    (set, get) => ({
      profile: { ...BLANK_PROFILE },

      days: {},
      inspectWalk: emptyWalk(),
      ensureToday: () => {
        const date = localDateKey();
        const existing = get().days[date];
        if (existing) return existing;
        const day = blankDay(date);
        set((s) => ({ days: prune({ ...s.days, [date]: day }, date) }));
        return day;
      },
      today: () => {
        const date = localDateKey();
        return get().days[date] ?? blankDay(date);
      },
      patchProfile: (patch) =>
        set((s) => {
          const profile = restoreProfile({ ...s.profile, ...patch });
          if (!profile.setupDone && profile.counties.trim() && profile.states.trim()) {
            profile.setupDone = true;
          }
          if (patch.ownerId !== undefined || patch.ownerLabel !== undefined) {
            writeOwner({ ownerId: profile.ownerId, ownerLabel: profile.ownerLabel });
          }
          return { profile };
        }),


      finishSetup: (patch) =>
        set((s) => {
          const date = localDateKey();
          const days = s.days[date] ? s.days : prune({ ...s.days, [date]: blankDay(date) }, date);
          return { profile: restoreProfile({ ...s.profile, ...patch, setupDone: true }), days };

        }),
      bump: (key, delta, pinId) =>
        set((s) => {
          const date = localDateKey();
          const cur = s.days[date] ?? blankDay(date);
          const next = applyCountWrite(cur, key, delta, new Date().toISOString(), pinId);
          return { days: prune({ ...s.days, [date]: next }, date) };
        }),
      patchToday: (patch) =>
        set((s) => {
          const date = localDateKey();
          const cur = s.days[date] ?? blankDay(date);
          return { days: prune({ ...s.days, [date]: { ...cur, ...patch } }, date) };
        }),
      startDay: () =>
        set((s) => {
          if (findOpenLabor(s.days)) return s;
          const date = localDateKey();
          const cur = s.days[date] ?? blankDay(date);
          const labor = startWork(cur.labor, new Date().toISOString());
          return { days: prune({ ...s.days, [date]: { ...cur, labor } }, date) };
        }),
      pauseDay: () =>
        set((s) => {
          const open = findOpenLabor(s.days);
          if (!open) return s;
          const cur = s.days[open.date] ?? blankDay(open.date);
          const labor = pauseLabor(cur.labor, new Date().toISOString());
          return { days: { ...s.days, [open.date]: { ...cur, labor } } };
        }),
      resumeDay: () =>
        set((s) => {
          const open = findOpenLabor(s.days);
          if (!open) return s;
          const cur = s.days[open.date] ?? blankDay(open.date);
          const labor = resumeLabor(cur.labor, new Date().toISOString());
          return { days: { ...s.days, [open.date]: { ...cur, labor } } };
        }),
      endDay: () =>
        set((s) => {
          const open = findOpenLabor(s.days);
          if (!open) return s;
          const cur = s.days[open.date] ?? blankDay(open.date);
          const labor = endLabor(cur.labor, new Date().toISOString());
          return { days: { ...s.days, [open.date]: { ...cur, labor } } };
        }),
      setTrailOn: (on) =>
        set((s) => {
          const open = findOpenLabor(s.days);
          if (!open) return s;
          const cur = s.days[open.date] ?? blankDay(open.date);
          const labor = setLaborTrailOn(cur.labor, on);
          return { days: { ...s.days, [open.date]: { ...cur, labor } } };
        }),
      addTrailPoint: (point) =>
        set((s) => {
          const open = findOpenLabor(s.days);
          if (!open || !open.trailOn || !laborIsRunning(open)) return s;
          const cur = s.days[open.date] ?? blankDay(open.date);
          const trail = appendTrailPoint(Array.isArray(cur.trail) ? cur.trail : [], point);
          if (trail === cur.trail) return s;
          return { days: { ...s.days, [open.date]: { ...cur, trail } } };
        }),
      patchInspectWalk: (patch) =>
        set((s) => ({
          inspectWalk: serializeWalk({ ...s.inspectWalk, ...patch }),
        })),
      resetInspectWalk: () => set({ inspectWalk: emptyWalk() }),
    }),
    {
      name: bookKey("roofus-day-v1"),
      partialize: (s) => ({ profile: s.profile, days: s.days, inspectWalk: s.inspectWalk }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<{
          profile: DayProfile;
          days: Record<string, DayEntry>;
          inspectWalk: unknown;
        }>;
        return {
          ...current,
          ...p,
          profile: restoreProfile(p.profile ?? current.profile),
          days: restoreDays(p.days ?? current.days),
          inspectWalk: restoreWalk(p.inspectWalk),
        };
      },
    },
  ),
);

if (typeof window !== "undefined") {
  void useDayBook.persist.rehydrate();
  useDayBook.persist.onFinishHydration(() => {
    void import("./adopt-company.ts").then((m) => m.adoptWhenStoresReady());
  });
}

export function dayBookForCoach(): string {
  const { profile } = useDayBook.getState();
  const day = useDayBook.getState().today();
  const lines: string[] = [
    "# Today's log (this beats any named person or town in the rest of the prompt)",
  ];
  if (profile.goBy.trim()) lines.push(`They go by: ${profile.goBy.trim()}`);
  if (profile.company.trim()) lines.push(`Company: ${profile.company.trim()}`);
  const markets = [profile.counties.trim(), profile.states.trim()].filter(Boolean).join(" / ");
  if (markets) lines.push(`They knock in: ${markets}`);
  if (profile.paperWindow.trim()) lines.push(`Morning work (not knocking): ${profile.paperWindow.trim()}`);
  if (profile.knockWindow.trim()) lines.push(`When they knock: ${profile.knockWindow.trim()}`);
  if (profile.hardStop.trim()) lines.push(`When they stop: ${profile.hardStop.trim()}`);
  lines.push(laborForCoach(day.labor));
  lines.push(
    `Today (${day.date}): ${day.knocks} doors, ${day.talks} conversations, ${day.looks} roofs, ${day.sets} appointments.`,
  );
  if (day.cluster.trim()) lines.push(`Neighborhood today: ${clusterPlanLabel(day.cluster)}`);
  if (day.storm.trim()) {
    lines.push(`Weather they wrote down (only use this; do not invent):\n${day.storm.trim()}`);
    lines.push("Storm / claim talk only if that weather matches the street they are on. Age first.");
  } else {
    lines.push("No weather logged today. Default: age and a free look. Do not invent weather.");
  }
  if (day.afterAction.trim()) lines.push(`After Action Report:\n${day.afterAction.trim()}`);
  if (day.tomorrowStreet.trim()) lines.push(`Tomorrow they start at: ${day.tomorrowStreet.trim()}`);
  if (!profile.setupDone) {
    lines.push("They have not filled counties yet. If you need their county, send them to Settings.");
  }
  lines.push("Do not assume a 3:30 start, a named town, or a specific employer.");
  return lines.join("\n");
}
