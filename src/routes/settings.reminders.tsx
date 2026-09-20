import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { REMINDERS } from "@/lib/reminders";
import { useReminders } from "@/lib/reminders-store";
import { pack } from "@/lib/tenant";


export const Route = createFileRoute("/settings/reminders")({
  codeSplitGroupings: [],
  component: RemindersPage,
});

function RemindersPage() {
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Reminders" />
      <p className="mt-5 text-sm leading-relaxed text-muted">
        When you open Roofus. Morning: storm report if it is empty. Evening: After Action Report on
        Plan if it is blank. Sundays: pace. The 1st: talent stack.
      </p>
      <ReminderToggles />
    </main>
  );
}

function ReminderToggles() {
  const on = useReminders((s) => s.on);
  const toggle = useReminders((s) => s.toggle);
  return (
    <ul className="mt-3 flex flex-col">
      {REMINDERS.filter((r) => r.id !== "storm" || pack.modules.storms).map((r) => (

        <li key={r.id} className="flex min-h-14 items-center justify-between gap-3 border-b border-border last:border-0 py-3">
          <span className="min-w-0">
            <span className="block text-sm text-fg">{r.label}</span>
            <span className="block text-xs text-faint">
              {r.when}. {r.hint}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={on[r.id]}
            className={`h-7 w-12 shrink-0 rounded-full ${on[r.id] ? "bg-accent" : "bg-surface-2"}`}
            onClick={() => toggle(r.id)}
          >
            <span className="sr-only">{on[r.id] ? "On" : "Off"}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
