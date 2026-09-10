import { Link } from "@tanstack/react-router";
import { EllipsisVertical } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tip } from "@/components/ui/tooltip";

const LINKS = [
  { to: "/coach/cards", label: "Cards", hint: "Door, pushback, i35, set, compass." },
  { to: "/coach/reference", label: "Reference", hint: "145 roof articles" },
  { to: "/streets", label: "Streets", hint: "Town · zip by county. Where you knock." },
  { to: "/settings", label: "Presets", hint: "Counties, zips, hours, warranty, mindset, backup" },
] as const;

export function MoreMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tip label="Cards, Reference, Streets, Presets">
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
        <h2 className="mt-3 font-display text-2xl">More</h2>
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
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted">Light / dark</span>
          <ThemeToggle />
        </div>
      </Sheet>
    </>
  );
}
