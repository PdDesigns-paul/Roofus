import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDayBook } from "@/lib/day-book";

export const Route = createFileRoute("/settings/territory")({
  codeSplitGroupings: [],
  component: TerritoryPage,
});

function TerritoryPage() {
  const profile = useDayBook((st) => st.profile);
  const patchProfile = useDayBook((st) => st.patchProfile);

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Territory" />

      <div className="mt-5 flex flex-col gap-3">
        <div className="min-w-0">
          <Label htmlFor="counties">Which counties?</Label>
          <Input
            id="counties"
            className="mt-1"
            value={profile.counties}
            onChange={(e) => patchProfile({ counties: e.target.value })}
            placeholder="Where you actually knock"
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="states">Which state?</Label>
          <Input
            id="states"
            className="mt-1"
            value={profile.states}
            onChange={(e) => patchProfile({ states: e.target.value })}
            placeholder="PA, Ohio, whatever you cover"
          />
        </div>
        <p className="text-xs leading-snug text-faint">
          Streets builds park-once loops from these counties. Rebuild on Prep if you change them.
        </p>
        <Link to="/after" className="flex min-h-14 flex-col justify-center border-b border-border py-3">
          <span className="text-sm text-fg">Prep</span>
          <span className="text-xs text-faint">Age-band loops. Rebuild after you change counties.</span>
        </Link>
      </div>
    </main>
  );
}
