import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useDayBook } from "@/lib/day-book";
import { mapsLabel, mapsUrl } from "@/lib/maps-url";
import { loopAge, loopLabel, groupLoopsByCounty } from "@/lib/streets-rank";
import { marketKey, useStreets } from "@/lib/streets-store";
import type { LoopResult, LoopStatus, StreetLoop, StreetsBuildResponse } from "@/lib/streets-types";
import { stormsNearLoop } from "@/lib/weather-match";
import { pulseIsFresh } from "@/lib/weather-grade";
import { useWeather, weatherMarketKey } from "@/lib/weather-store";
import type { PulseLead, StormEvent, WeatherBuildResponse, WeatherPulseResponse } from "@/lib/weather-types";

export const Route = createFileRoute("/streets")({
  codeSplitGroupings: [],
  component: StreetsPage,
});

const RESULTS: { id: LoopResult; label: string }[] = [
  { id: "no-answer", label: "No answer" },
  { id: "not-now", label: "Not now" },
  { id: "callback", label: "Come back" },
  { id: "appointment", label: "Appointment" },
];

const STATUSES: { id: LoopStatus; label: string }[] = [
  { id: "working", label: "Working" },
  { id: "done", label: "Done" },
  { id: "skip", label: "Skip" },
  { id: "fresh", label: "Reset" },
];

const PRESETS: { min: number; max: number; label: string }[] = [
  { min: 15, max: 20, label: "15–20" },
  { min: 17, max: 25, label: "17–25" },
  { min: 20, max: 30, label: "20–30" },
];

function StreetsPage() {
  const profile = useDayBook((s) => s.profile);
  const loops = useStreets((s) => s.loops);
  const note = useStreets((s) => s.note);
  const builtFor = useStreets((s) => s.builtFor);
  const ageMin = useStreets((s) => s.ageMin);
  const ageMax = useStreets((s) => s.ageMax);
  const setAge = useStreets((s) => s.setAge);
  const replace = useStreets((s) => s.replace);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const key = marketKey(profile.counties, profile.states, ageMin, ageMax);
  const stale = Boolean(loops.length && builtFor && builtFor !== key);

  async function build() {
    if (!profile.counties.trim() || !profile.states.trim()) {
      setErr("Fill county and state in Presets first.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/streets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          counties: profile.counties,
          states: profile.states,
          ageMin,
          ageMax,
        }),
      });
      const data = (await res.json()) as StreetsBuildResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not build streets.");
      replace(data.loops, {
        note: data.note,
        yearFrom: data.yearFrom,
        yearTo: data.yearTo,
        builtFor: key,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not build streets.");
    } finally {
      setBusy(false);
    }
  }

  if (!profile.setupDone) {
    return (
      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-tab pt-4">
        <AppHeader title="Streets" page="streets" />
        <h1 className="mt-8 font-display text-3xl leading-tight tracking-tight">Where you knock.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Presets needs a county and a state first. Then we build zips from roofs in the age
          band — not from hail.
        </p>
        <Link
          to="/settings"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-fg text-sm text-paper"
        >
          Open Presets
        </Link>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-tab pt-4">
      <AppHeader title="Streets" page="streets" />
      <h1 className="mt-8 font-display text-3xl leading-tight tracking-tight">Where you knock.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {profile.counties.trim()}, {profile.states.trim()}. One card per zip, grouped by county.
        You set the years. Streets on a card are the age-band pockets — not the whole zip.
      </p>

      <p className="mt-6 text-xs font-medium uppercase tracking-wide text-faint">
        Roofs about this old
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setAge(p.min, p.max)}
            className={`h-10 rounded-full px-3 text-sm ${
              ageMin === p.min && ageMax === p.max ? "bg-fg text-paper" : "border border-border"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted">
          From
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={40}
            value={ageMin}
            onChange={(e) => setAge(Number(e.target.value) || 10, ageMax)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-fg"
          />
        </label>
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted">
          To
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={45}
            value={ageMax}
            onChange={(e) => setAge(ageMin, Number(e.target.value) || ageMin)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base text-fg"
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-faint">
        Default is 17–25. That is targeting, not a verdict on the house in front of you.
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={() => void build()}
        className="mt-6 h-12 rounded-full bg-fg text-sm text-paper disabled:opacity-40"
      >
        {busy ? "Building zips…" : loops.length ? "Rebuild from my counties" : "Build zips from my counties"}
      </button>
      {stale ? (
        <p className="mt-2 text-sm text-muted">Counties or age band changed. Rebuild to match.</p>
      ) : null}
      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      {note && loops.length ? <p className="mt-3 text-xs leading-relaxed text-faint">{note}</p> : null}

      {busy ? (
        <p className="mt-8 text-sm text-muted">
          Reading housing years and rolling them into zips. This can take half a minute. Stay on
          this page.
        </p>
      ) : null}

      {!busy && !loops.length ? (
        <p className="mt-8 text-sm leading-relaxed text-muted">
          Empty until you build. One card per zip, grouped by county. We use Census years on the
          streets that sit in your age band — not the median of the whole zip. Storms do not pick
          these cards.
        </p>
      ) : null}

      {profile.setupDone ? (
        <>
          <PulsePanel counties={profile.counties} states={profile.states} loops={loops} />
          <WeatherPanel counties={profile.counties} states={profile.states} />
        </>
      ) : null}

      <ul className="mt-8 flex flex-col gap-8">
        {groupLoopsByCounty(loops).map((group) => (
          <li key={group.county}>
            <p className="text-xs font-medium uppercase tracking-wide text-faint">{group.county}</p>
            <ul className="mt-3 flex flex-col gap-3">
              {group.loops.map((loop) => (
                <LoopCard key={loop.id} loop={loop} />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}

function LoopCard({ loop }: { loop: StreetLoop }) {
  const [open, setOpen] = useState(false);
  const setStatus = useStreets((s) => s.setStatus);
  const setResult = useStreets((s) => s.setResult);
  const patchToday = useDayBook((s) => s.patchToday);
  const kept = useWeather((s) => s.kept);
  const pulse = useWeather((s) => s.pulse);
  const nearby = stormsNearLoop(kept, loop);
  const hLead =
    pulse && pulseIsFresh(pulse.at)
      ? pulse.leads.find((l) => l.grade === "H" && l.loopId === loop.id)
      : undefined;
  const label = loopLabel(loop);
  const age = loopAge(loop);

  return (
    <li className="rounded-2xl border border-border bg-surface px-4 py-3">
      <button type="button" className="w-full text-left" onClick={() => setOpen((o) => !o)}>
        <p className="font-display text-xl tracking-tight">{label}</p>
        {hLead ? (
          <p className="mt-1 text-xs font-medium uppercase tracking-wide">H — go here tomorrow</p>
        ) : null}
        <p className="mt-1 text-xs text-muted">
          {loop.county} · roofs around {age} years
          {loop.homes ? ` · ~${loop.homes.toLocaleString()} houses in the band` : ""}
          {loop.status !== "fresh" ? ` · ${loop.status}` : ""}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {loop.streets.slice(0, 4).join(" · ")}
          {loop.streets.length > 4 ? ` · +${loop.streets.length - 4}` : ""}
        </p>
        {nearby[0] ? (
          <p className="mt-2 text-xs leading-relaxed text-muted">You may mention: {nearby[0].say}</p>
        ) : null}
      </button>
      <a
        href={mapsUrl(loop)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex h-11 items-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
      >
        {mapsLabel(loop)}
      </a>
      {open ? (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-sm leading-relaxed">{loop.streets.join(", ")}</p>
          {nearby.length > 1
            ? nearby.slice(1).map((s) => (
                <p key={s.id} className="mt-1 text-xs text-muted">
                  You may mention: {s.say}
                </p>
              ))
            : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(loop.id, s.id)}
                className={`h-10 rounded-full px-3 text-sm ${
                  loop.status === s.id ? "bg-fg text-paper" : "border border-border"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {RESULTS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setResult(loop.id, r.id)}
                className={`h-10 rounded-full px-3 text-sm ${
                  loop.lastResult === r.id ? "bg-fg text-paper" : "border border-border"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 h-11 w-full rounded-full border border-border text-sm"
            onClick={() => {
              setStatus(loop.id, "working");
              patchToday({ cluster: label });
            }}
          >
            Use today
          </button>
        </div>
      ) : null}
    </li>
  );
}

function PulsePanel({
  counties,
  states,
  loops,
}: {
  counties: string;
  states: string;
  loops: StreetLoop[];
}) {
  const pulse = useWeather((s) => s.pulse);
  const setPulse = useWeather((s) => s.setPulse);
  const keepLead = useWeather((s) => s.keepLead);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    if (!counties.trim() || !states.trim()) {
      setErr("Fill county and state in Presets first.");
      return;
    }
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
      const data = (await res.json()) as WeatherPulseResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not check the last 48 hours.");
      setPulse(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not check the last 48 hours.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">Last 48 hours</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        NWS first, then local news and X with your counties pinned. High on a zip you keep jumps
        tomorrow. Keep is still what you may say on the porch. Medium and Low do not pick the day.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        className="mt-4 h-12 w-full rounded-full bg-fg text-sm text-paper disabled:opacity-40"
      >
        {busy ? "Checking last 48 hours…" : "Check last 48 hours"}
      </button>
      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      {pulse ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {pulse.summary}
          {pulse.crawled ? "" : " (NWS only — news crawl skipped.)"}
        </p>
      ) : null}
      {pulse?.leads.length ? (
        <ul className="mt-3 flex flex-col gap-2">
          {pulse.leads.map((lead) => (
            <PulseRow key={lead.id} lead={lead} onKeep={() => keepLead(lead)} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function PulseRow({ lead, onKeep }: { lead: PulseLead; onKeep: () => void }) {
  return (
    <li className="rounded-xl border border-border px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-faint">
        {lead.grade}
        {lead.loopLabel ? ` · ${lead.loopLabel}` : " · township only"}
      </p>
      <p className="mt-1 text-sm leading-relaxed">{lead.say}</p>
      <p className="mt-1 text-xs text-muted">{lead.why}</p>
      <button
        type="button"
        className="mt-2 h-10 rounded-full border border-border px-3 text-sm"
        onClick={onKeep}
      >
        Keep for the porch
      </button>
    </li>
  );
}

function WeatherPanel({ counties, states }: { counties: string; states: string }) {
  const pending = useWeather((s) => s.pending);
  const kept = useWeather((s) => s.kept);
  const note = useWeather((s) => s.note);
  const fetchedFor = useWeather((s) => s.fetchedFor);
  const replacePending = useWeather((s) => s.replacePending);
  const keep = useWeather((s) => s.keep);
  const toss = useWeather((s) => s.toss);
  const keepAll = useWeather((s) => s.keepAll);
  const tossAll = useWeather((s) => s.tossAll);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const key = weatherMarketKey(counties, states);
  const auto = useRef(false);

  async function check() {
    if (!counties.trim() || !states.trim()) {
      setErr("Fill county and state in Presets first.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/weather", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ counties, states }),
      });
      const data = (await res.json()) as WeatherBuildResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not read storms.");
      replacePending(data.storms, { note: data.note, fetchedFor: key });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read storms.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (auto.current) return;
    if (fetchedFor === key) return;
    if (!counties.trim() || !states.trim()) return;
    auto.current = true;
    void check();
    // first visit for this market only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <section className="mt-10">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">Season log</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Last six months of NWS reports. Keep what you will actually say. This does not pick
        tomorrow — the 48-hour High list does.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void check()}
        className="mt-4 h-11 rounded-full border border-border px-4 text-sm disabled:opacity-40"
      >
        {busy ? "Checking storms…" : fetchedFor === key ? "Check storms again" : "Check last 6 months"}
      </button>
      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      {note ? <p className="mt-2 text-xs leading-relaxed text-faint">{note}</p> : null}

      {pending.length ? (
        <div className="mt-4">
          <div className="flex gap-2">
            <button type="button" className="h-10 rounded-full border border-border px-3 text-sm" onClick={keepAll}>
              Keep all
            </button>
            <button type="button" className="h-10 rounded-full border border-border px-3 text-sm" onClick={tossAll}>
              Toss all
            </button>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {pending.map((s) => (
              <StormRow key={s.id} storm={s} onKeep={() => keep(s.id)} onToss={() => toss(s.id)} />
            ))}
          </ul>
        </div>
      ) : null}

      {kept.length ? (
        <ul className="mt-4 flex flex-col gap-2">
          {kept.map((s) => (
            <li key={s.id} className="text-sm leading-relaxed text-muted">
              {s.say}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function StormRow({
  storm,
  onKeep,
  onToss,
}: {
  storm: StormEvent;
  onKeep: () => void;
  onToss: () => void;
}) {
  return (
    <li className="rounded-xl border border-border px-3 py-3">
      <p className="text-sm leading-relaxed">{storm.say}</p>
      {storm.remark ? <p className="mt-1 text-xs text-faint">{storm.remark}</p> : null}
      <div className="mt-2 flex gap-2">
        <button type="button" className="h-10 flex-1 rounded-full bg-fg text-sm text-paper" onClick={onKeep}>
          Keep
        </button>
        <button type="button" className="h-10 flex-1 rounded-full border border-border text-sm" onClick={onToss}>
          Toss
        </button>
      </div>
    </li>
  );
}

