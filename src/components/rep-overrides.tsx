import type { Job } from "@/lib/jobs-store";
import { MATERIALS, PITCH_PRESETS, PRODUCTS } from "@/lib/roofing";

export function RepOverrides({
  job,
  onChange,
}: {
  job: Job;
  onChange: (p: Partial<Job>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-faint">Product</span>
        <select
          className="h-11 rounded-xl border border-border bg-surface px-3 text-fg"
          value={job.product}
          onChange={(e) => onChange({ product: e.target.value as Job["product"] })}
        >
          {PRODUCTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-faint">Slope</span>
        <select
          className="h-11 rounded-xl border border-border bg-surface px-3 text-fg"
          value={job.pitchOverride ?? job.analysis?.pitchPreset ?? "6"}
          onChange={(e) => onChange({ pitchOverride: e.target.value as Job["pitchOverride"] })}
        >
          {PITCH_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.ratio} · {p.customer}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-faint">Coming off</span>
        <select
          className="h-11 rounded-xl border border-border bg-surface px-3 text-fg"
          value={job.materialOverride ?? job.analysis?.material ?? "architectural"}
          onChange={(e) =>
            onChange({ materialOverride: e.target.value as Job["materialOverride"] })
          }
        >
          {MATERIALS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-faint">Stories</span>
        <select
          className="h-11 rounded-xl border border-border bg-surface px-3 text-fg"
          value={job.storiesOverride ?? job.analysis?.stories ?? 1}
          onChange={(e) =>
            onChange({ storiesOverride: Number(e.target.value) as 1 | 2 | 3 })
          }
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </label>
    </div>
  );
}