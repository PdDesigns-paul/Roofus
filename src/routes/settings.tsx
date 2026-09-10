import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { HelpButton } from "@/components/help-button";
import { NotionBackup } from "@/components/notion-backup";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDayBook } from "@/lib/day-book";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/settings")({
  codeSplitGroupings: [],
  component: SettingsPage,
});

function SettingsPage() {
  const s = useSettings();
  const profile = useDayBook((st) => st.profile);
  const patchProfile = useDayBook((st) => st.patchProfile);

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <header className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2"
          aria-label="Home"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-xl">Presets & Settings</h1>
        <div className="flex items-center">
          <HelpButton page="settings" />
          <ThemeToggle />
        </div>
      </header>

      <p className="mt-3 text-sm leading-snug text-muted">
        Counties, hours, company, warranty. Backup is optional.
      </p>

      <section className="mt-5 flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">You</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <Label htmlFor="goBy">First name</Label>
            <Input
              id="goBy"
              className="mt-1"
              value={profile.goBy}
              onChange={(e) => patchProfile({ goBy: e.target.value })}
              placeholder="What Roofus should call you"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="company">Company name</Label>
            <Input
              id="company"
              className="mt-1"
              value={s.companyName}
              onChange={(e) => s.setCompanyName(e.target.value)}
              placeholder="Roofus"
            />
          </div>
        </div>
        <div className="min-w-0">
          <Label htmlFor="warranty">Warranty line</Label>
          <Input
            id="warranty"
            className="mt-1"
            value={s.warrantyLine}
            onChange={(e) => s.setWarrantyLine(e.target.value)}
          />
        </div>
      </section>

      <section className="mt-5 flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Counties</p>
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
          Streets builds zips from these counties. Rebuild Streets if you change them.
        </p>
      </section>

      <section className="mt-5 flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Hours</p>
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
      </section>
      <NotionBackup />
    </main>
  );
}
