/**
 * Today's log. Phone is the live book — Notion is an optional copy.
 * Counts prune to the newest 60 days. Profile (counties, hours) is set once.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DayCounts = {
  knocks: number;
  talks: number;
  looks: number;
  sets: number;
};

export type DayEntry = DayCounts & {
  date: string;
  cluster: string;
  storm: string;
  afterAction: string;
  tomorrowStreet: string;
};

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
  };
}

type DayBookState = {
  profile: DayProfile;
  days: Record<string, DayEntry>;
  ensureToday: () => DayEntry;
  today: () => DayEntry;
  patchProfile: (patch: Partial<DayProfile>) => void;
  finishSetup: (profile: Partial<DayProfile>) => void;
  bump: (key: keyof DayCounts, delta: number) => void;
  patchToday: (patch: Partial<Omit<DayEntry, "date">>) => void;
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
      patchProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
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
    }),
    {
      name: "roofus-day-v1",
      partialize: (s) => ({ profile: s.profile, days: s.days }),
    },
  ),
);

if (typeof window !== "undefined") {
  void useDayBook.persist.rehydrate();
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
  if (day.cluster.trim()) lines.push(`Neighborhood today: ${day.cluster.trim()}`);
  if (day.storm.trim()) {
    lines.push(`Weather they wrote down (only use this; do not invent):\n${day.storm.trim()}`);
    lines.push("Storm / claim talk only if that weather matches the street they are on. Age first.");
  } else {
    lines.push("No weather logged today. Default: age and a free look. Do not invent weather.");
  }
  if (day.afterAction.trim()) lines.push(`After Action Report:\n${day.afterAction.trim()}`);
  if (day.tomorrowStreet.trim()) lines.push(`Tomorrow they start at: ${day.tomorrowStreet.trim()}`);
  if (!profile.setupDone) {
    lines.push("They have not filled Today yet. If you need their county, send them to Today.");
  }
  lines.push("Do not assume a 3:30 start, a named town, or a specific employer.");
  return lines.join("\n");
}
