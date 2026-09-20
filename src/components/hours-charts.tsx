import {
  compactElapsed,
  isCountKey,
  stampsByHour,
  type CountKey,
  type DayStamp,
  type HoursSeries,
} from "@/lib/day-book";
import type { ActivityUnit } from "@/lib/tenant";

const W = 320;

function dayTick(date: string, dense: boolean): string {
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  if (!dense) return "SMTWTFS"[d.getDay()] ?? "";
  if (d.getDate() === 1 || d.getDay() === 1) return String(d.getDate());
  return "";
}

function barX(i: number, n: number, inset = 0) {
  const inner = W - inset * 2;
  const gap = n > 10 ? 1 : 3;
  const w = (inner - gap * (n - 1)) / n;
  return { x: inset + i * (w + gap), w };
}

export function HoursClockChart({ series }: { series: HoursSeries }) {
  const points = series.points;
  const n = points.length;
  const dense = n > 7;
  const clocked = points.filter((p) => p.minutes != null);
  if (!clocked.length) return null;
  const max = Math.max(60, ...clocked.map((p) => p.minutes ?? 0));
  const H = 96;
  const top = 16;
  const bottom = 18;
  const innerH = H - top - bottom;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full text-fg" role="img" aria-label="Hours by day">
      {points.map((p, i) => {
        const { x, w } = barX(i, n);
        const tick = dayTick(p.date, dense);
        if (p.minutes == null) {
          return (
            <g key={p.date}>
              <rect x={x + w / 2 - 0.5} y={top + innerH - 2} width={1} height={2} className="fill-border" />
              {tick ? (
                <text x={x + w / 2} y={H - 4} textAnchor="middle" className="fill-faint" fontSize="9">
                  {tick}
                </text>
              ) : null}
            </g>
          );
        }
        const h = p.minutes <= 0 ? 2 : Math.max(3, (p.minutes / max) * innerH);
        const y = top + innerH - h;
        return (
          <g key={p.date}>
            <rect x={x} y={y} width={w} height={h} rx={1.5} className="fill-fg" />
            {!dense ? (
              <text
                x={x + w / 2}
                y={y - 3}
                textAnchor="middle"
                className="fill-fg font-display"
                fontSize="9"
              >
                {compactElapsed(p.minutes)}
              </text>
            ) : null}
            {tick ? (
              <text x={x + w / 2} y={H - 4} textAnchor="middle" className="fill-faint" fontSize="9">
                {tick}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function HoursCountRows({
  series,
  units,
}: {
  series: HoursSeries;
  units: readonly ActivityUnit[];
}) {
  const rows = units.filter((u): u is ActivityUnit & { key: CountKey } => isCountKey(u.key) && series.counts[u.key] > 0);
  if (!rows.length) {
    return null;
  }
  const max = Math.max(1, ...series.points.flatMap((p) => rows.map((u) => p.counts[u.key])));
  const n = series.points.length;
  const dense = n > 7;
  const H = dense ? 28 : 40;
  const top = dense ? 2 : 14;
  const barH = dense ? 18 : 16;
  return (
    <ul className="mt-5 flex flex-col gap-3">
      {rows.map((unit) => (
        <li key={unit.key}>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[11px] uppercase tracking-wide text-faint">{unit.label}</p>
            <p className="font-display text-sm tabular-nums leading-none">{series.counts[unit.key]}</p>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mt-1 w-full text-fg"
            role="img"
            aria-label={`${unit.label} by day`}
          >
            {series.points.map((p, i) => {
              const { x, w } = barX(i, n);
              const count = p.counts[unit.key];
              if (count <= 0) {
                return (
                  <rect
                    key={p.date}
                    x={x + w / 2 - 0.5}
                    y={top + barH - 1}
                    width={1}
                    height={1}
                    className="fill-border"
                  />
                );
              }
              const h = Math.max(3, (count / max) * barH);
              const y = top + barH - h;
              return (
                <g key={p.date}>
                  <rect x={x} y={y} width={w} height={h} rx={1} className="fill-fg" />
                  {!dense ? (
                    <text
                      x={x + w / 2}
                      y={y - 2}
                      textAnchor="middle"
                      className="fill-fg font-display"
                      fontSize="9"
                    >
                      {count}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </li>
      ))}
    </ul>
  );
}

export function HoursStampStrip({
  stamps,
  unit,
  label,
}: {
  stamps: DayStamp[];
  unit: string;
  label: string;
}) {
  const hours = stampsByHour(stamps, unit);
  if (!hours.some((n) => n > 0)) return null;
  const max = Math.max(1, ...hours);
  const H = 48;
  const top = 14;
  const barH = 20;
  const marks = [6, 12, 18];
  return (
    <div className="mt-5">
      <p className="text-[11px] uppercase tracking-wide text-faint">{label} by hour</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 w-full text-fg" role="img" aria-label={`${label} by hour`}>
        {hours.map((count, hour) => {
          const { x, w } = barX(hour, 24);
          if (count <= 0) {
            return (
              <rect
                key={hour}
                x={x + w / 2 - 0.5}
                y={top + barH - 1}
                width={1}
                height={1}
                className="fill-border"
              />
            );
          }
          const h = Math.max(3, (count / max) * barH);
          const y = top + barH - h;
          return (
            <g key={hour}>
              <rect x={x} y={y} width={w} height={h} rx={1} className="fill-fg" />
              {count > 0 ? (
                <text
                  x={x + w / 2}
                  y={y - 2}
                  textAnchor="middle"
                  className="fill-fg font-display"
                  fontSize="8"
                >
                  {count}
                </text>
              ) : null}
            </g>
          );
        })}
        {marks.map((hour) => {
          const { x, w } = barX(hour, 24);
          return (
            <text key={hour} x={x + w / 2} y={H - 2} textAnchor="middle" className="fill-faint" fontSize="9">
              {hour === 12 ? "12" : String(hour)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
