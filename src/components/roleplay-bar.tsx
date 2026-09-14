import {
  ROLEPLAY_CLAIM_STAGES,
  ROLEPLAY_SCENES,
  ROLEPLAY_WHO,
  claimUnlocked,
  type RoleplayPersonId,
  type RoleplaySceneId,
} from "@/lib/coach-modes";
import { readFreshKept } from "@/lib/kept-storm";
import { useWeather } from "@/lib/weather-store";

export function RoleplayBar({
  beat,
  person,
  year,
  onBeat,
  onPerson,
  onYear,
  onKnock,
}: {
  beat: RoleplaySceneId;
  person: RoleplayPersonId;
  year: string;
  onBeat: (id: RoleplaySceneId) => void;
  onPerson: (id: RoleplayPersonId) => void;
  onYear: (year: string) => void;
  onKnock: () => void;
}) {
  const keptOn = claimUnlocked(readFreshKept(useWeather((s) => s.keptStorms)));
  const whoChips = beat === "claim" ? ROLEPLAY_CLAIM_STAGES : ROLEPLAY_WHO;
  return (
    <div className="mb-2 flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {ROLEPLAY_SCENES.map((s) => {
          const locked = s.id === "claim" && !keptOn;
          return (
            <button
              key={s.id}
              type="button"
              disabled={locked}
              title={locked ? "Keep a storm first." : s.hint}
              onClick={() => onBeat(s.id)}
              className={
                s.id === beat
                  ? "min-h-11 rounded-full bg-fg px-3 text-sm text-paper"
                  : locked
                    ? "min-h-11 rounded-full border border-border bg-surface px-3 text-sm text-faint opacity-50"
                    : "min-h-11 rounded-full border border-border bg-surface px-3 text-sm"
              }
            >
              {s.label}
            </button>
          );
        })}
      </div>
      {!keptOn ? <p className="text-xs text-faint">Keep a storm first.</p> : null}
      <div className="flex flex-wrap gap-1.5">
        {whoChips.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onPerson(w.id)}
            className={
              w.id === person
                ? "min-h-11 rounded-full bg-fg px-3 text-sm text-paper"
                : "min-h-11 rounded-full border border-border bg-surface px-3 text-sm"
            }
          >
            {w.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Roof year</span>
          <input
            className="h-12 w-full rounded-full border border-border bg-surface px-4 text-base"
            inputMode="numeric"
            placeholder="Roof year"
            value={year}
            onChange={(e) => onYear(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={onKnock}
          className="h-12 shrink-0 rounded-full bg-accent px-5 text-sm text-paper"
        >
          Knock
        </button>
      </div>
    </div>
  );
}
