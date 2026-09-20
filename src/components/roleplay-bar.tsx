import { claimUnlocked, isClaimScene, PRACTICE_PLAN_COPY, practiceUnlocked, type RoleplayPersonId, type RoleplaySceneId } from "@/lib/coach-modes";
import { readFreshKept } from "@/lib/kept-storm";
import { useSettings } from "@/lib/settings-store";
import { currentPack } from "@/lib/tenant";
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
  const pack = currentPack();
  const keptOn = claimUnlocked(readFreshKept(useWeather((s) => s.keptStorms)));
  const practiceOn = practiceUnlocked(useSettings((s) => s.practiceOn));
  const scenes = pack.modules.claim ? pack.scenes : pack.scenes.filter((s) => !s.claim);
  const whoChips = isClaimScene(beat) ? pack.claimStages : pack.who;
  return (
    <div className="mb-2 flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {scenes.map((s) => {
          const locked = Boolean(s.claim && pack.modules.claim && !keptOn);
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
      {pack.modules.claim && !keptOn ? <p className="text-xs text-faint">Keep a storm first.</p> : null}
      {!practiceOn ? <p className="text-xs text-faint">{PRACTICE_PLAN_COPY}</p> : null}
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
          disabled={!practiceOn}
          title={!practiceOn ? PRACTICE_PLAN_COPY : undefined}
          className={
            practiceOn
              ? "h-12 shrink-0 rounded-full bg-accent px-5 text-sm text-paper"
              : "h-12 shrink-0 rounded-full border border-border bg-surface px-5 text-sm text-faint opacity-50"
          }
        >
          Knock
        </button>
      </div>
    </div>
  );
}
