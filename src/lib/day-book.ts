/**
 * Today's log. Phone is the live book — Notion is an optional copy.
 * Counts prune to the newest 60 days. Profile (counties, hours) is set once.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clusterPlanLabel } from "./streets-rank.ts";
import { emptyWalk, restoreWalk, serializeWalk, type InspectWalkProgress } from "./inspect-walk.ts";
import { emptyProcess, processLineForCoach, processStrip, type ProcessSaved } from "./process-day.ts";

export type DayCounts = {
  knocks: number;
  talks: number;
  looks: number;
  sets: number;
};

export type AfterAction = { wins: string; better: string; plan: string };

export type DayEntry = DayCounts & {
  date: string;
  cluster: string;
  storm: string;
  afterAction: string;
  tomorrowStreet: string;
  process?: ProcessSaved;
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
};

const MAX_DAYS = 60;

export const EMPTY_COUNTS: DayCounts = { knocks: 0, talks: 0, looks: 0, sets: 0 };

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
    process: emptyProcess(),
  };
}

type DayBookState = {
  profile: DayProfile;
  days: Record<string, DayEntry>;
  inspectWalk: InspectWalkProgress;
  ensureToday: () => DayEntry;
  today: () => DayEntry;
  patchProfile: (patch: Partial<DayProfile>) => void;
  finishSetup: (profile: Partial<DayProfile>) => void;
  bump: (key: keyof DayCounts, delta: number) => void;
  patchToday: (patch: Partial<Omit<DayEntry, "date">>) => void;
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
      profile: {
        setupDone: false,
        goBy: "",
        company: "",
        counties: "",
        states: "",
        knockWindow: "",
        paperWindow: "",
        hardStop: "",
      },
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
          const profile = { ...s.profile, ...patch };
          if (!profile.setupDone && profile.counties.trim() && profile.states.trim()) {
            profile.setupDone = true;
          }
          return { profile };
        }),
      finishSetup: (patch) =>
        set((s) => {
          const date = localDateKey();
          const days = s.days[date] ? s.days : prune({ ...s.days, [date]: blankDay(date) }, date);
          return { profile: { ...s.profile, ...patch, setupDone: true }, days };
        }),
      bump: (key, delta) =>
        set((s) => {
          const date = localDateKey();
          const cur = s.days[date] ?? blankDay(date);
          const next = { ...cur, [key]: Math.max(0, cur[key] + delta) };
          return { days: prune({ ...s.days, [date]: next }, date) };
        }),
      patchToday: (patch) =>
        set((s) => {
          const date = localDateKey();
          const cur = s.days[date] ?? blankDay(date);
          return { days: prune({ ...s.days, [date]: { ...cur, ...patch } }, date) };
        }),
      patchInspectWalk: (patch) =>
        set((s) => ({
          inspectWalk: serializeWalk({ ...s.inspectWalk, ...patch }),
        })),
      resetInspectWalk: () => set({ inspectWalk: emptyWalk() }),
    }),
    {
      name: "roofus-day-v1",
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
  lines.push(processLineForCoach(processStrip(day)));
  if (!profile.setupDone) {
    lines.push("They have not filled counties yet. If you need their county, send them to Settings.");
  }
  lines.push("Do not assume a 3:30 start, a named town, or a specific employer.");
  return lines.join("\n");
}
