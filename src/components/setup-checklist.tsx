import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { SETUP_ROWS, rowDone, setupScore, type SetupSnap } from "@/lib/setup-progress";
import { openSetup } from "@/lib/open-coach";
import { dueReminders } from "@/lib/reminders";
import { useReminders } from "@/lib/reminders-store";

export function SetupChecklist({
  snap,
  afterAction,
  stormFetchedOn,
  stackMonth,
}: {
  snap: SetupSnap;
  afterAction: string;
  stormFetchedOn: string;
  stackMonth: string;
}) {
  const [hidden, setHidden] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem("roofus-setup-hide") === "1",
  );
  const score = setupScore(snap);
  const on = useReminders((s) => s.on);
  const lastDone = useReminders((s) => s.lastDone);
  const markDone = useReminders((s) => s.markDone);
  const due = dueReminders({ on, lastDone }, snap, { afterAction, stormFetchedOn, stackMonth });

  if (hidden && score.done === score.total) {
    return null;
  }

  const pct = Math.round((score.done / score.total) * 100);

  return (
    <section className="mt-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Setup</p>
          <p className="mt-1 text-sm text-fg">
            {score.ready ? "Ready to knock." : "Counties first. Then you can knock."} {score.done} of {score.total}
          </p>
        </div>
        {score.done === score.total ? (
          <button
            type="button"
            className="text-xs text-faint hover:text-fg"
            onClick={() => {
              localStorage.setItem("roofus-setup-hide", "1");
              setHidden(true);
            }}
          >
            Hide
          </button>
        ) : null}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>

      {due.length ? (
        <ul className="mt-3 flex flex-col gap-1">
          {due.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted">{r.label}</span>
              <button
                type="button"
                className="text-xs text-faint hover:text-fg"
                onClick={() => markDone(r.id)}
              >
                Did it
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="mt-3 flex flex-col">
        {SETUP_ROWS.map((row) => {
          const done = rowDone(row.id, snap);
          return (
            <li key={row.id} className="flex items-stretch gap-2 border-b border-border last:border-0">
              <Link to="/settings" hash={row.hash} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-3">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                    done ? "border-accent bg-accent text-paper" : "border-border text-faint"
                  }`}
                  aria-hidden
                >
                  {done ? "✓" : ""}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm text-fg">{row.label}</span>
                  <span className="text-xs text-faint">{row.hint}</span>
                </span>
              </Link>
              <button
                type="button"
                className="shrink-0 px-2 text-xs text-muted hover:text-fg"
                onClick={() => openSetup(row.id)}
              >
                Ask
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
