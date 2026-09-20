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

/** Start / End stay the labor Do. Pause / Resume is a chip, not a second Do. */
export function DayClock({ where }: { where: "today" | "finish" }) {
  const days = useDayBook((s) => s.days);
  const startDay = useDayBook((s) => s.startDay);
  const pauseDay = useDayBook((s) => s.pauseDay);
  const resumeDay = useDayBook((s) => s.resumeDay);
  const endDay = useDayBook((s) => s.endDay);
  const date = localDateKey();
  const today = days[date] ?? blankDay(date);
  const open = findOpenLabor(days, date);
  const closed = !open && today.labor.startedAt && today.labor.endedAt ? today.labor : null;
  const paused = open ? laborIsPaused(open) : false;
  const ticking = open ? laborIsRunning(open) : false;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ticking]);

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
        <div className="mt-3">
          {paused ? (
            <Chip onClick={resumeDay}>Resume</Chip>
          ) : (
            <Chip onClick={pauseDay}>Pause</Chip>
          )}
        </div>
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
