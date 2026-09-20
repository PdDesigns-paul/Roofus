import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  blankDay,
  findOpenLabor,
  formatClockTime,
  formatElapsed,
  localDateKey,
  shiftMinutes,
  useDayBook,
} from "@/lib/day-book";

/** Start / End on Today. End also on Plan Finish when the clock is open. */
export function DayClock({ where }: { where: "today" | "finish" }) {
  const days = useDayBook((s) => s.days);
  const startDay = useDayBook((s) => s.startDay);
  const endDay = useDayBook((s) => s.endDay);
  const date = localDateKey();
  const today = days[date] ?? blankDay(date);
  const open = findOpenLabor(days, date);
  const closed = !open && today.labor.startedAt && today.labor.endedAt ? today.labor : null;
  const running = Boolean(open);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const live = open ? shiftMinutes(open, now) : closed ? shiftMinutes(closed) : null;
  const elapsed = live != null ? formatElapsed(live) : "";

  if (where === "finish") {
    if (!open) return null;
    return (
      <div className="mt-4">
        <p className="font-display text-3xl tabular-nums leading-none">{elapsed}</p>
        <p className="mt-1 text-sm text-muted">
          Started {formatClockTime(open.startedAt)}
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
        <p className="mt-1 text-sm text-muted">Started {formatClockTime(open.startedAt)}</p>
        <Button type="button" size="lg" className="mt-3 w-full" onClick={endDay}>
          End day
        </Button>
      </div>
    );
  }

  if (closed) {
    return (
      <p className="mt-3 text-sm leading-relaxed">
        Started {formatClockTime(closed.startedAt)} · ended {formatClockTime(closed.endedAt)}
        {elapsed ? ` · ${elapsed}` : ""}
      </p>
    );
  }

  return (
    <Button type="button" size="lg" className="mt-3 w-full" onClick={startDay}>
      Start day
    </Button>
  );
}
