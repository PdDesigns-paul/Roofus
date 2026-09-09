import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { GableMark } from "@/components/gable-mark";
import { RoofusMark } from "@/components/roofus-mark";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  codeSplitGroupings: [],
  component: Home,
});

const PILLARS = [
  {
    to: "/coach" as const,
    kicker: "In the truck",
    title: "Roofus",
    body: "Ride-along coach. Pin a hat and tell him what just happened. He hands you the next line. Customer never sees this.",
  },
  {
    to: "/coach/inspect" as const,
    kicker: "On the roof",
    title: "Inspect",
    body: "The walk, then one shot and a question. What’s this called. Hail or lichen. Coach only — CompanyCam is the report.",
  },
  {
    to: "/house" as const,
    kicker: "Before the door",
    title: "This House",
    body: "Look up the pin. Year built and public facts if they exist. Then ask Roofus. No tape.",
  },
  {
    to: "/coach/mindset" as const,
    kicker: "How you stand",
    title: "Mindset",
    body: "The map, not the script. Door, after photos, three honest options, honesty first.",
  },
  {
    to: "/coach/reference" as const,
    kicker: "The library",
    title: "Reference",
    body: "All 145 InterNACHI Mastering Roof Inspections articles. Search, open a chapter.",
  },
];

function Home() {
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-16 pt-4">
      <RoofusMark />
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted">
          <GableMark className="size-4" />
          Roofus
        </div>
        <div className="flex items-center">
          <ThemeToggle />
          <Link
            to="/settings"
            className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Presets"
          >
            <Settings className="size-5" />
          </Link>
        </div>
      </header>

      <h1 className="mt-10 font-display text-4xl leading-tight tracking-tight">Porch Dawg.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Coach in the truck. Walk on the roof. Look up the house before you knock.
      </p>

      <nav className="mt-8 flex flex-col gap-3">
        {PILLARS.map((p) => (
          <Link
            key={p.title}
            to={p.to}
            className="rounded-2xl border border-border bg-surface px-5 py-4 hover:bg-surface-2"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-faint">{p.kicker}</p>
            <h2 className="mt-1 font-display text-2xl tracking-tight">{p.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
          </Link>
        ))}
      </nav>
    </main>
  );
}
