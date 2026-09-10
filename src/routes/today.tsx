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
  useDayBook,
  type DayCounts,
  type DayProfile,
} from "@/lib/day-book";
import { loopLabel } from "@/lib/streets-rank";
import { suggestTomorrow, useStreets } from "@/lib/streets-store";
import { mapsLabel, mapsUrl } from "@/lib/maps-url";
import { stormsNearLoop } from "@/lib/weather-match";
import { useWeather } from "@/lib/weather-store";

export const Route = createFileRoute("/today")({
  codeSplitGroupings: [],
  component: TodayJournal,
});

export function TodayJournal() {
  const setupDone = useDayBook((s) => s.profile.setupDone);
  return setupDone ? <DaySheet /> : <SetupForm />;
}

const COUNTERS: { key: keyof DayCounts; label: string; hint: string }[] = [
  { key: "knocks", label: "Doors", hint: "I knocked" },
  { key: "talks", label: "Talked", hint: "Someone answered" },
  { key: "looks", label: "On the roof", hint: "I went up" },
  { key: "sets", label: "Appointments", hint: "On the calendar" },
];

function SetupForm() {
  const finishSetup = useDayBook((s) => s.finishSetup);
  const [goBy, setGoBy] = useState("");
  const [company, setCompany] = useState("");
  const [counties, setCounties] = useState("");
  const [states, setStates] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function save() {
    if (!counties.trim() || !states.trim()) {
      setErr("Need a county and a state so we know where you work.");
      return;
    }
    const patch: Partial<DayProfile> = {
      goBy,
      company,
      counties,
      states,
    };
    finishSetup(patch);
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Today" page="today" home />
      <h1 className="mt-4 font-display text-2xl leading-tight tracking-tight">Where do you knock?</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Once is enough. Hours, warranty, and FAQs live in Presets. Stays on this phone.
      </p>

      <form
        className="mt-5 flex flex-col gap-0"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Your first name" hint="What Roofus should call you.">
          <input
            className="h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
            value={goBy}
            onChange={(e) => setGoBy(e.target.value)}
            autoComplete="nickname"
          />
        </Field>
        <Field label="Company" hint="Optional.">
          <input
            className="h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </Field>
        <Field label="Which counties?" hint="Where you actually knock. Commas are fine.">
          <input
            className="h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
            value={counties}
            onChange={(e) => setCounties(e.target.value)}
            required
          />
        </Field>
        <Field label="Which state?" hint="PA, Ohio, whatever you cover.">
          <input
            className="h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
            value={states}
            onChange={(e) => setStates(e.target.value)}
            required
          />
        </Field>
        {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
        <button type="submit" className="mt-4 h-11 rounded-full bg-fg text-sm text-paper">
          Save and go
        </button>
      </form>
    </main>
  );
}

function DaySheet() {
  const date = localDateKey();
  const stored = useDayBook((s) => s.days[date]);
  const day = stored ?? blankDay(date);
  const bump = useDayBook((s) => s.bump);
  const patchToday = useDayBook((s) => s.patchToday);
  const profile = useDayBook((s) => s.profile);
  const loops = useStreets((s) => s.loops);
  const kept = useWeather((s) => s.kept);
  const busy = useCoach((s) => s.busy);
  const [askErr, setAskErr] = useState<string | null>(null);
  const selected = loops.find((l) => loopLabel(l) === day.cluster) ?? null;
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
            "Read today's log, the zip list, and the 48-hour weather pulse. Tell me what the numbers say. Then name tomorrow: a High lead on a zip I keep jumps Working. Then Working. Then the next age-band zip. Medium and Low do not pick the day. Don't invent weather. Keep is what I may say on the porch.",
          );
        } catch (e) {
          setAskErr(e instanceof Error ? e.message : "Roofus missed that.");
        }
      })();
    });
  }

  const market = [profile.counties, profile.states].filter(Boolean).join(", ");

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Today" page="today" home />
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-faint">{day.date}</p>
      <h1 className="mt-1 font-display text-2xl leading-tight tracking-tight">
        {profile.goBy.trim() ? `${profile.goBy.trim()}'s day` : "Today"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {market ? (
          <>
            {market}
            {profile.knockWindow.trim() ? ` · ${profile.knockWindow.trim()}` : ""}{" "}
            <Link to="/settings" className="underline-offset-4 hover:text-fg hover:underline">
              Presets
            </Link>
          </>
        ) : (
          <>
            Set counties in{" "}
            <Link to="/settings" className="underline-offset-4 hover:text-fg hover:underline">
              Presets
            </Link>
            .
          </>
        )}
      </p>

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
            ? "Pick from your Streets list, or type."
            : "Build Streets from your counties, or type a zip."
        }
      >
        <input
          className="mt-2 h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
          value={day.cluster}
          onChange={(e) => {
            const value = e.target.value;
            patchToday({ cluster: value });
            const hit = loops.find((l) => loopLabel(l) === value);
            if (hit) useStreets.getState().setStatus(hit.id, "working");
          }}
          placeholder="Zip or a street"
          list="street-loops"
        />
        <datalist id="street-loops">
          {loops.map((l) => (
            <option key={l.id} value={loopLabel(l)} />
          ))}
        </datalist>
      </Field>
      <Link to="/streets" className="mt-2 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
        {loops.length ? "Open Streets" : "Build zips from my counties"}
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

      <Field label="After Action Report" hint="Wins first. Then what you’ll do different. A plan with verbs, not try harder.">
        <textarea
          className="mt-2 min-h-20 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-base leading-relaxed"
          value={day.afterAction}
          onChange={(e) => patchToday({ afterAction: e.target.value })}
        />
      </Field>

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
          to="/settings"
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
