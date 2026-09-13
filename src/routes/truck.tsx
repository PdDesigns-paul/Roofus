import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { InstallHint } from "@/components/install-hint";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
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
import { freshKeptSentence } from "@/lib/kept-storm";
import { applyPulseFootprints } from "@/lib/scout-store";
import { phoneError, readJson } from "@/lib/read-json";
import { stormsNearLoop } from "@/lib/weather-match";
import { useWeather } from "@/lib/weather-store";
import type { PulseLead, PulseReport, StormEvent } from "@/lib/weather-types";
import { preKnock } from "@/lib/pocket-cards";
import { companyOf } from "@/lib/setup-progress";
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

/** Truck journal. Formerly /today. */
export const Route = createFileRoute("/truck")({
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
  const loops = useStreets((s) => s.loops);
  const ageMin = useStreets((s) => s.ageMin);
  const ageMax = useStreets((s) => s.ageMax);
  const kept = useWeather((s) => s.kept);
  const keptStorms = useWeather((s) => s.keptStorms);
  const pulse = useWeather((s) => s.pulse);
  const pending = useWeather((s) => s.pending);
  const tossed = useWeather((s) => s.tossed);
  const keep = useWeather((s) => s.keep);
  const toss = useWeather((s) => s.toss);
  const keepLead = useWeather((s) => s.keepLead);
  const tossLead = useWeather((s) => s.tossLead);
  const skipLead = useWeather((s) => s.skipLead);
  const busy = useCoach((s) => s.busy);
  const [askErr, setAskErr] = useState<string | null>(null);
  const plan = loopsInPlan(loops, day.cluster);
  const current = firstRemainingInPlan(loops, day.cluster);
  const extra = Math.max(0, clusterLines(day.cluster).length - 1);
  const nearby = stormsNearPlan(kept, plan);
  const keptLine = freshKeptSentence(keptStorms);

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
    company: companyOf(profile.company),
    knockWindow: profile.knockWindow,
    hardStop: profile.hardStop,
    ageMin,
    ageMax,
    workingZip: working ? loopLabel(working) : "",
  });

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Truck" />
      {!profile.counties.trim() || !profile.states.trim() ? (
        <Link
          to="/settings/territory"
          className="mt-3 flex min-h-12 items-center rounded-2xl border-2 border-accent px-4 text-sm text-fg"
        >
          Counties and a state in Settings — then After can build loops.
        </Link>
      ) : null}
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-faint">{day.date}</p>
      <h1 className="mt-1 font-display text-2xl leading-tight tracking-tight">
        {profile.goBy.trim() ? `${profile.goBy.trim()}'s day` : "Truck"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {market ? (
          <>
            {market}
            {profile.knockWindow.trim() ? ` · ${profile.knockWindow.trim()}` : ""}{" "}
            <Link to="/settings/hours" className="text-fg underline underline-offset-4">
              Settings
            </Link>
          </>
        ) : (
          <>
            Set counties in{" "}
            <Link to="/settings/territory" className="text-fg underline underline-offset-4">
              Settings
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
        <p className="mt-2 text-sm leading-relaxed">{keptLine || knock.weather}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{knock.script}</p>
        <p className="mt-3 text-sm leading-relaxed">{knock.opener}</p>
        <Link to="/door" className="mt-3 inline-flex h-11 items-center text-sm text-fg underline underline-offset-4">
          Pocket cards
        </Link>
      </section>

      <section className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Tap to count</p>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {COUNTERS.map((c) => (
            <li key={c.key} className="relative min-w-0 rounded-2xl border border-border bg-surface">
              <button
                type="button"
                aria-label={`Plus ${c.label}`}
                className="flex min-h-24 w-full flex-col items-start px-3 py-3 pr-12 pb-12 text-left"
                onClick={() => bump(c.key, 1)}
              >
                <p className="text-[11px] uppercase tracking-wide text-faint">{c.label}</p>
                <p className="mt-1 font-display text-4xl tabular-nums leading-none">{day[c.key]}</p>
                <p className="mt-1 text-xs text-muted">{c.hint}</p>
              </button>
              <button
                type="button"
                aria-label={`Minus ${c.label}`}
                className="absolute bottom-1 right-1 inline-flex size-11 items-center justify-center rounded-full border border-border text-sm"
                onClick={() => bump(c.key, -1)}
              >
                −
              </button>
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
      <Link to="/after" className="mt-2 text-sm text-fg underline underline-offset-4">
        {loops.length ? "Open After" : "Build loops from my counties"}
      </Link>
      {plan.map((l) => (
        <a
          key={l.id}
          href={mapsUrl(l)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-sm text-fg underline underline-offset-4"
        >
          {mapsLabel(l)}
        </a>
      ))}

      <Last48Hours
        pulse={pulse}
        pending={pending}
        tossed={tossed}
        keptLine={keptLine}
        counties={profile.counties}
        states={profile.states}
        onKeepLead={keepLead}
        onTossLead={tossLead}
        onSkipLead={skipLead}
        onKeepStorm={keep}
        onTossStorm={toss}
      />

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

      <Button type="button" size="lg" className="mt-5 w-full" disabled={busy} onClick={askAboutToday}>
        Ask Roofus how today went
      </Button>
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
              <Chip onClick={() => onPlan(dropCluster(cluster, line))}>Remove</Chip>
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
                {shown ? (
                  <div className="flex flex-col gap-2 border-t border-border px-3 py-2">
                    {t.loops.map((l) => {
                      const on = loopInPlan(l, cluster);
                      return (
                        <Chip
                          key={l.id}
                          selected={on}
                          disabled={!on && atCap}
                          className="w-full justify-start"
                          onClick={() => toggle(l)}
                        >
                          {loopHeadline(l)}
                        </Chip>
                      );
                    })}
                  </div>
                ) : null}
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
        Copy your days to a free Notion so a dead phone is not a dead year. Optional. Settings.
      </p>
      <div className="mt-3 flex gap-2">
        <Button asChild className="flex-1">
          <Link to="/settings/backup">Set up backup</Link>
        </Button>
        <Button type="button" variant="outline" className="flex-1" onClick={hide}>
          Not now
        </Button>
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

function leadIsKept(lead: PulseLead, keptLine: string) {
  const say = lead.say.trim();
  return Boolean(say) && keptLine.includes(say);
}

function Last48Hours({
  pulse,
  pending,
  tossed,
  keptLine,
  counties,
  states,
  onKeepLead,
  onTossLead,
  onSkipLead,
  onKeepStorm,
  onTossStorm,
}: {
  pulse: PulseReport | null;
  pending: StormEvent[];
  tossed: string[];
  keptLine: string;
  counties: string;
  states: string;
  onKeepLead: (lead: PulseLead) => void;
  onTossLead: (lead: PulseLead) => void;
  onSkipLead: (lead: PulseLead) => void;
  onKeepStorm: (id: string) => void;
  onTossStorm: (id: string) => void;
}) {
  const loops = useStreets((s) => s.loops);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ready = Boolean(counties.trim() && states.trim());
  const leads = (pulse?.leads ?? []).filter((l) => l.say.trim() && !tossed.includes(l.id));
  const openStorms = pending.filter((s) => !tossed.includes(s.id));

  async function checkPulse() {
    if (!ready) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/weather-pulse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          counties,
          states,
          loops: loops.map((l) => ({
            id: l.id,
            title: l.title,
            zip: l.zip,
            streets: l.streets,
            county: l.county,
            lat: l.lat,
            lon: l.lon,
            status: l.status,
          })),
        }),
      });
      const data = (await readJson(res)) as (PulseReport & { error?: string }) | null;
      if (!data) throw new Error("Could not check the last 48 hours.");
      if (!res.ok) throw new Error(phoneError(data.error, "Could not check the last 48 hours."));
      useWeather.getState().setPulse(data);
      const { ageMin, ageMax } = useStreets.getState();
      applyPulseFootprints(data.footprints ?? [], loops, ageMin, ageMax, data.at);
    } catch (e) {
      setErr(phoneError(e, "Could not check the last 48 hours."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">Last 48 hours</p>
      <p className="mt-0.5 text-xs leading-snug text-muted">
        Keep is the porch gate. Toss or Skip writes no sentence.
      </p>
      {ready ? (
        <Button type="button" variant="outline" className="mt-2 w-full" disabled={busy} onClick={() => void checkPulse()}>
          {busy ? "Checking…" : "Check last 48 hours"}
        </Button>
      ) : (
        <p className="mt-2 text-sm text-muted">Counties first in Settings.</p>
      )}
      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      {pulse?.quiet && !leads.length ? (
        <p className="mt-2 text-sm text-muted">{pulse.summary || "Quiet last 48 hours. Age first."}</p>
      ) : null}
      {leads.length ? (
        <ul className="mt-3 flex flex-col gap-3">
          {leads.map((lead) => {
            const kept = leadIsKept(lead, keptLine);
            return (
              <li key={lead.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
                <p className="text-sm leading-relaxed">{lead.say}</p>
                <p className="mt-1 text-xs text-muted">
                  {[lead.loopLabel || lead.places[0], lead.grade].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip selected={kept} onClick={() => onKeepLead(lead)}>
                    Keep
                  </Chip>
                  <Chip selected={false} onClick={() => onTossLead(lead)}>
                    Toss
                  </Chip>
                  <Chip selected={false} onClick={() => onSkipLead(lead)}>
                    Skip
                  </Chip>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {openStorms.length ? (
        <ul className="mt-3 flex flex-col gap-3">
          {openStorms.map((storm) => (
            <li key={storm.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
              <p className="text-sm leading-relaxed">{storm.say}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip onClick={() => onKeepStorm(storm.id)}>Keep</Chip>
                <Chip onClick={() => onTossStorm(storm.id)}>Toss</Chip>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
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
