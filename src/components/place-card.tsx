import type { ReactNode } from "react";

/** Door-style collapsible. One open at a time. Do not restyle Door to match this — this is Door. */
export function PlaceCard({
  id,
  when,
  title,
  formula,
  open,
  onToggle,
  children,
  anchor,
  tone,
  clearFab,
}: {
  id: string;
  when: string;
  title: string;
  formula: string;
  open: boolean;
  onToggle: (id: string) => void;
  children?: ReactNode;
  anchor?: string;
  tone?: "porch" | "truck";
  clearFab?: boolean;
}) {
  const truck = tone === "truck";
  return (
    <li id={anchor} className={`rounded-2xl border border-border ${truck ? "bg-surface-2" : "bg-surface"}`}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full px-4 py-3 text-left"
        aria-expanded={open}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{when}</p>
        <p className="mt-1 font-display text-xl tracking-tight">{title}</p>
        <p className={`mt-1 text-sm leading-relaxed ${truck ? "text-muted" : ""}`}>{formula}</p>
      </button>
      {open && children ? (
        <div className={`border-t border-border px-4 pt-3 ${clearFab ? "pb-24" : "pb-4"}`}>{children}</div>
      ) : null}
    </li>
  );
}
