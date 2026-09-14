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
}: {
  id: string;
  when: string;
  title: string;
  formula: string;
  open: boolean;
  onToggle: (id: string) => void;
  children?: ReactNode;
  anchor?: string;
}) {
  return (
    <li id={anchor} className="rounded-2xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full px-4 py-3 text-left"
        aria-expanded={open}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-faint">{when}</p>
        <p className="mt-1 font-display text-xl tracking-tight">{title}</p>
        <p className="mt-1 text-sm leading-relaxed">{formula}</p>
      </button>
      {open && children ? <div className="border-t border-border px-4 pb-4 pt-3">{children}</div> : null}
    </li>
  );
}
