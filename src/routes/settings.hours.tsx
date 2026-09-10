import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDayBook } from "@/lib/day-book";

export const Route = createFileRoute("/settings/hours")({
  codeSplitGroupings: [],
  component: HoursPage,
});

function HoursPage() {
  const profile = useDayBook((st) => st.profile);
  const patchProfile = useDayBook((st) => st.patchProfile);

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Hours" />

      <div className="mt-5 flex flex-col gap-3">
        <div className="min-w-0">
          <Label htmlFor="knockWindow">When do you knock?</Label>
          <Input
            id="knockWindow"
            className="mt-1"
            value={profile.knockWindow}
            onChange={(e) => patchProfile({ knockWindow: e.target.value })}
            placeholder="After work, 3–4 hours"
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="paperWindow">Morning work</Label>
          <Input
            id="paperWindow"
            className="mt-1"
            value={profile.paperWindow}
            onChange={(e) => patchProfile({ paperWindow: e.target.value })}
            placeholder="Calls and paperwork — not porches"
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="hardStop">When do you stop?</Label>
          <Input
            id="hardStop"
            className="mt-1"
            value={profile.hardStop}
            onChange={(e) => patchProfile({ hardStop: e.target.value })}
            placeholder="When it gets dark"
          />
        </div>
      </div>
    </main>
  );
}
