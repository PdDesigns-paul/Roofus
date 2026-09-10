/** Nags when they open the app. Morning storm, evening journal, Sunday pace, the 1st stack. */
import { localDateKey } from "./day-book.ts";
import { setupScore, type SetupSnap } from "./setup-progress.ts";

export const REMINDERS = [
  {
    id: "setup",
    label: "Finish setup",
    when: "Until territory is in",
    hint: "Name, counties, state. The bar on Home.",
    to: "/",
  },
  {
    id: "storm",
    label: "Storm report",
    when: "Morning",
    hint: "Last 48 hours. Only if you open before noon and it is empty.",
    to: "/today",
  },
  {
    id: "journal",
    label: "Tracking + journal",
    when: "Evening",
    hint: "Four counts. After Action Report. After 5, if it is blank.",
    to: "/today",
  },
  {
    id: "pace",
    label: "Weekly pace",
    when: "Sundays",
    hint: "Gear and one off-block. Presets → Mindset.",
    to: "/settings",
    hash: "mindset",
  },
  {
    id: "stack",
    label: "Monthly stack",
    when: "The 1st",
    hint: "Three skills this month.",
    to: "/settings",
    hash: "mindset",
  },
] as const;

export type ReminderId = (typeof REMINDERS)[number]["id"];

export type ReminderPrefs = {
  on: Record<ReminderId, boolean>;
  lastDone: Partial<Record<ReminderId, string>>;
};

export type RemindClock = {
  hour: number;
  weekday: number;
  day: number;
};

export const DEFAULT_REMINDER_ON: Record<ReminderId, boolean> = {
  setup: true,
  storm: true,
  journal: true,
  pace: true,
  stack: true,
};

export function blankReminderPrefs(): ReminderPrefs {
  return { on: { ...DEFAULT_REMINDER_ON }, lastDone: {} };
}

export function nowClock(d = new Date()): RemindClock {
  return { hour: d.getHours(), weekday: d.getDay(), day: d.getDate() };
}

function daysBetween(a: string, b: string): number {
  const to = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
  };
  return Math.round((to(b) - to(a)) / 86_400_000);
}

export function reminderDue(
  id: ReminderId,
  prefs: ReminderPrefs,
  today: string,
  ready: boolean,
  extra: { afterAction: string; stormFetchedOn: string; stackMonth: string },
  clock: RemindClock,
): boolean {
  if (!prefs.on[id]) return false;
  if ((prefs.lastDone[id] ?? "") === today) return false;
  if (id === "setup") return !ready;
  if (id === "storm") {
    if (clock.hour >= 12) return false;
    return extra.stormFetchedOn !== today;
  }
  if (id === "journal") {
    if (clock.hour < 17) return false;
    return !extra.afterAction.trim();
  }
  if (id === "pace") {
    if (clock.weekday !== 0) return false;
    const done = prefs.lastDone[id] ?? "";
    if (!done) return true;
    return daysBetween(done, today) >= 7;
  }
  if (clock.day !== 1) return false;
  const month = today.slice(0, 7);
  if (extra.stackMonth === month) return false;
  return true;
}

export function dueReminders(
  prefs: ReminderPrefs,
  snap: SetupSnap,
  extra: { afterAction: string; stormFetchedOn: string; stackMonth: string },
  today = localDateKey(),
  clock = nowClock(),
) {
  return REMINDERS.filter((r) => reminderDue(r.id, prefs, today, setupScore(snap).ready, extra, clock));
}
