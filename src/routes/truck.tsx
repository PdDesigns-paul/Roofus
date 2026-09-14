import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { HomeSetupCard } from "@/components/home-setup-card";
import { InstallHint } from "@/components/install-hint";
import { PlaceCard } from "@/components/place-card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { whenCoachReady, useCoach } from "@/lib/coach-store";
import { useNotion } from "@/lib/notion-store";
import { abortTalk, sendRoofus } from "@/lib/roofus-talk";
import {
  blankDay,
  localDateKey,
  useDayBook,
  type DayCounts,
} from "@/lib/day-book";
import { mapsLabel, mapsUrl } from "@/lib/maps-url";
import { freshKeptSentence } from "@/lib/kept-storm";
import { lastPinOnLoop, pinsForLoop } from "@/lib/pins";
import { applyPulseFootprints } from "@/lib/scout-store";
import { phoneError, readJson } from "@/lib/read-json";
import { stormsNearLoop } from "@/lib/weather-match";
import { useWeather } from "@/lib/weather-store";
import type { PulseLead, PulseReport, StormEvent } from "@/lib/weather-types";
import { preKnock } from "@/lib/pocket-cards";
import { companyOf, setupSnap } from "@/lib/setup-progress";
import { useSettings } from "@/lib/settings-store";
import { useSurvive } from "@/lib/survive-store";
import {
  clusterLines,
  dropCluster,
  dropLoopFromPlan,
  firstRemainingInPlan,
  loopHeadline,
  loopLabel,
  loopsInPlan,
  matchLoopCluster,
} from "@/lib/streets-rank";
import { suggestTomorrow, useStreets } from "@/lib/streets-store";
import { usePins } from "@/lib/pins-store";
import type { StreetLoop } from "@/lib/streets-types";

/** Truck journal. Formerly /today. */
export const Route = createFileRoute("/truck")({
  codeSplitGroupings: [],
  component: Truck,
});

function Truck() {
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
  const fetchedAt = useWeather((s) => s.fetchedAt);
  const keep = useWeather((s) => s.keep);
  const toss = useWeather((s) => s.toss);
  const keepLead = useWeather((s) => s.keepLead);
  const tossLead = useWeather((s) => s.tossLead);
  const skipLead = useWeather((s) => s.skipLead);
  const warrantyLine = useSettings((s) => s.warrantyLine);
  const survive = useSurvive();
  const busy = useCoach((s) => s.busy);
  const [askErr, setAskErr] = useState<string | null>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinErr, setPinErr] = useState("");
  const addPin = usePins((s) => s.add);
  const allPins = usePins((s) => s.pins);
  const plan = loopsInPlan(loops, day.cluster);
  const current = firstRemainingInPlan(loops, day.cluster);
  const extra = Math.max(0, clusterLines(day.cluster).length - 1);
  const nearby = stormsNearPlan(kept, plan);
  const keptLine = freshKeptSentence(keptStorms);
  const working = loops.find((l) => l.status === "working");
  const [open, setOpen] = useState<string | null>(working ? "pin" : "before");
  const pinCount = current ? pinsForLoop(allPins, current.id).length : 0;
  const lastPin = current ? lastPinOnLoop(allPins, current.id) : undefined;

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

  function toggleCard(id: string) {
    setOpen((cur) => (cur === id ? null : id));
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

  function dropPin() {
    if (!current) {
      setPinErr("Pick a Working loop first.");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      addPin({ loopId: current.id, lat: current.lat, lng: current.lon });
      setPinErr("This phone will not share a location. Dropped on the loop.");
      return;
    }
    setPinBusy(true);
    setPinErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        addPin({
          loopId: current.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setPinBusy(false);
      },
      () => {
        addPin({ loopId: current.id, lat: current.lat, lng: current.lon });
        setPinBusy(false);
        setPinErr("Could not get a location. Dropped on the loop.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 15_000 },
    );
  }

  const market = [profile.counties, profile.states].filter(Boolean).join(", ");
  const snap = setupSnap({
    goBy: profile.goBy,
    profileCompany: profile.company,
    counties: profile.counties,
    states: profile.states,
    knockWindow: profile.knockWindow,
    paperWindow: profile.paperWindow,
    hardStop: profile.hardStop,
    warranty: warrantyLine,
    zipCount: loops.length,
    survive,
  });
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
  const aarDone = Boolean(day.afterAction.trim());
  const pinFormula = current
    ? lastPin
      ? `${pinCount} pin${pinCount === 1 ? "" : "s"} · last ${lastPin.houseNumber.trim() || "dropped"}`
      : "Tap Pin at the house"
    : "Working loop first";
  const planFormula = plan.length
    ? `${plan.length} on the plan`
    : "Open After to pick a loop";
  const weatherFormula = day.storm.trim()
    ? day.storm.trim().split("\n")[0] ?? "Age first"
    : "Age first";

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Truck" />
      <HomeSetupCard
        snap={snap}
        afterAction={day.afterAction}
        stormFetchedOn={fetchedAt.slice(0, 10)}
        stackMonth={survive.stackMonth}
      />
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

      {!working ? (
        <>
          <Button type="button" size="lg" className="mt-5 w-full" disabled={busy} onClick={askAboutToday}>
            Ask Roofus how today went
          </Button>
          {askErr ? <p className="mt-2 text-sm text-danger">{askErr}</p> : null}
        </>
      ) : null}

      <ul className="mt-4 flex flex-col gap-3">
        <PlaceCard
          id="before"
          when="Before you knock"
          title={current ? loopHeadline(current) : knock.zip}
          formula={`${knock.age}${extra ? ` · +${extra} more` : ""}`}
          open={open === "before"}
          onToggle={toggleCard}
        >
          <p className="text-sm text-muted">
            {knock.age}
            {knock.hours ? ` · ${knock.hours}` : ""}
          </p>
          <p className="mt-2 text-sm leading-relaxed">{keptLine || knock.weather}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">{knock.script}</p>
          <p className="mt-3 text-sm leading-relaxed">{knock.opener}</p>
          <Link to="/door" className="mt-3 inline-flex h-11 items-center text-sm text-fg underline underline-offset-4">
            Cards
          </Link>
        </PlaceCard>

        <PlaceCard
          id="counts"
          when="Counts"
          title="Tap to count"
          formula={`${day.knocks} · ${day.talks} · ${day.looks} · ${day.sets}`}
          open={open === "counts"}
          onToggle={toggleCard}
        >
          <ul className="grid grid-cols-2 gap-2">
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
        </PlaceCard>

        <PlaceCard
          id="pin"
          when="Pin"
          title="This house"
          formula={pinFormula}
          open={open === "pin"}
          onToggle={toggleCard}
        >
          <p className="text-xs leading-snug text-muted">On this loop. Sidewalk only. Not a CRM.</p>
          <button
            type="button"
            disabled={pinBusy}
            onClick={dropPin}
            className={`mt-3 h-12 w-full rounded-full text-sm disabled:opacity-40 ${
              working ? "bg-fg text-paper" : "border border-border"
            }`}
          >
            {pinBusy ? "Dropping pin…" : "Pin"}
          </button>
          {pinErr ? <p className="mt-2 text-sm leading-relaxed text-muted">{pinErr}</p> : null}
          {lastPin ? (
            <p className="mt-3 text-sm leading-relaxed">
              Last: {lastPin.houseNumber.trim() || "dropped"}
              {lastPin.note.trim() ? ` · ${lastPin.note.trim()}` : ""}
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {current ? "No pin yet." : "Pick a Working loop, then tap Pin at the house."}
            </p>
          )}
          {pinCount > 1 ? (
            <p className="mt-1 text-xs text-muted">{pinCount} on this loop. Full board is on After.</p>
          ) : null}
        </PlaceCard>

        <PlaceCard
          id="plan"
          when="Plan"
          title="Neighborhood today"
          formula={planFormula}
          open={open === "plan"}
          onToggle={toggleCard}
        >
          <PlanChips loops={loops} cluster={day.cluster} onPlan={applyPlan} />
          <Link to="/after" className="mt-3 inline-flex h-11 items-center text-sm text-fg underline underline-offset-4">
            Open After
          </Link>
          {plan.map((l) => (
            <a
              key={l.id}
              href={mapsUrl(l)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm text-fg underline underline-offset-4"
            >
              {mapsLabel(l)}
            </a>
          ))}
        </PlaceCard>

        <PlaceCard
          id="pulse"
          when="Last 48 hours"
          title="Keep / Toss / Skip"
          formula={keptLine ? "Keep on" : "Check last 48 hours"}
          open={open === "pulse"}
          onToggle={toggleCard}
        >
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
        </PlaceCard>

        <PlaceCard
          id="weather"
          when="Weather you can say"
          title="Age first"
          formula={weatherFormula}
          open={open === "weather"}
          onToggle={toggleCard}
        >
          <p className="text-xs leading-snug text-muted">
            Copied from After when you tap Use today. Edit freely. Age first.
          </p>
          <textarea
            className="mt-2 min-h-16 w-full min-w-0 rounded-xl border border-border bg-surface px-3 py-2 text-base leading-relaxed"
            value={day.storm}
            onChange={(e) => patchToday({ storm: e.target.value })}
            placeholder="Yesterday’s cell, 1 inch hail in Hampden — only if that’s true."
          />
        </PlaceCard>

        <PlaceCard
          id="night"
          when="Night"
          title="Finish the day"
          formula={aarDone ? "AAR · done" : "AAR · blank"}
          open={open === "night"}
          onToggle={toggleCard}
        >
          <p className="text-sm leading-relaxed text-muted">
            After Action Report and tomorrow live on After. No second form here.
          </p>
          <Link
            to="/after"
            hash="finish"
            className="mt-3 inline-flex h-11 items-center text-sm text-fg underline underline-offset-4"
          >
            Open After
          </Link>
        </PlaceCard>
      </ul>

      {working ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-5 w-full"
            disabled={busy}
            onClick={askAboutToday}
          >
            Ask Roofus how today went
          </Button>
          {askErr ? <p className="mt-2 text-sm text-danger">{askErr}</p> : null}
        </>
      ) : null}

      <InstallHint />
      <NotionHint />
    </main>
  );
}

function PlanChips({
  loops,
  cluster,
  onPlan,
}: {
  loops: StreetLoop[];
  cluster: string;
  onPlan: (next: string) => void;
}) {
  const plan = loopsInPlan(loops, cluster);
  const unmatched = clusterLines(cluster).filter((line) => !loops.some((l) => matchLoopCluster(l, line)));
  if (!plan.length && !unmatched.length) {
    return <p className="text-sm leading-relaxed text-muted">No loop on today’s plan. Open After.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {plan.map((l) => (
        <Chip key={l.id} selected className="w-full justify-start" onClick={() => onPlan(dropLoopFromPlan(cluster, l))}>
          {loopHeadline(l)}
        </Chip>
      ))}
      {unmatched.map((line) => (
        <Chip key={line} selected className="w-full justify-start" onClick={() => onPlan(dropCluster(cluster, line))}>
          {line}
        </Chip>
      ))}
    </div>
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
    <div>
      <p className="text-xs leading-snug text-muted">Keep is the porch gate. Toss or Skip writes no sentence.</p>
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
    </div>
  );
}
