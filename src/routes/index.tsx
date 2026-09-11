import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HelpButton } from "@/components/help-button";
import { HomeSetupCard } from "@/components/home-setup-card";
import { InstallHint } from "@/components/install-hint";
import { MoreMenu } from "@/components/more-menu";
import { RoofusFace } from "@/components/roofus-mark";
import { Button } from "@/components/ui/button";
import { blankDay, localDateKey, useDayBook } from "@/lib/day-book";
import { loadDemo } from "@/lib/demo-data";
import { openSetup } from "@/lib/open-coach";
import { useSettings } from "@/lib/settings-store";
import { setupSnap } from "@/lib/setup-progress";
import { useStreets } from "@/lib/streets-store";
import { useSurvive } from "@/lib/survive-store";
import { useWeather } from "@/lib/weather-store";

export const Route = createFileRoute("/")({
  codeSplitGroupings: [],
  component: LandingPage,
});

function LandingPage() {
  const profile = useDayBook((s) => s.profile);
  const date = localDateKey();
  const storedDay = useDayBook((s) => s.days[date]);
  const day = storedDay ?? blankDay(date);
  const warrantyLine = useSettings((s) => s.warrantyLine);
  const zipCount = useStreets((s) => s.loops.length);
  const survive = useSurvive();
  const fetchedAt = useWeather((s) => s.fetchedAt);
  const goBy = profile.goBy.trim();
  const navigate = useNavigate();
  const emptyPhone = !profile.counties.trim() && zipCount === 0;

  const snap = setupSnap({
    goBy: profile.goBy,
    profileCompany: profile.company,
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
      <div className="flex items-center gap-1">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <RoofusFace className="size-16" />
          <div className="min-w-0">
            <h1 className="font-display text-3xl leading-tight tracking-tight">
              {goBy ? `Hey ${goBy}` : "Roofus"}
            </h1>
            <p className="text-sm text-muted">Ride-along for the porch.</p>
          </div>
        </div>
        <HelpButton page="home" />
        <MoreMenu />
      </div>

      <HomeSetupCard
        snap={snap}
        afterAction={day.afterAction}
        stormFetchedOn={fetchedAt.slice(0, 10)}
        stackMonth={survive.stackMonth}
      />

      <div className="mt-5 flex flex-col gap-2">
        <Button asChild size="lg" className="w-full">
          <Link to="/today">{goBy ? `Open ${goBy}'s day` : "Open Today"}</Link>
        </Button>
        <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => openSetup()}>
          Tell Roofus
        </Button>
        {emptyPhone ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              loadDemo();
              void navigate({ to: "/today" });
            }}
          >
            Load a sample day
          </Button>
        ) : null}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-faint">
        Stays on this phone. No login. Backup is optional in Presets.
      </p>

      <InstallHint />
    </main>
  );
}
