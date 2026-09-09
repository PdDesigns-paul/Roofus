import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { GableMark } from "@/components/gable-mark";
import { HelpButton } from "@/components/help-button";
import { RoofusHero } from "@/components/roofus-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tip } from "@/components/ui/tooltip";

export const Route = createFileRoute("/")({
  codeSplitGroupings: [],
  component: Home,
});

function Home() {
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-24 pt-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted">
          <GableMark className="size-4" />
          Roofus
        </div>
        <div className="flex items-center">
          <HelpButton page="home" />
          <ThemeToggle />
          <Tip label="Company name and warranty">
            <Link
              to="/settings"
              className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Presets"
            >
              <Settings className="size-5" />
            </Link>
          </Tip>
        </div>
      </header>

      <RoofusHero />

      <nav className="mt-2 grid grid-cols-2 gap-2">
        <Link
          to="/coach"
          className="col-span-2 flex min-h-36 flex-col justify-end rounded-3xl border border-border bg-fg px-5 py-5 text-paper"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-paper/55">In the truck</p>
          <h2 className="mt-1 font-display text-4xl tracking-tight">Roofus</h2>
          <p className="mt-2 max-w-[22rem] text-sm leading-relaxed text-paper/70">
            Pin a hat. Tell him what just happened. He hands you the next line.
          </p>
        </Link>

        <Link
          to="/coach/mindset"
          className="flex min-h-[5.5rem] flex-col justify-end rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-2"
        >
          <p className="text-[11px] uppercase tracking-wide text-faint">Stand</p>
          <h2 className="font-display text-xl tracking-tight">Mindset</h2>
        </Link>

        <Link
          to="/coach/inspect"
          className="flex min-h-[5.5rem] flex-col justify-end rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-2"
        >
          <p className="text-[11px] uppercase tracking-wide text-faint">Roof</p>
          <h2 className="font-display text-xl tracking-tight">Inspect</h2>
        </Link>

        <Link
          to="/coach/reference"
          className="col-span-2 flex min-h-12 items-center justify-between rounded-xl border border-border bg-transparent px-4 py-2.5 hover:bg-surface-2"
        >
          <span className="text-sm text-muted">Reference</span>
          <span className="text-[11px] uppercase tracking-wide text-faint">145 articles</span>
        </Link>
      </nav>
    </main>
  );
}
