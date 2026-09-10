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
import { preKnock } from "@/lib/pocket-cards";
import { companyOf } from "@/lib/setup-progress";
import { useSettings } from "@/lib/settings-store";
import { groupLoopsByTownship, loopHeadline, loopLabel, matchLoopCluster } from "@/lib/streets-rank";
import { suggestTomorrow, useStreets } from "@/lib/streets-store";

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
  const selected = loops.find((l) => matchLoopCluster(l, day.cluster)) ?? null;
  const nearby = selected ? stormsNearLoop(kept, selected) : [];

  useEffect(() => {
    if (!selected || day.storm.trim() || !nearby.length) return;
    patchToday({ storm: nearby.map((s) => s.say).join(" ") });
    // only fill when they pick a loop and the box is empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.cluster]);

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
    cluster: day.cluster,
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
          {selected ? loopHeadline(selected) : knock.zip}
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

      <Field
        label="Neighborhood today"
        hint={
          loops.length
            ? "Park-once loop from Streets. Pick or type."
            : "Build Streets from your counties, or type a loop · zip."
        }
      >
        {loops.length ? (
          <select
            className="mt-2 h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
            value={selected ? loopHeadline(selected) : ""}
            onChange={(e) => {
              const value = e.target.value;
              patchToday({ cluster: value });
              const hit = loops.find((l) => matchLoopCluster(l, value));
              if (hit) useStreets.getState().setStatus(hit.id, "working");
            }}
          >
            <option value="">Pick a loop</option>
            {groupLoopsByTownship(loops).map((g) =>
              g.townships.map((t) => (
                <optgroup key={`${g.county}-${t.township}`} label={`${t.township} · ${g.county}`}>
                  {t.loops.map((l) => (
                    <option key={l.id} value={loopHeadline(l)}>
                      {loopHeadline(l)}
                    </option>
                  ))}
                </optgroup>
              )),
            )}
          </select>
        ) : null}
        <input
          className="mt-2 h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
          value={day.cluster}
          onChange={(e) => {
            const value = e.target.value;
            patchToday({ cluster: value });
            const hit = loops.find((l) => matchLoopCluster(l, value));
            if (hit) {
              useStreets.getState().setStatus(hit.id, "working");
              if (/^\d{5}$/.test(value.trim())) patchToday({ cluster: loopHeadline(hit) });
            }
          }}
          placeholder="Loop · zip, or type"
          list="street-loops"
        />
        <datalist id="street-loops">
          {loops.map((l) => (
            <option key={l.id} value={loopHeadline(l)} />
          ))}
        </datalist>
      </Field>
      <Link to="/streets" className="mt-2 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
        {loops.length ? "Open Streets" : "Build loops from my counties"}
      </Link>
      {selected ? (
        <a
          href={mapsUrl(selected)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          {mapsLabel(selected)}
        </a>
      ) : null}

      <Field
        label="Weather you can mention"
        hint="Copied from Streets when you tap Use today. Edit freely. Age first."
      >
        <textarea
          className="mt-2 min-h-16 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-base leading-relaxed"
          value={day.storm}
          onChange={(e) => patchToday({ storm: e.target.value })}
          placeholder="Yesterday’s cell, 1 inch hail in Hampden — only if that’s true."
        />
      </Field>

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
