import { Chip } from "@/components/ui/chip";
import { blankDay, localDateKey, useDayBook } from "@/lib/day-book";
import {
  PROCESS_BONUS,
  PROCESS_MANUAL,
  PROCESS_REQUIRED,
  processStrip,
  restoreProcess,
  serializeProcess,
  type ProcessStrip as Strip,
} from "@/lib/process-day";

/** Week-1 scoreboard. After repeats the four required chips. Bonus Look/Set stay on Truck. */
export function ProcessDayStrip({ bonus = false }: { bonus?: boolean }) {
  const date = localDateKey();
  const stored = useDayBook((s) => s.days[date]);
  const day = stored ?? blankDay(date);
  const patchToday = useDayBook((s) => s.patchToday);
  const saved = restoreProcess(day.process);
  const strip = processStrip(day);

  function toggle(id: keyof Strip) {
    if (!PROCESS_MANUAL.has(id)) return;
    patchToday({
      process: serializeProcess({ ...saved, [id]: !saved[id as "leftOnTime" | "aarWritten"] }),
    });
  }

  return (
    <section className="mt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">Process day</p>
      <p className="mt-0.5 text-xs leading-snug text-muted">
        Week-1 grade. Not appointments. Left on time and AAR you tap. Working loop and Tomorrow snap when you pick them.
        {bonus ? " Look and Set are bonus — they do not fail the day." : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {PROCESS_REQUIRED.map((c) => (
          <Chip
            key={c.id}
            selected={strip[c.id]}
            onClick={PROCESS_MANUAL.has(c.id) ? () => toggle(c.id) : undefined}
          >
            {c.label}
          </Chip>
        ))}
        {bonus
          ? PROCESS_BONUS.map((c) => (
              <Chip key={c.id} selected={strip[c.id]}>
                {c.label}
              </Chip>
            ))
          : null}
      </div>
    </section>
  );
}
