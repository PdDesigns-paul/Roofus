import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AarFields } from "@/components/aar-fields";
import { AppHeader } from "@/components/app-header";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { blankDay, localDateKey, useDayBook } from "@/lib/day-book";
import { mapsLabel, mapsUrl } from "@/lib/maps-url";
import { phoneError, readJson } from "@/lib/read-json";
import { useScout } from "@/lib/scout-store";
import { formatMiles, loopHasPin, milesBetween, nearMeList, streetsScoutTag } from "@/lib/streets-near";
import {
  addLoopToPlan,
  dropLoopFromPlan,
  groupLoopsByTownship,
  loopAge,
  loopHeadline,
  loopInPlan,
  loopPlace,
  loopZip,
  searchStreetLoops,
} from "@/lib/streets-rank";
import { marketKey, useStreets } from "@/lib/streets-store";
import {
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
  parseAgeDraft,
  type LoopResult,
  type LoopStatus,
  type StreetLoop,
  type StreetsBuildResponse,
} from "@/lib/streets-types";
import { parseList, countyBasename } from "@/lib/us-state-fips";
import { mentionOnStreet } from "@/lib/weather-match";
import { useWeather } from "@/lib/weather-store";

/** After hosts the Streets hunt and the night wrap-up. Formerly /streets. */
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

function AfterPage() {
  const profile = useDayBook((s) => s.profile);
  const date = localDateKey();
  const stored = useDayBook((s) => s.days[date]);
  const day = stored ?? blankDay(date);
  const patchToday = useDayBook((s) => s.patchToday);
  const loops = useStreets((s) => s.loops);
  const note = useStreets((s) => s.note);
  const builtFor = useStreets((s) => s.builtFor);
  const ageMin = useStreets((s) => s.ageMin);
  const ageMax = useStreets((s) => s.ageMax);
  const setAge = useStreets((s) => s.setAge);
  const replace = useStreets((s) => s.replace);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ageOpen, setAgeOpen] = useState(false);
  const [draftMin, setDraftMin] = useState(() => String(ageMin));
  const [draftMax, setDraftMax] = useState(() => String(ageMax));
  const [openCounty, setOpenCounty] = useState<string | null | undefined>(undefined);
  const [q, setQ] = useState("");
  const [nearMe, setNearMe] = useState(false);
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null);
  const [nearBusy, setNearBusy] = useState(false);
  const [nearErr, setNearErr] = useState("");
  const [emptyCounties, setEmptyCounties] = useState<string[]>([]);
  const key = marketKey(profile.counties, profile.states, ageMin, ageMax);
  const stale = Boolean(loops.length && builtFor && builtFor !== key);
  const autoBuild = useRef(false);
  const { working, rest, searching } = searchStreetLoops(loops, q);
  const groups = groupLoopsByTownship(rest);
  const nearRest = nearMe ? nearMeList(rest, here) : [];
  const plan = day.cluster;
  const asked = parseList(profile.counties);
  const have = new Set(loops.map((l) => countyBasename(l.county).toLowerCase()));
  const ghostCounties = [
    ...new Set(
      [...emptyCounties, ...asked.filter((c) => loops.length && !have.has(countyBasename(c).toLowerCase()))].map(
        (c) => c.trim(),
      ),
    ),
  ].filter((c) => {
    if (!searching) return true;
    return c.toLowerCase().includes(q.trim().toLowerCase());
  });
  const defaultCounty = working.length ? null : (groups[0]?.county ?? null);
  const shownCounty = openCounty === undefined ? defaultCounty : openCounty;
  const noSearchHits =
    searching &&
    !working.length &&
    (nearMe ? !nearRest.length : !groups.length && !ghostCounties.length);

  function commitAge() {
    setAge(parseAgeDraft(draftMin, ageMin), parseAgeDraft(draftMax, ageMax));
  }

  function typeAge(raw: string, write: (next: string) => void) {
    write(raw.replace(/\D/g, "").slice(0, 2));
  }

  async function build(force = false) {
    if (!profile.counties.trim() || !profile.states.trim()) {
      setErr("Fill county and state in Settings first.");
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
      const data = (await readJson(res)) as (StreetsBuildResponse & { error?: string }) | null;
      if (!data) throw new Error("Could not build streets.");
      if (!res.ok) throw new Error(phoneError(data.error, "Could not build streets."));
      // Restore may land while Census is still reading. Don't blow it away.
      if (!force && useStreets.getState().loops.length) return;
      replace(data.loops, {
        note: data.note,
        yearFrom: data.yearFrom,
        yearTo: data.yearTo,
        builtFor: key,
      });
      setEmptyCounties(data.emptyCounties ?? []);
    } catch (e) {
      setErr(phoneError(e, "Could not build streets."));
    } finally {
      setBusy(false);
    }
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
      setNearErr("Build loops first. Near me does not invent a zip.");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setNearErr("This phone will not share a location. County list stays.");
      return;
    }
    setNearBusy(true);
    setNearErr("");
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
        setNearErr("Could not get a location. County list stays.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  useEffect(() => {
    setDraftMin(String(ageMin));
    setDraftMax(String(ageMax));
  }, [ageMin, ageMax]);

  useEffect(() => {
    if (autoBuild.current) return;
    if (!profile.setupDone) return;
    if (!profile.counties.trim() || !profile.states.trim()) return;
    if (useStreets.getState().loops.length) return;
    autoBuild.current = true;
    void build();
    // first empty visit only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.setupDone, profile.counties, profile.states]);

  useEffect(() => {
    const missing = loops.filter((l) => /^\d{5}$/.test(l.zip) && !(l.town ?? "").trim()).map((l) => l.zip);
    if (!missing.length) return;
    let cancelled = false;
    void fetch(`/api/streets?zips=${missing.slice(0, 80).join(",")}`)
      .then((r) => r.json())
      .then((data: { towns?: Record<string, string> }) => {
        if (cancelled || !data.towns) return;
        if (!Object.keys(data.towns).length) return;
        useStreets.getState().setTowns(data.towns);
      })
      .catch(() => {
        /* zip still shows */
      });
    return () => {
      cancelled = true;
    };
  }, [loops]);

  if (!profile.setupDone) {
    return (
      <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
        <AppHeader title="After" />
        <h1 className="mt-4 font-display text-2xl leading-tight tracking-tight">Where you knock.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Settings needs a county and a state first. Then we build park-once loops from roofs in the age
          band — not from hail.
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
      <AppHeader title="After" />
      <h1 className="mt-4 font-display text-2xl leading-tight tracking-tight">Where you knock.</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {profile.counties.trim()}, {profile.states.trim()}. Each card is a walkable loop. Township is the folder.
      </p>

      <button
        type="button"
        onClick={() => setAgeOpen((o) => !o)}
        className="mt-4 flex h-11 w-full items-center justify-between rounded-2xl border border-border px-4 text-sm"
      >
        <span>Roofs {ageMin}–{ageMax}</span>
        <span className="text-muted">{ageOpen ? "Done" : "Change"}</span>
      </button>
      {ageOpen ? (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Chip
                key={p.label}
                selected={ageMin === p.min && ageMax === p.max}
                onClick={() => setAge(p.min, p.max)}
              >
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
            Targeting for the loop. The house in front of you is the year they give you.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void build(true)}
        className="mt-4 h-12 w-full rounded-full bg-fg text-sm text-paper disabled:opacity-40"
      >
        {busy ? "Building loops…" : loops.length ? "Rebuild from my counties" : "Build loops from my counties"}
      </button>
      {stale ? (
        <p className="mt-2 text-sm text-muted">Counties or age band changed. Rebuild to match.</p>
      ) : null}
      {err ? <p className="mt-2 text-sm text-danger">{err}</p> : null}
      {note && loops.length ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {loops.length} loop{loops.length === 1 ? "" : "s"}. {note}
        </p>
      ) : null}

      {loops.length ? (
        <div className="mt-4 flex flex-col gap-3">
          <input
            className="h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a township, loop, street, zip, or county"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Chip selected={nearMe} disabled={nearBusy} onClick={toggleNearMe}>
              {nearBusy ? "Finding you…" : "Near me"}
            </Chip>
          </div>
          {nearErr ? <p className="text-sm leading-relaxed text-muted">{nearErr}</p> : null}
          {noSearchHits ? (
            <p className="text-sm leading-relaxed text-muted">
              No loops match that. Clear the box to see the county folders.
            </p>
          ) : null}
        </div>
      ) : null}

      {busy ? (
        <p className="mt-6 text-sm text-muted">
          Reading housing years. This can take half a minute. Stay on this page.
        </p>
      ) : null}

      {!busy && !loops.length ? (
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Empty until you build. Census years on streets in your age band — not hail. Each card is a park-once loop.
        </p>
      ) : null}

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
      ) : (
      <ul className="mt-5 flex flex-col gap-2">
        {groups.map((group) => {
          const open = searching || shownCounty === group.county;
          const n = group.townships.reduce((sum, t) => sum + t.loops.length, 0);
          return (
            <li key={group.county}>
              <button
                type="button"
                onClick={() => setOpenCounty(open ? null : group.county)}
                className="flex h-11 w-full items-center justify-between rounded-2xl border border-border px-4 text-left"
              >
                <span className="text-xs font-medium uppercase tracking-wide">{group.county}</span>
                <span className="text-xs text-muted">
                  {n} loop{n === 1 ? "" : "s"}
                </span>
              </button>
              {open ? (
                <ul className="mt-3 flex flex-col gap-4">
                  {group.townships.map((twp) => (
                    <li key={`${group.county}-${twp.township}`}>
                      <p className="px-1 text-xs font-medium uppercase tracking-wide text-faint">{twp.township}</p>
                      <ul className="mt-2 flex flex-col gap-3">
                        {twp.loops.map((loop) => (
                          <LoopCard key={loop.id} loop={loop} plan={plan} />
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
        {ghostCounties.map((county) => (
          <li key={`empty-${county}`}>
            <div className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-dashed border-border px-4">
              <span className="text-xs font-medium uppercase tracking-wide">{county}</span>
              <span className="text-xs text-muted">No age-band loops yet</span>
            </div>
          </li>
        ))}
      </ul>
      )}

      <section className="mt-8 border-t border-border pt-5">
        <h2 className="font-display text-xl tracking-tight">Finish the day</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Pick tomorrow. Finish the journal. Do not expand the hunt.
        </p>
        <AarFields value={day.afterAction} onChange={(v) => patchToday({ afterAction: v })} />
        <label className="mt-4 block min-w-0">
          <span className="text-xs font-medium uppercase tracking-wide text-faint">Tomorrow I start at</span>
          <input
            className="mt-2 h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-base"
            value={day.tomorrowStreet}
            onChange={(e) => patchToday({ tomorrowStreet: e.target.value })}
          />
        </label>
      </section>

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
  const patchToday = useDayBook((s) => s.patchToday);
  const kept = useWeather((s) => s.kept);
  const card = useScout((s) => s.cards[loop.id]);
  const zip = loopZip(loop);
  const place = loopPlace(loop) || loopHeadline(loop);
  const twp = (loop.township ?? "").trim();
  const age = loopAge(loop);
  const mention = loop.status === "working" ? mentionOnStreet(kept, loop) : "";
  const tag = streetsScoutTag(card);
  const onPlan = loopInPlan(loop, plan);
  const sub = [twp, zip].filter(Boolean).join(" · ");
  const milesLabel = miles != null && loopHasPin(loop) ? formatMiles(miles) : "";

  return (
    <li className="rounded-2xl border border-border bg-surface px-4 py-3">
      <button type="button" className="w-full text-left" onClick={() => setOpen((o) => !o)}>
        <p className="font-display text-xl tracking-tight">{place}</p>
        <p className="mt-1 text-xs text-muted">
          {sub ? `${sub} · ` : ""}
          roofs around {age} years
          {milesLabel ? ` · ${milesLabel}` : ""}
          {loop.status !== "fresh" ? ` · ${loop.status}` : ""}
        </p>
        {tag ? (
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {tag.ageBand} · {tag.stormBand}
            {tag.why ? ` · ${tag.why}` : ""}
          </p>
        ) : null}
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
          <p className="text-sm leading-relaxed">{loop.streets.join(", ")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(loop.id, loop.status === s.id ? "fresh" : s.id)}
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
                patchToday({
                  cluster: addLoopToPlan(cur.cluster, loop),
                  storm: cur.storm.trim() || mentionOnStreet(kept, loop),
                });
              }}
            >
              Use today
            </Chip>
          </div>
        </div>
      ) : null}
    </li>
  );
}
