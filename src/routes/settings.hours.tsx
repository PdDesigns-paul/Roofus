import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localDateKey, useDayBook, weekLaborView, weekTallyLine } from "@/lib/day-book";

export const Route = createFileRoute("/settings/hours")({
  codeSplitGroupings: [],
  component: HoursPage,
});

function HoursPage() {
  const profile = useDayBook((st) => st.profile);
  const patchProfile = useDayBook((st) => st.patchProfile);
  const days = useDayBook((st) => st.days);
  const week = weekLaborView(days, localDateKey());
  const countLine = week.counts.knocks || week.counts.talks || week.counts.looks || week.counts.sets
    ? weekTallyLine(week.counts)
    : "";
  const rates = [week.talkOfDoors && `Talked ${week.talkOfDoors} of doors`, week.lookOfTalks && `look ${week.lookOfTalks} of talks`, week.setOfLooks && `set ${week.setOfLooks} of looks`]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Hours" />

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Usual hours — policy. The clock on Today is what you worked. These numbers are yours.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <div className="min-w-0">
          <Label htmlFor="knockWindow">When do you knock?</Label>
          <Input
            id="knockWindow"
            className="mt-1"
            value={profile.knockWindow}
            onChange={(e) => patchProfile({ knockWindow: e.target.value })}
            placeholder="After work, 3–4 hours"
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="paperWindow">Morning work</Label>
          <Input
            id="paperWindow"
            className="mt-1"
            value={profile.paperWindow}
            onChange={(e) => patchProfile({ paperWindow: e.target.value })}
            placeholder="Calls and paperwork — not porches"
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="hardStop">When do you stop?</Label>
          <Input
            id="hardStop"
            className="mt-1"
            value={profile.hardStop}
            onChange={(e) => patchProfile({ hardStop: e.target.value })}
            placeholder="When it gets dark"
          />
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-surface px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">This week</p>
        {week.hoursLabel ? (
          <>
            <p className="mt-2 font-display text-4xl tabular-nums leading-none">{week.hoursLabel}</p>
            <p className="mt-1 text-sm text-muted">on the clock</p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed">
            No clock this week.{" "}
            <Link to="/truck" className="text-fg underline underline-offset-4">
              Start on Today
            </Link>
            .
          </p>
        )}
        {countLine ? <p className="mt-3 text-sm leading-relaxed">{countLine}</p> : null}
        {rates ? <p className="mt-1 text-sm leading-relaxed">{rates}</p> : null}
        {week.doorsPerHour ? (
          <p className="mt-1 text-sm leading-relaxed">{week.doorsPerHour} doors / hour</p>
        ) : null}
      </section>
    </main>
  );
}
