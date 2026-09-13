import { Link } from "@tanstack/react-router";
import { EllipsisVertical } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tip } from "@/components/ui/tooltip";

const LINKS = [
  { to: "/coach/reference", label: "Reference", hint: "Roof articles. Their company pages." },
  { to: "/settings", label: "Settings", hint: "You, territory, hours, mindset, backup" },
] as const;

export function MoreMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tip label="Reference, Settings">
        <button
          type="button"
          aria-label="More"
          className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          onClick={() => setOpen(true)}
        >
          <EllipsisVertical className="size-5" />
        </button>
      </Tip>
      <Sheet open={open} onClose={() => setOpen(false)} z={60}>
        <div className="mt-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl">More</h2>
          <ThemeToggle />
        </div>
        <ul className="mt-4 flex flex-col">
          {LINKS.map((l) => (
            <li key={l.to} className="border-b border-border last:border-0">
              <Link
                to={l.to}
                onClick={() => setOpen(false)}
                className="flex min-h-14 flex-col justify-center py-3"
              >
                <span className="text-sm text-fg">{l.label}</span>
                <span className="text-xs text-faint">{l.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
