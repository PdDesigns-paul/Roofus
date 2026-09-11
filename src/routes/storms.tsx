import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { StormMap } from "@/components/storm-map";
import { useDayBook } from "@/lib/day-book";
import { addLoopToPlan, loopHeadline } from "@/lib/streets-rank";
import { useStreets } from "@/lib/streets-store";
import type { StreetLoop } from "@/lib/streets-types";
import { openPulseLeads } from "@/lib/weather-grade";
import { groupKeptPins, loopsNearStorm, mentionOnStreet, pinKey } from "@/lib/weather-match";
import { useWeather } from "@/lib/weather-store";
import type { PulseLead, WeatherPulseResponse } from "@/lib/weather-types";

export const Route = createFileRoute("/storms")({
  codeSplitGroupings: [],
  component: StormsPage,
});

function StormsPage() {
  const profile = useDayBook((s) => s.profile);
  const patchToday = useDayBook((s) => s.patchToday);
  const loops = useStreets((s) => s.loops);
  const setStatus = useStreets((s) => s.setStatus);
  const kept = useWeather((s) => s.kept);
  const tossed = useWeather((s) => s.tossed);
  const pulse = useWeather((s) => s.pulse);
  const keepLead = useWeather((s) => s.keepLead);
  const tossLead = useWeather((s) => s.tossLead);
  const dropKept = useWeather((s) => s.dropKept);
  const setPulse = useWeather((s) => s.setPulse);
  const pins = groupKeptPins(kept);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const selected = pins.find((p) => p.key === picked) ?? null;
  const open = pulse ? openPulseLeads(pulse.leads, kept, tossed) : [];
  const live = loops.filter((l) => Number.isFinite(l.lat) && !(l.lat === 0 && l.lon === 0));
  const fallback = live.length
    ? {
        lat: live.reduce((s, l) => s + l.lat, 0) / live.length,
        lon: live.reduce((s, l) => s + l.lon, 0) / live.length,
      }
    : null;

  async function lookup() {
    if (!profile.counties.trim() || !profile.states.trim()) {
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
          counties: profile.counties,
          states: profile.states,
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
      if (!res.ok) throw new Error(data.error || "Could not read last 48 hours.");
      setPulse(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read last 48 hours.");
    } finally {
      setBusy(false);
    }
  }

  function useLoop(loop: StreetLoop) {
    setStatus(loop.id, "working");
    const cur = useDayBook.getState().today();
    patchToday({
      cluster: addLoopToPlan(cur.cluster, loop),
      storm: cur.storm.trim() || mentionOnStreet(kept, loop),
    });
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Storms" />
      <h1 className="mt-4 font-display text-2xl leading-tight tracking-tight">Storms</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Age first. Pins are storms you Keep — a pointer, not a house. Satellite. Last 48 hours is a
        list under the map until you Keep. Today stays the log.
      </p>

      <StormMap
        pins={pins.map((p) => ({ key: p.key, lat: p.lat, lon: p.lon }))}
        selectedKey={picked}
        onSelect={setPicked}
        fallback={fallback}
      />

      {!kept.length ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Age first. Keep a storm before you mention weather.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {kept.map((s) => {
            const key =
              Number.isFinite(s.lat) && !(s.lat === 0 && s.lon === 0) ? pinKey(s.lat, s.lon) : "";
            const on = key && key === picked;
            const near = loopsNearStorm(loops, s);
            const showNear = on || (!selected && kept.length <= 3);
            return (
              <li key={s.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setPicked(on ? null : key || null)}
                >
                  <p className="text-sm leading-relaxed">{s.say}</p>
                </button>
                {showNear ? (
                  <div className="mt-2">
                    {near.length ? (
                      <ul className="flex flex-col gap-1">
                        {near.slice(0, 4).map((loop) => (
                          <li key={loop.id}>
                            <button
                              type="button"
                              className="h-11 w-full rounded-full border border-border text-sm"
                              onClick={() => useLoop(loop)}
                            >
                              Use today · {loopHeadline(loop)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs leading-snug text-muted">
                        No age-band loop sits on this pin. Age still picks the street.
                      </p>
                    )}
                    <button
                      type="button"
                      className="mt-2 h-11 w-full rounded-full border border-border text-sm text-muted"
                      onClick={() => {
                        dropKept(s.id);
                        if (on) setPicked(null);
                      }}
                    >
                      Drop
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={() => void lookup()}
        className="mt-5 h-11 rounded-full bg-fg text-sm text-paper disabled:opacity-40"
      >
        {busy ? "Looking up…" : "Look up last 48 hours"}
      </button>
      <p className="mt-2 text-xs leading-snug text-muted">
        Does not run until you tap. Pins only move when you Keep a storm. Can take a minute.
      </p>
      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      {pulse ? <p className="mt-3 text-sm leading-relaxed text-muted">{pulse.summary}</p> : null}

      {open.length ? (
        <section className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Waiting on Keep</p>
          <p className="mt-1 text-xs leading-snug text-muted">
            Not on the map yet. Tossed never become porch weather.
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {open.map((lead) => (
              <LeadRow key={lead.id} lead={lead} onKeep={keepLead} onToss={tossLead} />
            ))}
          </ul>
        </section>
      ) : null}

      {!profile.counties.trim() || !profile.states.trim() ? (
        <Link
          to="/settings/territory"
          className="mt-4 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          Set counties in Presets
        </Link>
      ) : (
        <Link to="/streets" className="mt-4 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
          Open Streets
        </Link>
      )}
    </main>
  );
}

function LeadRow({
  lead,
  onKeep,
  onToss,
}: {
  lead: PulseLead;
  onKeep: (lead: PulseLead) => void;
  onToss: (id: string) => void;
}) {
  return (
    <li className="rounded-2xl border border-border bg-surface px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-faint">
        {lead.grade}
        {lead.loopLabel ? ` · ${lead.loopLabel}` : ""}
      </p>
      <p className="mt-1 text-sm leading-relaxed">{lead.say}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="h-11 flex-1 rounded-full bg-fg text-sm text-paper"
          onClick={() => onKeep(lead)}
        >
          Keep
        </button>
        <button
          type="button"
          className="h-11 flex-1 rounded-full border border-border text-sm"
          onClick={() => onToss(lead.id)}
        >
          Toss
        </button>
      </div>
    </li>
  );
}
