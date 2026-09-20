import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { DayClock } from "@/components/day-clock";
import { HomeSetupCard } from "@/components/home-setup-card";
import { InstallHint } from "@/components/install-hint";
import { NotionHint } from "@/components/notion-hint";
import { PinCard } from "@/components/pin-board";
import { Button } from "@/components/ui/button";
import { whenCoachReady, useCoach } from "@/lib/coach-store";
import { abortTalk, sendRoofus } from "@/lib/roofus-talk";
import { blankDay, isCountKey, localDateKey, useDayBook } from "@/lib/day-book";
import { freshKeptSentence } from "@/lib/kept-storm";
import { lastPinOnLoop, nextBlankOnLoop, pinLabel, pinsForLoop } from "@/lib/pins";
import { preKnock } from "@/lib/pocket-cards";
import { companyOf, setupSnap, truckSetupOpen } from "@/lib/setup-progress";
import { pinOnDay } from "@/lib/reminders";
import { useSettings } from "@/lib/settings-store";
import { useSurvive } from "@/lib/survive-store";
import { clusterLines, firstRemainingInPlan, loopHeadline, loopLabel } from "@/lib/streets-rank";
import { useStreets } from "@/lib/streets-store";
import { usePins } from "@/lib/pins-store";
import { useWeather } from "@/lib/weather-store";
import { pack, todayWeatherLine } from "@/lib/tenant";



/** Today is the field log. Plan owns hunt, Keep / Toss, and AAR. Route stays /truck. */
export const Route = createFileRoute("/truck")({
  codeSplitGroupings: [],
  component: Truck,
});

function Truck() {
  return <DaySheet />;
}

function DaySheet() {
  const date = localDateKey();
  const stored = useDayBook((s) => s.days[date]);
  const day = stored ?? blankDay(date);
  const bump = useDayBook((s) => s.bump);
  const profile = useDayBook((s) => s.profile);
  const loops = useStreets((s) => s.loops);
  const ageMin = useStreets((s) => s.ageMin);
  const ageMax = useStreets((s) => s.ageMax);
  const keptStorms = useWeather((s) => s.keptStorms);
  const fetchedAt = useWeather((s) => s.fetchedAt);
  const warrantyLine = useSettings((s) => s.warrantyLine);
  const survive = useSurvive();
  const busy = useCoach((s) => s.busy);
  const [askErr, setAskErr] = useState<string | null>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinErr, setPinErr] = useState("");
  const addPin = usePins((s) => s.add);
  const allPins = usePins((s) => s.pins);
  const openPinId = usePins((s) => s.openPinId);
  const current = firstRemainingInPlan(loops, day.cluster);
  const extra = Math.max(0, clusterLines(day.cluster).length - 1);
  const keptLine = freshKeptSentence(keptStorms);
  const working = loops.find((l) => l.status === "working");
  const pinCount = current ? pinsForLoop(allPins, current.id).length : allPins.length;
  const lastPin = current
    ? lastPinOnLoop(allPins, current.id)
    : allPins.reduce<(typeof allPins)[number] | undefined>((a, b) => (!a || a.createdAt < b.createdAt ? b : a), undefined);
  const nextDoor = working ? nextBlankOnLoop(allPins, working.id) : undefined;
  const editingPin = openPinId ? allPins.find((p) => p.id === openPinId) : undefined;

  useEffect(() => {
    if (openPinId) return;
    if (nextDoor) usePins.getState().open(nextDoor.id);
  }, [openPinId, nextDoor?.id]);

  function placePin(lat: number, lng: number, notice = "") {
    addPin({ lat, lng, source: "truck" });
    setPinBusy(false);
    setPinErr(notice);
  }

  function dropPin() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      const center = useStreets.getState().mapCenter;
      if (center) {
        placePin(center.lat, center.lng, "This phone will not share a location. Dropped on the map.");
        return;
      }
      setPinErr("Turn on location, or drop a pin on Plan.");
      return;
    }
    setPinBusy(true);
    setPinErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placePin(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        const center = useStreets.getState().mapCenter;
        if (center) {
          placePin(center.lat, center.lng, "Could not get a location. Dropped on the map.");
          return;
        }
        setPinBusy(false);
        setPinErr("Could not get a location. Open Plan and drop a pin.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 15_000 },
    );
  }

  function askAboutToday() {
    setAskErr(null);
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
  const emptyBook = truckSetupOpen(snap);
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
  const weatherLine = todayWeatherLine(day.storm, keptLine, pack);


  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title={pack.places.today} />
      <HomeSetupCard
        snap={snap}
        afterAction={day.afterAction}
        stormFetchedOn={fetchedAt.slice(0, 10)}
        stackMonth={survive.stackMonth}
        dayTotal={day.knocks + day.talks + day.looks + day.sets}
        pinToday={allPins.some((p) => pinOnDay(p.createdAt, date))}
      />
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-faint">{day.date}</p>
      <DayClock where="today" />
      <h1 className="mt-3 font-display text-2xl leading-tight tracking-tight">
        {profile.goBy.trim() ? `${profile.goBy.trim()}'s day` : pack.places.today}
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

      <section className="mt-5 rounded-2xl border border-border bg-surface px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Working</p>
        {current ? (
          <>
            <p className="mt-1 font-display text-xl tracking-tight">{loopHeadline(current)}</p>
            <p className="mt-1 text-sm leading-relaxed">
              {knock.age}
              {extra ? ` · +${extra} more` : ""}
              {knock.hours ? ` · ${knock.hours}` : ""}
            </p>
            <Link to="/door" className="mt-2 inline-flex h-11 items-center text-sm text-fg underline underline-offset-4">
              Cards
            </Link>
          </>
        ) : (
          <>
            <p className="mt-1 font-display text-xl tracking-tight">No Working loop</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">Pick one on Plan. Pin still works.</p>
            <Link to="/after" className="mt-2 inline-flex h-11 items-center text-sm text-fg underline underline-offset-4">
              Plan
            </Link>
          </>
        )}
      </section>

      {nextDoor && nextDoor.id !== editingPin?.id ? (
        <section className="mt-3 rounded-2xl border border-border bg-surface px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Next door</p>
          <p className="mt-1 text-sm leading-relaxed">{pinLabel(nextDoor)}</p>
          <PinCard pin={nextDoor} />
        </section>
      ) : null}

      <section className="mt-3 rounded-2xl border border-border bg-surface px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Pin</p>
        <p className="mt-1 text-sm leading-relaxed">
          {lastPin
            ? `${pinCount} pin${pinCount === 1 ? "" : "s"} · last ${pinLabel(lastPin)}`
            : "Tap Pin at the house"}
        </p>
        <p className="mt-1 text-xs leading-snug text-muted">
          GPS drop. Opens this house on this page. Status stays blank until you pick. Not a CRM.
        </p>
        <button
          type="button"
          disabled={pinBusy}
          onClick={dropPin}
          className="mt-3 h-12 w-full rounded-full bg-fg text-sm text-paper disabled:opacity-40"
        >
          {pinBusy ? "Dropping pin…" : "Pin"}
        </button>
        {pinErr ? <p className="mt-2 text-sm leading-relaxed text-muted">{pinErr}</p> : null}
        {editingPin ? (
          <div className="mt-3 border-t border-border pt-3">
            <PinCard pin={editingPin} />
          </div>
        ) : lastPin ? (
          <p className="mt-3 text-sm leading-relaxed">
            Last: {pinLabel(lastPin)}
            {lastPin.note.trim() ? ` · ${lastPin.note.trim()}` : ""}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted">No pin yet. Tap Pin where you are.</p>
        )}
        {pinCount > 1 ? (
          <p className="mt-1 text-xs text-muted">{pinCount} on this walk. Map and long board stay on Plan.</p>
        ) : null}
      </section>

      <ul className="mt-3 grid grid-cols-2 gap-2">
        {pack.labor.units.map((c) => {
          const key = isCountKey(c.key) ? c.key : null;
          const value = key ? day[key] : 0;
          return (
            <li key={c.key} className="relative min-w-0 rounded-2xl border border-border bg-surface">
              <button
                type="button"
                aria-label={`Plus ${c.label}`}
                className="flex min-h-24 w-full flex-col items-start px-3 py-3 pr-12 pb-12 text-left"
                onClick={() => {
                  if (key) bump(key, 1);
                }}
              >
                <p className="text-[11px] uppercase tracking-wide text-faint">{c.label}</p>
                <p className="mt-1 font-display text-4xl tabular-nums leading-none">{value}</p>
                <p className="mt-1 text-xs text-muted">{c.hint}</p>
              </button>
              <button
                type="button"
                aria-label={`Minus ${c.label}`}
                className="absolute bottom-1 right-1 inline-flex size-11 items-center justify-center rounded-full border border-border text-sm"
                onClick={() => {
                  if (key) bump(key, -1);
                }}
              >
                −
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-sm leading-relaxed">{weatherLine}</p>

      <Link
        to="/after"
        hash="finish"
        className="mt-5 flex min-h-14 items-center justify-between gap-3 border-t border-border py-3"
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-sm text-fg">Finish the day</span>
          <span className="text-xs text-faint">{aarDone ? "AAR · done" : "AAR · blank"}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
      </Link>

      <Button type="button" variant="outline" size="lg" className="mt-4 w-full" disabled={busy} onClick={askAboutToday}>
        {pack.copy.askHowTodayWent}
      </Button>
      {askErr ? <p className="mt-2 text-sm text-danger">{askErr}</p> : null}

      {emptyBook ? (
        <>
          <InstallHint />
          <NotionHint />
        </>
      ) : null}
    </main>
  );
}
