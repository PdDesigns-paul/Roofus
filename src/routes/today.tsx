import { createFileRoute, Link, redirect } from "@tanstack/react-router";
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
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
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
  const [knockWindow, setKnockWindow] = useState("");
  const [paperWindow, setPaperWindow] = useState("");
  const [hardStop, setHardStop] = useState("");
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
      knockWindow,
      paperWindow,
      hardStop,
    };
    finishSetup(patch);
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-tab pt-4">
      <AppHeader title="Today" page="today" home />
      <h1 className="mt-8 font-display text-3xl leading-tight tracking-tight">Where do you knock?</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Once is enough. You can change it later. Stays on this phone.
      </p>

      <form
        className="mt-8 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Your first name" hint="What Roofus should call you.">
          <input
            className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
            value={goBy}
            onChange={(e) => setGoBy(e.target.value)}
            autoComplete="nickname"
          />
        </Field>
        <Field label="Company" hint="Optional.">
          <input
            className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </Field>
        <Field label="Which counties?" hint="Where you actually knock. Commas are fine.">
          <input
            className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
            value={counties}
            onChange={(e) => setCounties(e.target.value)}
            required
          />
        </Field>
        <Field label="Which state?" hint="PA, Ohio, whatever you cover.">
          <input
            className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
            value={states}
            onChange={(e) => setStates(e.target.value)}
            required
          />
        </Field>
        <Field label="When do you knock?" hint="Your words. After work, Saturdays, 4 to 7…">
          <input
            className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
            value={knockWindow}
            onChange={(e) => setKnockWindow(e.target.value)}
            placeholder="After work, 3–4 hours"
          />
        </Field>
        <Field label="Morning work" hint="Optional. Calls and paperwork — not porches.">
          <input
            className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
            value={paperWindow}
            onChange={(e) => setPaperWindow(e.target.value)}
          />
        </Field>
        <Field label="When do you stop?" hint="Dark, a set number of hours, or both.">
          <input
            className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
            value={hardStop}
            onChange={(e) => setHardStop(e.target.value)}
            placeholder="When it gets dark"
          />
        </Field>
        {err ? <p className="text-sm text-danger">{err}</p> : null}
        <button type="submit" className="h-12 rounded-full bg-fg text-sm text-paper">
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
  const patchProfile = useDayBook((s) => s.patchProfile);
  const loops = useStreets((s) => s.loops);
  const kept = useWeather((s) => s.kept);
  const busy = useCoach((s) => s.busy);
  const [editOpen, setEditOpen] = useState(false);
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
            "Read today's log, the street list, and the 48-hour weather pulse. Tell me what the numbers say. Then name tomorrow: a High lead on a loop I keep jumps Working. Then Working. Then the next age-band loop. Medium and Low do not pick the day. Don't invent weather. Keep is what I may say on the porch.",
          );
        } catch (e) {
          setAskErr(e instanceof Error ? e.message : "Roofus missed that.");
        }
      })();
    });
  }

  const market = [profile.counties, profile.states].filter(Boolean).join(", ");

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-tab pt-4">
      <AppHeader title="Today" page="today" home />
      <p className="mt-8 text-xs font-medium uppercase tracking-wide text-faint">{day.date}</p>
      <h1 className="mt-1 font-display text-3xl leading-tight tracking-tight">
        {profile.goBy.trim() ? `${profile.goBy.trim()}'s day` : "Today"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {market || "Add your counties under Counties and hours."}
        {profile.knockWindow.trim() ? ` · ${profile.knockWindow.trim()}` : ""}
      </p>

      <section className="mt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Tap to count</p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {COUNTERS.map((c) => (
            <li key={c.key} className="rounded-2xl border border-border bg-surface px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-faint">{c.label}</p>
              <p className="mt-1 font-display text-3xl tabular-nums leading-none">{day[c.key]}</p>
              <p className="mt-1 text-xs text-muted">{c.hint}</p>
              <div className="mt-3 flex gap-2">
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
            : "Build Streets from your counties, or type a loop."
        }
      >
        <input
          className="mt-3 h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
          value={day.cluster}
          onChange={(e) => {
            const value = e.target.value;
            patchToday({ cluster: value });
            const hit = loops.find((l) => loopLabel(l) === value);
            if (hit) useStreets.getState().setStatus(hit.id, "working");
          }}
          placeholder="Streets or a subdivision"
          list="street-loops"
        />
        <datalist id="street-loops">
          {loops.map((l) => (
            <option key={l.id} value={loopLabel(l)} />
          ))}
        </datalist>
      </Field>
      <Link to="/streets" className="mt-2 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
        {loops.length ? "Open Streets" : "Build Streets from my counties"}
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
        hint="Filled from storms you kept, only if they match this loop. Edit freely. Age first."
      >
        <textarea
          className="mt-3 min-h-24 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base leading-relaxed"
          value={day.storm}
          onChange={(e) => patchToday({ storm: e.target.value })}
          placeholder="Yesterday’s cell, 1 inch hail in Hampden — only if that’s true."
        />
      </Field>

      <Field label="After Action Report" hint="Wins first. Then what you’ll do different. A plan with verbs, not try harder.">
        <textarea
          className="mt-3 min-h-32 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base leading-relaxed"
          value={day.afterAction}
          onChange={(e) => patchToday({ afterAction: e.target.value })}
        />
      </Field>

      <Field label="Tomorrow I start at">
        <input
          className="mt-3 h-12 w-full rounded-xl border border-border bg-surface px-4 text-base"
          value={day.tomorrowStreet}
          onChange={(e) => patchToday({ tomorrowStreet: e.target.value })}
        />
      </Field>

      <button
        type="button"
        disabled={busy}
        onClick={askAboutToday}
        className="mt-8 h-12 rounded-full bg-fg text-sm text-paper disabled:opacity-40"
      >
        Ask Roofus how today went
      </button>
      {askErr ? <p className="mt-2 text-sm text-danger">{askErr}</p> : null}

      <InstallHint />
      <NotionHint />

      <button
        type="button"
        className="mt-8 text-left text-sm text-muted"
        onClick={() => setEditOpen((o) => !o)}
      >
        {editOpen ? "Hide counties and hours" : "Counties and hours"}
      </button>
      {editOpen ? (
        <div className="mt-3 flex flex-col gap-3">
          <input
            className="h-11 rounded-xl border border-border bg-surface px-4 text-sm"
            value={profile.goBy}
            onChange={(e) => patchProfile({ goBy: e.target.value })}
            placeholder="First name"
          />
          <input
            className="h-11 rounded-xl border border-border bg-surface px-4 text-sm"
            value={profile.company}
            onChange={(e) => patchProfile({ company: e.target.value })}
            placeholder="Company"
          />
          <input
            className="h-11 rounded-xl border border-border bg-surface px-4 text-sm"
            value={profile.counties}
            onChange={(e) => patchProfile({ counties: e.target.value })}
            placeholder="Counties"
          />
          <input
            className="h-11 rounded-xl border border-border bg-surface px-4 text-sm"
            value={profile.states}
            onChange={(e) => patchProfile({ states: e.target.value })}
            placeholder="State"
          />
          <input
            className="h-11 rounded-xl border border-border bg-surface px-4 text-sm"
            value={profile.knockWindow}
            onChange={(e) => patchProfile({ knockWindow: e.target.value })}
            placeholder="When I knock"
          />
          <input
            className="h-11 rounded-xl border border-border bg-surface px-4 text-sm"
            value={profile.paperWindow}
            onChange={(e) => patchProfile({ paperWindow: e.target.value })}
            placeholder="Morning work"
          />
          <input
            className="h-11 rounded-xl border border-border bg-surface px-4 text-sm"
            value={profile.hardStop}
            onChange={(e) => patchProfile({ hardStop: e.target.value })}
            placeholder="When I stop"
          />
          <Link to="/settings" className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
            Warranty line is in Presets
          </Link>
        </div>
      ) : null}
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
    <label className="mt-8 block">
      <span className="text-xs font-medium uppercase tracking-wide text-faint">{label}</span>
      {hint ? <span className="mt-1 block text-xs leading-relaxed text-muted">{hint}</span> : null}
      {children}
    </label>
  );
}
