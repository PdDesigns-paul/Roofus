import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { HoursClockChart, HoursCountRows, HoursStampStrip } from "@/components/hours-charts";
import { AppHeader } from "@/components/app-header";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hoursSeries, isCountKey, localDateKey, useDayBook, type CountKey, type HoursRange } from "@/lib/day-book";
import { pack } from "@/lib/tenant";

export const Route = createFileRoute("/settings/hours")({
  codeSplitGroupings: [],
  component: HoursPage,
});

function HoursPage() {
  const profile = useDayBook((st) => st.profile);
  const patchProfile = useDayBook((st) => st.patchProfile);
  const days = useDayBook((st) => st.days);
  const [range, setRange] = useState<HoursRange>("week");
  const series = hoursSeries(days, range, localDateKey());
  const units = pack.labor.units;
  const countUnits = units.filter((u): u is (typeof units)[number] & { key: CountKey } => isCountKey(u.key));
  const primary = countUnits[0] ?? units[0];
  const countLine = countUnits.map((u) => `${series.counts[u.key]} ${u.label}`).join(" · ");
  const hasCounts = countUnits.some((u) => series.counts[u.key] > 0);
  const rateParts = [
    series.talkOfDoors && units[1] && units[0] ? `${units[1].label} ${series.talkOfDoors} of ${units[0].label.toLowerCase()}` : "",
    series.lookOfTalks && units[2] && units[1] ? `${units[2].label} ${series.lookOfTalks} of ${units[1].label.toLowerCase()}` : "",
    series.setOfLooks && units[3] && units[2] ? `${units[3].label} ${series.setOfLooks} of ${units[2].label.toLowerCase()}` : "",
  ].filter(Boolean);
  const rates = rateParts.join(" · ");
  const stamps = series.points.flatMap((p) => days[p.date]?.stamps ?? []);
  const empty = !series.clocked && !hasCounts;

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

      <div className="mt-8 flex flex-wrap gap-2">
        <Chip selected={range === "week"} onClick={() => setRange("week")}>
          This week
        </Chip>
        <Chip selected={range === "30"} onClick={() => setRange("30")}>
          Last 30
        </Chip>
      </div>

      <section className="mt-3 rounded-2xl border border-border bg-surface px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">{range === "week" ? "This week" : "Last 30"}</p>
        {series.hoursLabel ? (
          <>
            <p className="mt-2 font-display text-4xl tabular-nums leading-none">{series.hoursLabel}</p>
            <p className="mt-1 text-sm text-muted">on the clock</p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed">
            No clock {range === "week" ? "this week" : "in the last 30 days"}.{" "}
            <Link to="/truck" className="text-fg underline underline-offset-4">
              Start on Today
            </Link>
            .
          </p>
        )}
        {hasCounts ? <p className="mt-3 text-sm leading-relaxed">{countLine}</p> : null}
        {rates ? <p className="mt-1 text-sm leading-relaxed">{rates}</p> : null}
        {series.doorsPerHour && primary ? (
          <p className="mt-1 text-sm leading-relaxed">
            {series.doorsPerHour} {primary.label.toLowerCase()} / hour
          </p>
        ) : null}
        {empty ? null : (
          <>
            <HoursClockChart series={series} />
            <HoursCountRows series={series} units={units} />
            {primary ? <HoursStampStrip stamps={stamps} unit={primary.key} label={primary.label} /> : null}
          </>
        )}
      </section>
    </main>
  );
}
