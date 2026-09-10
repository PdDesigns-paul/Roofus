/**
 * Nags when they open the app. Lock-screen push uses Notion as the drawer
 * (same secret as backup) plus a morning/evening ping. No Firebase.
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
    hint: "Last 48 hours. Morning ping if Notion is connected.",
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
  ready: boolean,
  extra: { afterAction: string; stormFetchedOn: string; stackMonth: string },
): boolean {
  if (!prefs.on[id]) return false;
  if (id === "setup") return !ready;
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
  return REMINDERS.filter((r) => reminderDue(r.id, prefs, today, setupScore(snap).ready, extra));
}

export function pingCopy(ids: ReminderId[]): { title: string; body: string; url: string } {
  const labels = ids
    .map((id) => REMINDERS.find((r) => r.id === id)?.label)
    .filter((v) => Boolean(v));
  const url = ids.includes("setup")
    ? "/"
    : ids.includes("pace") || ids.includes("stack")
      ? "/settings#mindset"
      : "/today";
  return {
    title: "Roofus",
    body: labels.length ? labels.join(" · ") : "Open the app.",
    url,
  };
}
