import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AarFields } from "@/components/aar-fields";
import { Last48Hours } from "@/components/last-48-hours";
import { PinBoard, RevisitPinList, MorningPinList } from "@/components/pin-board";
import { PinsMap } from "@/components/pins-map";
import { AppHeader } from "@/components/app-header";
import { PlaceCard } from "@/components/place-card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { blankDay, localDateKey, useDayBook, weekTally, weekTallyLine } from "@/lib/day-book";
import { mapsLabel, mapsUrl } from "@/lib/maps-url";
import { freshKeptSentence } from "@/lib/kept-storm";
import { formatMiles, loopHasPin, milesBetween, nearMeList } from "@/lib/streets-near";
import {
  addLoopToPlan,
  clusterLines,
  dropCluster,
  dropLoopFromPlan,
  firstRemainingInPlan,
  loopHeadline,
  loopInPlan,
  loopPlace,
  loopZip,
  loopsInPlan,
  matchLoopCluster,
  searchStreetLoops,
} from "@/lib/streets-rank";
import { useStreets } from "@/lib/streets-store";
import { morningPins, pinsForLoop, revisitPins, type YearFilter } from "@/lib/pins";
import { reclusterPins, usePins } from "@/lib/pins-store";
import {
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
  parseAgeDraft,
  type LoopResult,
  type LoopStatus,
  type StreetLoop,
} from "@/lib/streets-types";
import { mentionOnStreet } from "@/lib/weather-match";
import { useWeather } from "@/lib/weather-store";

/** Plan is the map. Route stays /after. Walks form from pins. */
export const Route = createFileRoute("/after")({
  codeSplitGroupings: [],
  component: AfterPage,
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
  { min: DEFAULT_AGE_MIN, max: DEFAULT_AGE_MAX, label: "15–22" },
  { min: 20, max: 30, label: "20–30" },
];

const YEAR_CHIPS: { id: YearFilter; label: string }[] = [
  { id: "all", label: "All years" },
  { id: "band", label: "In band" },
  { id: "blank", label: "No year" },
];

function AfterPage() {
  const profile = useDayBook((s) => s.profile);
  const date = localDateKey();
  const stored = useDayBook((s) => s.days[date]);
  const day = stored ?? blankDay(date);
  const patchToday = useDayBook((s) => s.patchToday);
  const loops = useStreets((s) => s.loops);
  const note = useStreets((s) => s.note);
  const ageMin = useStreets((s) => s.ageMin);
  const ageMax = useStreets((s) => s.ageMax);
  const setAge = useStreets((s) => s.setAge);
  const [ageOpen, setAgeOpen] = useState(false);
  const [draftMin, setDraftMin] = useState(() => String(ageMin));
  const [draftMax, setDraftMax] = useState(() => String(ageMax));
  const [q, setQ] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const [revisit, setRevisit] = useState(false);
  const [morning, setMorning] = useState(false);
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null);
  const [nearBusy, setNearBusy] = useState(false);
  const [nearErr, setNearErr] = useState("");
  const allPins = usePins((s) => s.pins);
  const days = useDayBook((s) => s.days);
  const pulse = useWeather((s) => s.pulse);
  const pending = useWeather((s) => s.pending);
  const tossed = useWeather((s) => s.tossed);
  const keptStorms = useWeather((s) => s.keptStorms);
  const keep = useWeather((s) => s.keep);
  const toss = useWeather((s) => s.toss);
  const keepLead = useWeather((s) => s.keepLead);
  const tossLead = useWeather((s) => s.tossLead);
  const skipLead = useWeather((s) => s.skipLead);
  const keptLine = freshKeptSentence(keptStorms);
  const revisitCount = revisitPins(allPins).length;
  const morningCount = morningPins(allPins).length;
  const hasWorking = loops.some((l) => l.status === "working");
  const [huntOpen, setHuntOpen] = useState(!hasWorking);
  const [finishOpen, setFinishOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.location.hash === "#finish") return true;
    return new Date().getHours() >= 17;
  });
  const [pulseOpen, setPulseOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash === "#pulse";
  });
  const week = weekTally(days, date);
  const weekLine = week.knocks || week.talks || week.looks || week.sets ? weekTallyLine(week) : "";
  const { working, rest, searching } = searchStreetLoops(loops, q);
  const nearRest = nearMe ? nearMeList(rest, here) : [];
  const plan = day.cluster;
  const noSearchHits = searching && !working.length && !(nearMe ? nearRest.length : rest.length);

  function commitAge() {
    setAge(parseAgeDraft(draftMin, ageMin), parseAgeDraft(draftMax, ageMax));
  }

  function typeAge(raw: string, write: (next: string) => void) {
    write(raw.replace(/\D/g, "").slice(0, 2));
  }

  function toggleNearMe() {
    if (nearMe) {
      setNearMe(false);
      setHere(null);
      setNearBusy(false);
      setNearErr("");
      return;
    }
    if (!loops.length) {
      setNearErr("Pin a house first. Near me does not invent a zip.");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setNearErr("This phone will not share a location. Walk list stays.");
      return;
    }
    setNearBusy(true);
    setNearErr("");
    setRevisit(false);
    setMorning(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHere({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setNearMe(true);
        setNearBusy(false);
      },
      () => {
        setNearMe(false);
        setHere(null);
        setNearBusy(false);
        setNearErr("Could not get a location. Walk list stays.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  useEffect(() => {
    setDraftMin(String(ageMin));
    setDraftMax(String(ageMax));
  }, [ageMin, ageMax]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#finish") {
      setFinishOpen(true);
      document.getElementById("finish")?.scrollIntoView({ block: "start" });
    }
    if (window.location.hash === "#pulse") {
      setPulseOpen(true);
      document.getElementById("pulse")?.scrollIntoView({ block: "start" });
    }
  }, []);

  if (!profile.setupDone) {
    return (
      <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
        <AppHeader title="Plan" />
        <h1 className="mt-4 font-display text-2xl leading-tight tracking-tight">Where you knock.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Night-before and morning. Pin from Today, or search a zip. Walks form from the houses you mark. Counties in
          Settings are for storms, not a hunt rebuild.
        </p>
        <Link
          to="/settings/territory"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-fg text-sm text-paper"
        >
          Open Settings
        </Link>
        <Link
          to="/settings"
          className="mt-6 mb-2 flex min-h-14 items-center justify-between gap-3 border-t border-border py-3"
        >
          <span className="flex min-w-0 flex-col">
            <span className="text-sm text-fg">Settings</span>
            <span className="text-xs text-faint">You, territory, hours, mindset, backup</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
        </Link>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Plan" />
      <ul className="mt-4 flex flex-col gap-3">
        <PlaceCard
          id="hunt"
          when="Hunt"
          title="Where you knock"
          formula={
            working[0]
              ? loopHeadline(working[0])
              : loops.length
                ? `${loops.length} loop${loops.length === 1 ? "" : "s"}`
                : "Pin from Today, or search a zip"
          }
          open={huntOpen}
          onToggle={() => setHuntOpen((v) => !v)}
        >
          <p className="text-sm leading-relaxed text-muted">
            Night-before and morning. {profile.counties.trim()}, {profile.states.trim()}. Drop pins. Distance makes the
            loop. Age first on the porch.
          </p>

          <PlanChips
            loops={loops}
            cluster={plan}
            onPlan={(next) => {
              patchToday({ cluster: next });
              const hit = firstRemainingInPlan(loops, next);
              if (hit) {
                useStreets.getState().setStatus(hit.id, "working");
                reclusterPins();
              }
            }}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {YEAR_CHIPS.map((c) => (
              <Chip key={c.id} selected={yearFilter === c.id} onClick={() => setYearFilter(c.id)}>
                {c.label}
              </Chip>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAgeOpen((o) => !o)}
            className="mt-3 flex h-11 w-full items-center justify-between rounded-2xl border border-border px-4 text-sm"
          >
            <span>
              Roofs {ageMin}–{ageMax}
            </span>
            <span className="text-muted">{ageOpen ? "Done" : "Change"}</span>
          </button>
          {ageOpen ? (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <Chip key={p.label} selected={ageMin === p.min && ageMax === p.max} onClick={() => setAge(p.min, p.max)}>
                    {p.label}
                  </Chip>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted">
                  From
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={draftMin}
                    onChange={(e) => typeAge(e.target.value, setDraftMin)}
                    onBlur={commitAge}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                    className="mt-0"
                    aria-label="Roof age from"
                  />
                </label>
                <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted">
                  To
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={draftMax}
                    onChange={(e) => typeAge(e.target.value, setDraftMax)}
                    onBlur={commitAge}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                    className="mt-0"
                    aria-label="Roof age to"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-faint">
                Filter on years you typed. The house in front of you is the year they give you.
              </p>
            </div>
          ) : null}

          <PinsMap yearFilter={yearFilter} />

          {note && loops.length ? <p className="mt-3 text-sm leading-relaxed text-muted">{note}</p> : null}

          <div className="mt-4 flex flex-col gap-3">
            <input
              className="h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find a loop, street, or zip"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Chip selected={nearMe} disabled={nearBusy} onClick={toggleNearMe}>
                {nearBusy ? "Finding you…" : "Near me"}
              </Chip>
              <Chip
                selected={morning}
                onClick={() => {
                  setMorning((v) => {
                    const next = !v;
                    if (next) {
                      setNearMe(false);
                      setHere(null);
                      setRevisit(false);
                    }
                    return next;
                  });
                }}
              >
                {morningCount ? `Morning · ${morningCount}` : "Morning"}
              </Chip>
              <Chip
                selected={revisit}
                onClick={() => {
                  setRevisit((v) => {
                    const next = !v;
                    if (next) {
                      setNearMe(false);
                      setHere(null);
                      setMorning(false);
                    }
                    return next;
                  });
                }}
              >
                {revisitCount ? `Revisit · ${revisitCount}` : "Revisit"}
              </Chip>
            </div>
            {nearErr ? <p className="text-sm leading-relaxed text-muted">{nearErr}</p> : null}
            {noSearchHits ? (
              <p className="text-sm leading-relaxed text-muted">No loops match that. Clear the box to see the walks.</p>
            ) : null}
          </div>

          {!loops.length ? (
            <p className="mt-6 text-sm leading-relaxed text-muted">Pin from Today, or search a zip.</p>
          ) : null}

          {morning ? (
            <section className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-faint">Morning</p>
              <MorningPinList
                loopLabel={(id) => {
                  const loop = loops.find((l) => l.id === id);
                  return loop ? loopHeadline(loop) : "Loop";
                }}
              />
            </section>
          ) : revisit ? (
            <section className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-faint">Revisit</p>
              <RevisitPinList
                loopLabel={(id) => {
                  const loop = loops.find((l) => l.id === id);
                  return loop ? loopHeadline(loop) : "Loop";
                }}
              />
            </section>
          ) : (
            <>
              {working.length ? (
                <section className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-faint">Working</p>
                  <ul className="mt-3 flex flex-col gap-3">
                    {working.map((loop) => (
                      <LoopCard
                        key={loop.id}
                        loop={loop}
                        plan={plan}
                        miles={here && nearMe ? milesBetween(here.lat, here.lon, loop.lat, loop.lon) : undefined}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}

              {nearMe && here ? (
                <section className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-faint">Near me</p>
                  {nearRest.length ? (
                    <ul className="mt-3 flex flex-col gap-3">
                      {nearRest.map((loop) => (
                        <LoopCard
                          key={loop.id}
                          loop={loop}
                          plan={plan}
                          miles={milesBetween(here.lat, here.lon, loop.lat, loop.lon)}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      No other loops in this book. Near me does not invent a zip.
                    </p>
                  )}
                </section>
              ) : rest.length ? (
                <section className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-faint">Walks</p>
                  <ul className="mt-3 flex flex-col gap-3">
                    {rest.map((loop) => (
                      <LoopCard key={loop.id} loop={loop} plan={plan} />
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </PlaceCard>

        <PlaceCard
          id="pulse"
          when="Last 48 hours"
          title="Keep / Toss"
          formula={keptLine ? "Keep on" : "Check last 48 hours"}
          open={pulseOpen}
          onToggle={() => setPulseOpen((v) => !v)}
          anchor="pulse"
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
          id="finish"
          when="Night"
          title="Finish the day"
          formula={day.afterAction.trim() ? "AAR · done" : "AAR · blank"}
          open={finishOpen}
          onToggle={() => setFinishOpen((v) => !v)}
          anchor="finish"
        >
          <p className="text-sm leading-relaxed text-muted">Pick tomorrow. Finish the journal. Desk drops are tagged.</p>
          {weekLine ? <p className="mt-2 text-sm leading-relaxed">{weekLine}</p> : null}
          <AarFields value={day.afterAction} onChange={(v) => patchToday({ afterAction: v })} />
          <label className="mt-4 block min-w-0">
            <span className="text-xs font-medium uppercase tracking-wide text-faint">Tomorrow I start at</span>
            <input
              className="mt-2 h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
              value={day.tomorrowStreet}
              onChange={(e) => patchToday({ tomorrowStreet: e.target.value })}
            />
          </label>
        </PlaceCard>
      </ul>

      <Link
        to="/settings"
        className="mt-6 mb-2 flex min-h-14 items-center justify-between gap-3 border-t border-border py-3"
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-sm text-fg">Settings</span>
          <span className="text-xs text-faint">You, territory, hours, mindset, backup</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
      </Link>
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
  if (!plan.length && !unmatched.length) return null;
  return (
    <div className="mt-4 flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">On the plan</p>
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

function LoopCard({
  loop,
  plan,
  miles,
}: {
  loop: StreetLoop;
  plan: string;
  miles?: number;
}) {
  const [open, setOpen] = useState(false);
  const setStatus = useStreets((s) => s.setStatus);
  const setResult = useStreets((s) => s.setResult);
  const rename = useStreets((s) => s.rename);
  const patchToday = useDayBook((s) => s.patchToday);
  const kept = useWeather((s) => s.kept);
  const pinCount = usePins((s) => pinsForLoop(s.pins, loop.id).length);
  const zip = loopZip(loop);
  const place = loopPlace(loop) || loopHeadline(loop);
  const twp = (loop.township ?? "").trim();
  const mention = loop.status === "working" ? mentionOnStreet(kept, loop) : "";
  const onPlan = loopInPlan(loop, plan);
  const year = loop.medianYear ? ` · ~${loop.medianYear}` : "";
  const sub = [twp, zip].filter(Boolean).join(" · ");
  const milesLabel = miles != null && loopHasPin(loop) ? formatMiles(miles) : "";

  function markStatus(next: LoopStatus) {
    setStatus(loop.id, loop.status === next ? "fresh" : next);
    reclusterPins();
  }

  return (
    <li className="rounded-2xl border border-border bg-surface px-4 py-3">
      <button type="button" className="w-full text-left" onClick={() => setOpen((o) => !o)}>
        <p className="font-display text-xl tracking-tight">{place}</p>
        <p className="mt-1 text-xs text-muted">
          {sub ? `${sub} · ` : ""}
          {pinCount} pin{pinCount === 1 ? "" : "s"}
          {year}
          {milesLabel ? ` · ${milesLabel}` : ""}
          {loop.status !== "fresh" ? ` · ${loop.status}` : ""}
        </p>
        {mention ? <p className="mt-2 text-sm leading-relaxed text-muted">{mention}</p> : null}
      </button>
      <a
        href={mapsUrl(loop)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex h-11 items-center text-sm text-fg underline underline-offset-4"
      >
        {mapsLabel(loop)}
      </a>
      {open ? (
        <div className="mt-3 border-t border-border pt-3">
          <label className="block min-w-0">
            <span className="text-xs text-muted">Name</span>
            <Input
              className="mt-1"
              defaultValue={place}
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next && next !== place) rename(loop.id, next);
              }}
            />
          </label>
          <p className="mt-3 text-sm leading-relaxed">{loop.streets.join(", ") || "Streets fill from pin addresses."}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => markStatus(s.id)}
                className={`h-11 rounded-full px-3 text-sm ${
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
                onClick={() => setResult(loop.id, loop.lastResult === r.id ? "" : r.id)}
                className={`h-11 rounded-full px-3 text-sm ${
                  loop.lastResult === r.id ? "bg-fg text-paper" : "border border-border"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <Chip
              selected={onPlan}
              onClick={() => {
                const cur = useDayBook.getState().today();
                if (onPlan) {
                  patchToday({ cluster: dropLoopFromPlan(cur.cluster, loop) });
                  return;
                }
                setStatus(loop.id, "working");
                reclusterPins();
                patchToday({
                  cluster: addLoopToPlan(cur.cluster, loop),
                  storm: cur.storm.trim() || mentionOnStreet(kept, loop),
                });
              }}
            >
              Use today
            </Chip>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">Pins</p>
            <PinBoard loopId={loop.id} />
          </div>
        </div>
      ) : null}
    </li>
  );
}
