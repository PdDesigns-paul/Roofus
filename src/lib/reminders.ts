/**
 * Nags when they open the app. Real lock-screen push needs the PWA installed
 * plus a later Vercel cron + Web Push (iOS 16.4+ only after Add to Home Screen).
 * Do not add a VAPID key until they turn that on.
 */
import { localDateKey } from "./day-book.ts";
import { setupScore, type SetupSnap } from "./setup-progress.ts";

export const REMINDERS = [
  {
    id: "setup",
    label: "Finish setup",
    when: "Until territory is in",
    hint: "Name, counties, state. The bar on Home.",
  },
  {
    id: "storm",
    label: "Storm report",
    when: "Daily",
    hint: "Last 48 hours. Cron later. Until then, this nags when you open the app.",
  },
  {
    id: "journal",
    label: "Tracking + journal",
    when: "Daily",
    hint: "Four counts. After Action Report on Today.",
  },
  {
    id: "pace",
    label: "Weekly pace",
    when: "Weekly",
    hint: "Gear and one off-block. Presets → Mindset.",
  },
  {
    id: "stack",
    label: "Monthly stack",
    when: "Monthly",
    hint: "Three skills this month.",
  },
] as const;

export type ReminderId = (typeof REMINDERS)[number]["id"];

export type ReminderPrefs = {
  on: Record<ReminderId, boolean>;
  lastDone: Partial<Record<ReminderId, string>>;
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
  snap: SetupSnap,
  extra: { afterAction: string; stormFetchedOn: string; stackMonth: string },
): boolean {
  if (!prefs.on[id]) return false;
  if (id === "setup") return !setupScore(snap).ready;
  const done = prefs.lastDone[id] ?? "";
  if (id === "storm") return extra.stormFetchedOn !== today && done !== today;
  if (id === "journal") {
    if (extra.afterAction.trim()) return false;
    return done !== today;
  }
  if (id === "pace") {
    if (!done) return true;
    return daysBetween(done, today) >= 7;
  }
  const month = today.slice(0, 7);
  if (extra.stackMonth === month) return false;
  return done.slice(0, 7) !== month;
}

export function dueReminders(
  prefs: ReminderPrefs,
  snap: SetupSnap,
  extra: { afterAction: string; stormFetchedOn: string; stackMonth: string },
  today = localDateKey(),
) {
  return REMINDERS.filter((r) => reminderDue(r.id, prefs, today, snap, extra));
}
