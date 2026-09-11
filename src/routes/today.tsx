import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { InstallHint } from "@/components/install-hint";
import { whenCoachReady, useCoach } from "@/lib/coach-store";
import { useNotion } from "@/lib/notion-store";
import { abortTalk, sendRoofus } from "@/lib/roofus-talk";
import {
  blankDay,
  localDateKey,
  packAfterAction,
  unpackAfterAction,
  useDayBook,
  type DayCounts,
} from "@/lib/day-book";
import { mapsLabel, mapsUrl } from "@/lib/maps-url";
import { stormsNearLoop } from "@/lib/weather-match";
import { useWeather } from "@/lib/weather-store";
import type { StormEvent } from "@/lib/weather-types";
import { preKnock } from "@/lib/pocket-cards";
import { companyOf } from "@/lib/setup-progress";
import { useSettings } from "@/lib/settings-store";
import {
  addCluster,
  addLoopToPlan,
  clusterLines,
  dropCluster,
  dropLoopFromPlan,
  firstRemainingInPlan,
  groupLoopsByTownship,
  loopHeadline,
  loopInPlan,
  loopLabel,
  loopsInPlan,
  matchLoopCluster,
  MAX_TODAY_LOOPS,
} from "@/lib/streets-rank";
import { suggestTomorrow, useStreets } from "@/lib/streets-store";
import type { StreetLoop } from "@/lib/streets-types";

export const Route = createFileRoute("/today")({
  codeSplitGroupings: [],
  component: TodayJournal,
});

export function TodayJournal() {
  return <DaySheet />;
}

const COUNTERS: { key: keyof DayCounts; label: string; hint: string }[] = [
  { key: "knocks", label: "Doors", hint: "I knocked" },
  { key: "talks", label: "Talked", hint: "Someone answered" },
  { key: "looks", label: "On the roof", hint: "I went up" },
  { key: "sets", label: "Appointments", hint: "On the calendar" },
];

function stormsNearPlan(kept: StormEvent[], plan: StreetLoop[]): StormEvent[] {
  const seen = new Set<string>();
  const out: StormEvent[] = [];
  for (const loop of plan) {
    for (const s of stormsNearLoop(kept, loop)) {
      if (seen.has(s.id)) continue;
      seen.add(s.id);
      out.push(s);
    }
  }
  return out;
}

function DaySheet() {
  const date = localDateKey();
  const stored = useDayBook((s) => s.days[date]);
  const day = stored ?? blankDay(date);
  const bump = useDayBook((s) => s.bump);
  const patchToday = useDayBook((s) => s.patchToday);
  const profile = useDayBook((s) => s.profile);
  const companyName = useSettings((s) => s.companyName);
  const loops = useStreets((s) => s.loops);
  const ageMin = useStreets((s) => s.ageMin);
  const ageMax = useStreets((s) => s.ageMax);
  const kept = useWeather((s) => s.kept);
  const busy = useCoach((s) => s.busy);
  const [askErr, setAskErr] = useState<string | null>(null);
  const plan = loopsInPlan(loops, day.cluster);
  const current = firstRemainingInPlan(loops, day.cluster);
  const extra = Math.max(0, clusterLines(day.cluster).length - 1);
  const nearby = stormsNearPlan(kept, plan);

  useEffect(() => {
    if (!plan.length || day.storm.trim() || !nearby.length) return;
    patchToday({ storm: nearby.map((s) => s.say).join(" ") });
    // only fill when they pick a loop and the box is empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.cluster]);

  function applyPlan(next: string) {
    patchToday({ cluster: next });
    const hit = firstRemainingInPlan(loops, next);
    if (hit) useStreets.getState().setStatus(hit.id, "working");
  }

  function askAboutToday() {
    setAskErr(null);
    const next = suggestTomorrow(useStreets.getState().loops);
    if (next && !useDayBook.getState().today().tomorrowStreet.trim()) {
      patchToday({ tomorrowStreet: `${loopLabel(next)} — ${next.streets.slice(0, 3).join(", ")}` });
    }
    whenCoachReady(() => {
      abortTalk();
      useCoach.getState().startNew();
      useCoach.getState().openSheet();
      void (async () => {
        try {
          await sendRoofus(
            "Read today's log, the loop list, and the 48-hour weather pulse. Tell me what the numbers say. Then name tomorrow: a High lead on a loop I keep jumps Working. Then Working. Then the next age-band loop in that township. Medium and Low do not pick the day. Don't invent weather. Keep is what I may say on the porch.",
          );
        } catch (e) {
          setAskErr(e instanceof Error ? e.message : "Roofus missed that.");
        }
      })();
    });
  }

  const market = [profile.counties, profile.states].filter(Boolean).join(", ");
  const working = loops.find((l) => l.status === "working");
  const knock = preKnock({
    cluster: clusterLines(day.cluster)[0] ?? "",
    storm: day.storm,
    goBy: profile.goBy,
    company: companyOf(profile.company, companyName),
    knockWindow: profile.knockWindow,
    hardStop: profile.hardStop,
    ageMin,
    ageMax,
    workingZip: working ? loopLabel(working) : "",
  });

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Today" />
      {!profile.counties.trim() || !profile.states.trim() ? (
        <Link
          to="/"
          className="mt-3 flex min-h-12 items-center rounded-2xl border border-border px-4 text-sm text-muted"
        >
          Finish setup on Home — counties and a state so Streets can build loops.
        </Link>
      ) : null}
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-faint">{day.date}</p>
      <h1 className="mt-1 font-display text-2xl leading-tight tracking-tight">
        {profile.goBy.trim() ? `${profile.goBy.trim()}'s day` : "Today"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {market ? (
          <>
            {market}
            {profile.knockWindow.trim() ? ` · ${profile.knockWindow.trim()}` : ""}{" "}
            <Link to="/settings/hours" className="underline-offset-4 hover:text-fg hover:underline">
              Presets
            </Link>
          </>
        ) : (
          <>
            Set counties in{" "}
            <Link to="/settings/territory" className="underline-offset-4 hover:text-fg hover:underline">
              Presets
            </Link>
            .
          </>
        )}
      </p>

      <section className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Before you knock</p>
        <p className="mt-2 font-display text-2xl tracking-tight">
          {current ? loopHeadline(current) : knock.zip}
          {extra ? <span className="text-lg font-normal text-muted">{` + ${extra} more`}</span> : null}
        </p>
        <p className="mt-1 text-sm text-muted">
          {knock.age}
          {knock.hours ? ` · ${knock.hours}` : ""}
        </p>
        <p className="mt-2 text-sm leading-relaxed">{knock.weather}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{knock.script}</p>
        <p className="mt-3 text-sm leading-relaxed">{knock.opener}</p>
        <Link
          to="/coach/cards"
          className="mt-3 inline-flex h-11 items-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Pocket cards
        </Link>
      </section>

      <section className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Tap to count</p>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {COUNTERS.map((c) => (
            <li key={c.key} className="min-w-0 rounded-2xl border border-border bg-surface px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-faint">{c.label}</p>
              <p className="mt-0.5 font-display text-2xl tabular-nums leading-none">{day[c.key]}</p>
              <p className="mt-0.5 text-xs text-muted">{c.hint}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  aria-label={`Minus ${c.label}`}
                  className="h-10 flex-1 rounded-full border border-border text-sm"
                  onClick={() => bump(c.key, -1)}
                >
                  −
                </button>
                <button
                  type="button"
                  aria-label={`Plus ${c.label}`}
                  className="h-10 flex-1 rounded-full bg-fg text-sm text-paper"
                  onClick={() => bump(c.key, 1)}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Neighborhood today</p>
        <p className="mt-0.5 text-xs leading-snug text-muted">
          {loops.length
            ? "Check backups in case one is picked over. First remaining is Working."
            : "Build Streets from your counties, or type a loop · zip."}
        </p>
        {loops.length ? (
          <LoopPlan loops={loops} cluster={day.cluster} onPlan={applyPlan} />
        ) : (
          <input
            className="mt-2 h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
            value={day.cluster}
            onChange={(e) => applyPlan(e.target.value)}
            placeholder="Loop · zip, or type"
          />
        )}
      </section>
      <Link to="/streets" className="mt-2 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
        {loops.length ? "Open Streets" : "Build loops from my counties"}
      </Link>
      {plan.map((l) => (
        <a
          key={l.id}
          href={mapsUrl(l)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          {mapsLabel(l)}
        </a>
      ))}

      <Field
        label="Weather you can mention"
        hint="From a storm you Keep. Use today copies it if this box is empty. Age first."
      >
        <textarea
          className="mt-2 min-h-16 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-base leading-relaxed"
          value={day.storm}
          onChange={(e) => patchToday({ storm: e.target.value })}
          placeholder="Yesterday’s cell, 1 inch hail in Hampden — only if that’s true."
        />
      </Field>
      <Link to="/storms" className="mt-2 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
        Storms
      </Link>

      <AarFields value={day.afterAction} onChange={(v) => patchToday({ afterAction: v })} />

      <Field label="Tomorrow I start at">
        <input
          className="mt-2 h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
          value={day.tomorrowStreet}
          onChange={(e) => patchToday({ tomorrowStreet: e.target.value })}
        />
      </Field>

      <button
        type="button"
        disabled={busy}
        onClick={askAboutToday}
        className="mt-5 h-11 rounded-full bg-fg text-sm text-paper disabled:opacity-40"
      >
        Ask Roofus how today went
      </button>
      {askErr ? <p className="mt-2 text-sm text-danger">{askErr}</p> : null}

      <InstallHint />
      <NotionHint />
    </main>
  );
}

const COLLAPSE_ABOVE = 24;

function LoopPlan({
  loops,
  cluster,
  onPlan,
}: {
  loops: StreetLoop[];
  cluster: string;
  onPlan: (next: string) => void;
}) {
  const [typed, setTyped] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const many = loops.length > COLLAPSE_ABOVE;
  const atCap = clusterLines(cluster).length >= MAX_TODAY_LOOPS;
  const unmatched = clusterLines(cluster).filter((line) => !loops.some((l) => matchLoopCluster(l, line)));

  function toggle(loop: StreetLoop) {
    const on = loopInPlan(loop, cluster);
    if (!on && atCap) return;
    onPlan(on ? dropLoopFromPlan(cluster, loop) : addLoopToPlan(cluster, loop));
  }

  function addTyped() {
    const value = typed.trim();
    if (!value) return;
    const hit = loops.find((l) => matchLoopCluster(l, value) || loopHeadline(l).toLowerCase() === value.toLowerCase());
    onPlan(hit ? addLoopToPlan(cluster, hit) : addCluster(cluster, value));
    setTyped("");
  }

  return (
    <>
      {unmatched.length ? (
        <ul className="mt-2 space-y-1">
          {unmatched.map((line) => (
            <li
              key={line}
              className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-border px-3"
            >
              <span className="min-w-0 truncate text-sm">{line}</span>
              <button
                type="button"
                className="shrink-0 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
                onClick={() => onPlan(dropCluster(cluster, line))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 space-y-2">
        {groupLoopsByTownship(loops).map((g) =>
          g.townships.map((t) => {
            const key = `${g.county}-${t.township}`;
            const hasPick = t.loops.some((l) => loopInPlan(l, cluster));
            const shown = !many || hasPick || open[key];
            return (
              <div key={key} className="rounded-2xl border border-border">
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm"
                  onClick={() => setOpen((s) => ({ ...s, [key]: !shown }))}
                  aria-expanded={shown}
                >
                  <span className="min-w-0 truncate">
                    {t.township} · {g.county}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {hasPick ? `${t.loops.filter((l) => loopInPlan(l, cluster)).length} on` : `${t.loops.length}`}
                  </span>
                </button>
                {shown
                  ? t.loops.map((l) => {
                      const on = loopInPlan(l, cluster);
                      return (
                        <label
                          key={l.id}
                          className="flex min-h-11 items-center gap-3 border-t border-border px-3 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="h-5 w-5 shrink-0"
                            checked={on}
                            disabled={!on && atCap}
                            onChange={() => toggle(l)}
                          />
                          <span className="min-w-0 leading-snug">{loopHeadline(l)}</span>
                        </label>
                      );
                    })
                  : null}
              </div>
            );
          }),
        )}
      </div>
      {atCap ? <p className="mt-2 text-xs text-muted">Eight loops is enough for one day.</p> : null}
      <input
        className="mt-2 h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
        value={typed}
        onChange={(e) => {
          const value = e.target.value;
          const hit = loops.find((l) => loopHeadline(l) === value);
          if (hit) {
            onPlan(addLoopToPlan(cluster, hit));
            setTyped("");
            return;
          }
          setTyped(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTyped();
          }
        }}
        placeholder="Add another loop · zip"
        list="street-loops"
      />
      <datalist id="street-loops">
        {loops.map((l) => (
          <option key={l.id} value={loopHeadline(l)} />
        ))}
      </datalist>
    </>
  );
}

function NotionHint() {
  const connected = useNotion((s) => Boolean(s.ids && s.token));
  const hidden = useNotion((s) => s.hintHidden);
  const hide = useNotion((s) => s.hideHint);
  if (connected || hidden) return null;
  return (
    <div className="mt-6 rounded-2xl border border-border px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">Recommended</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Copy your days to a free Notion so a dead phone is not a dead year. Optional. Presets.
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          to="/settings/backup"
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-fg text-sm text-paper"
        >
          Set up backup
        </Link>
        <button type="button" className="h-11 flex-1 rounded-full border border-border text-sm" onClick={hide}>
          Not now
        </button>
      </div>
    </div>
  );
}

function AarFields({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="mt-4 block min-w-0">
      <span className="text-xs font-medium uppercase tracking-wide text-faint">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs leading-snug text-muted">{hint}</span> : null}
      {children}
    </label>
  );
}
