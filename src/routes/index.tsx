import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Camera, Map } from "lucide-react";
import { InstallHint } from "@/components/install-hint";
import { RoofusFace } from "@/components/roofus-mark";
import { useDayBook } from "@/lib/day-book";

export const Route = createFileRoute("/")({
  codeSplitGroupings: [],
  component: LandingPage,
});

const DOORS = [
  { to: "/today", label: "Today", hint: "Four counts. After Action Report.", icon: CalendarDays },
  { to: "/streets", label: "Streets", hint: "Zips by county. Age first.", icon: Map },
  { to: "/coach/inspect", label: "Inspect", hint: "Camera walk. Then ask.", icon: Camera },
] as const;

function LandingPage() {
  const setupDone = useDayBook((s) => s.profile.setupDone);
  const goBy = useDayBook((s) => s.profile.goBy).trim();
  const openLabel = setupDone ? (goBy ? `Open ${goBy}'s day` : "Open Today") : "Start the day";

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <div className="mt-2 flex items-center gap-3">
        <RoofusFace className="size-16" />
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-tight tracking-tight">Roofus</h1>
          <p className="text-sm text-muted">Ride-along for the porch.</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Journal and coach for door-to-door roofers. Age first. Storms only if you Keep them. One
        appointment is a winning day.
      </p>

      <Link
        to="/today"
        className="mt-5 flex h-12 items-center justify-center rounded-full bg-fg text-sm text-paper"
      >
        {openLabel}
      </Link>

      <ul className="mt-4 flex flex-col">
        {DOORS.map((d) => {
          const Icon = d.icon;
          return (
            <li key={d.to} className="border-b border-border last:border-0">
              <Link to={d.to} className="flex min-h-14 items-center gap-3 py-3">
                <Icon className="size-5 shrink-0 text-muted" strokeWidth={1.8} />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm text-fg">{d.label}</span>
                  <span className="text-xs text-faint">{d.hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-faint">
        Stays on this phone. No login. Backup is optional in Presets.
      </p>

      <InstallHint />
    </main>
  );
}
