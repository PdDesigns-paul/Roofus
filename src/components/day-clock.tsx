import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  blankDay,
  findOpenLabor,
  formatClockTime,
  formatElapsed,
  laborIsPaused,
  laborIsRunning,
  localDateKey,
  shiftMinutes,
  useDayBook,
} from "@/lib/day-book";

const TRAIL_HINT =
  "Trail works while Today is open. Locked phone or a killed tab stops the line, not the clock.";

/** Start / End stay the labor Do. Pause / Resume / Trail are chips, not a second Do. */
export function DayClock({ where }: { where: "today" | "finish" }) {
  const days = useDayBook((s) => s.days);
  const startDay = useDayBook((s) => s.startDay);
  const pauseDay = useDayBook((s) => s.pauseDay);
  const resumeDay = useDayBook((s) => s.resumeDay);
  const endDay = useDayBook((s) => s.endDay);
  const setTrailOn = useDayBook((s) => s.setTrailOn);
  const addTrailPoint = useDayBook((s) => s.addTrailPoint);
  const date = localDateKey();
  const today = days[date] ?? blankDay(date);
  const open = findOpenLabor(days, date);
  const closed = !open && today.labor.startedAt && today.labor.endedAt ? today.labor : null;
  const paused = open ? laborIsPaused(open) : false;
  const ticking = open ? laborIsRunning(open) : false;
  const trailOn = Boolean(open?.trailOn);
  const [now, setNow] = useState(() => Date.now());
  const [trailDenied, setTrailDenied] = useState(false);

  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ticking]);

  useEffect(() => {
    if (where !== "today" || !ticking || !trailOn) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setTrailDenied(true);
      return;
    }
    let watchId: number | null = null;
    function start() {
      if (watchId != null || typeof navigator === "undefined" || !navigator.geolocation) return;
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setTrailDenied(false);
          addTrailPoint({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            at: new Date().toISOString(),
          });
        },
        () => {
          setTrailDenied(true);
        },
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: 10_000 },
      );
    }
    function stop() {
      if (watchId != null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    }
    function onVis() {
      if (document.visibilityState === "visible") start();
      else stop();
    }
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stop();
    };
  }, [where, ticking, trailOn, addTrailPoint]);

  const live = open ? shiftMinutes(open, now) : closed ? shiftMinutes(closed) : null;
  const elapsed = live != null ? formatElapsed(live) : "";

  if (where === "finish") {
    if (!open) return null;
    return (
      <div className="mt-4">
        <p className="font-display text-3xl tabular-nums leading-none">{elapsed}</p>
        <p className="mt-1 text-sm text-muted">
          Started {formatClockTime(open.startedAt)}
          {paused ? " · Paused." : ""}
          {open.date !== date ? " · still open from yesterday" : ""}
        </p>
        <Button type="button" size="lg" className="mt-3 w-full" onClick={endDay}>
          End day
        </Button>
      </div>
    );
  }

  if (open) {
    return (
      <div className="mt-3">
        <p className="font-display text-3xl tabular-nums leading-none">{elapsed}</p>
        <p className="mt-1 text-sm text-muted">
          Started {formatClockTime(open.startedAt)}
          {paused ? " · Paused." : ""}
          {open.date !== date ? " · still open from yesterday" : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {paused ? (
            <Chip onClick={resumeDay}>Resume</Chip>
          ) : (
            <Chip onClick={pauseDay}>Pause</Chip>
          )}
          <Chip selected={trailOn} onClick={() => setTrailOn(!trailOn)}>
            Trail
          </Chip>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">{TRAIL_HINT}</p>
        {trailDenied && trailOn ? (
          <p className="mt-1 text-xs leading-relaxed text-muted">No location. Clock still runs.</p>
        ) : null}
        <Button type="button" size="lg" className="mt-3 w-full" onClick={endDay}>
          End day
        </Button>
      </div>
    );
  }

  if (closed) {
    return (
      <div className="mt-3">
        <p className="text-sm leading-relaxed">
          Started {formatClockTime(closed.startedAt)} · ended {formatClockTime(closed.endedAt)}
          {elapsed ? ` · ${elapsed}` : ""}
        </p>
        <Button type="button" size="lg" className="mt-3 w-full" onClick={startDay}>
          Start day
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" size="lg" className="mt-3 w-full" onClick={startDay}>
      Start day
    </Button>
  );
}
