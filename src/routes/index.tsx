import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CalendarDays, Camera, MapPin } from "lucide-react";
import { InstallHint } from "@/components/install-hint";
import { RoofusFace } from "@/components/roofus-mark";
import { SetupChecklist } from "@/components/setup-checklist";
import { blankDay, localDateKey, useDayBook } from "@/lib/day-book";
import { loadDemo } from "@/lib/demo-data";
import { useSettings } from "@/lib/settings-store";
import { setupSnap } from "@/lib/setup-progress";
import { useStreets } from "@/lib/streets-store";
import { useSurvive } from "@/lib/survive-store";
import { useWeather } from "@/lib/weather-store";
import { openSetup } from "@/lib/open-coach";

export const Route = createFileRoute("/")({
  codeSplitGroupings: [],
  component: LandingPage,
});

const DOORS = [
  { to: "/today", label: "Today", hint: "Four counts. After Action Report.", icon: CalendarDays },
  { to: "/coach/inspect", label: "Inspect", hint: "Walk the house. Then the shot.", icon: Camera },
  { to: "/streets", label: "Streets", hint: "Town · zip. Grouped by county.", icon: MapPin },
] as const;

function LandingPage() {
  const profile = useDayBook((s) => s.profile);
  const date = localDateKey();
  const storedDay = useDayBook((s) => s.days[date]);
  const day = storedDay ?? blankDay(date);
  const companyName = useSettings((s) => s.companyName);
  const setCompanyName = useSettings((s) => s.setCompanyName);
  const warrantyLine = useSettings((s) => s.warrantyLine);
  const zipCount = useStreets((s) => s.loops.length);
  const survive = useSurvive();
  const fetchedAt = useWeather((s) => s.fetchedAt);
  const goBy = profile.goBy.trim();
  const navigate = useNavigate();
  const emptyPhone = !profile.counties.trim() && zipCount === 0;

  useEffect(() => {
    const leftover = profile.company.trim();
    if (leftover && (!companyName.trim() || companyName === "Roofus")) {
      setCompanyName(leftover);
    }
  }, [profile.company, companyName, setCompanyName]);

  const snap = setupSnap({
    goBy: profile.goBy,
    profileCompany: profile.company,
    settingsCompany: companyName,
    counties: profile.counties,
    states: profile.states,
    knockWindow: profile.knockWindow,
    paperWindow: profile.paperWindow,
    hardStop: profile.hardStop,
    warranty: warrantyLine,
    zipCount,
    survive,
  });

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <div className="mt-2 flex items-center gap-3">
        <RoofusFace className="size-16" />
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-tight tracking-tight">
            {goBy ? `Hey ${goBy}` : "Roofus"}
          </h1>
          <p className="text-sm text-muted">Ride-along for the porch.</p>
        </div>
      </div>

      <SetupChecklist
        snap={snap}
        afterAction={day.afterAction}
        stormFetchedOn={fetchedAt.slice(0, 10)}
        stackMonth={survive.stackMonth}
      />

      <div className="mt-5 flex flex-col gap-2">
        <Link
          to="/today"
          className="flex h-12 items-center justify-center rounded-full bg-fg text-sm text-paper"
        >
          {goBy ? `Open ${goBy}'s day` : "Open Today"}
        </Link>
        <button
          type="button"
          className="flex h-12 items-center justify-center rounded-full border border-border text-sm"
          onClick={() => openSetup()}
        >
          Tell Roofus
        </button>
        {emptyPhone ? (
          <button
            type="button"
            className="flex h-12 items-center justify-center rounded-full border border-border text-sm text-muted"
            onClick={() => {
              loadDemo();
              void navigate({ to: "/today" });
            }}
          >
            Load a sample day
          </button>
        ) : null}
      </div>

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
