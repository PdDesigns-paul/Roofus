import { packAfterAction, unpackAfterAction } from "@/lib/day-book";

/** Lives on Prep. Truck Night is a Go to Prep#finish. One store — day.afterAction. */
export function AarFields({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const aar = unpackAfterAction(value);
  function set(key: "wins" | "better" | "plan", next: string) {
    onChange(packAfterAction({ ...aar, [key]: next }));
  }
  return (
    <section className="mt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">After Action Report</p>
      <p className="mt-0.5 text-xs leading-snug text-muted">
        Wins first. Exhaust the list. Then two more. Facts, not “I suck.” A plan with verbs.
      </p>
      <label className="mt-3 block min-w-0">
        <span className="text-xs text-muted">I did this well</span>
        <textarea
          className="mt-1 min-h-16 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-base leading-relaxed"
          value={aar.wins}
          onChange={(e) => set("wins", e.target.value)}
        />
      </label>
      <label className="mt-2 block min-w-0">
        <span className="text-xs text-muted">Do better next time</span>
        <textarea
          className="mt-1 min-h-14 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-base leading-relaxed"
          value={aar.better}
          onChange={(e) => set("better", e.target.value)}
        />
      </label>
      <label className="mt-2 block min-w-0">
        <span className="text-xs text-muted">The plan</span>
        <textarea
          className="mt-1 min-h-14 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-base leading-relaxed"
          value={aar.plan}
          onChange={(e) => set("plan", e.target.value)}
          placeholder="Ask three how/what questions before I answer."
        />
      </label>
    </section>
  );
}
