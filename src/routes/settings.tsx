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
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-tab pt-4">
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

      <p className="mt-6 text-sm leading-relaxed text-muted">
        Counties, hours, company name, warranty. Backup is optional. Recommended if this phone is the
        only copy of your days.
      </p>

      <section className="mt-8 flex flex-col gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">You</p>
        <Label htmlFor="goBy">First name</Label>
        <Input
          id="goBy"
          value={profile.goBy}
          onChange={(e) => patchProfile({ goBy: e.target.value })}
          placeholder="What Roofus should call you"
        />
        <Label htmlFor="company">Company name</Label>
        <Input
          id="company"
          value={s.companyName}
          onChange={(e) => s.setCompanyName(e.target.value)}
          placeholder="Roofus"
        />
        <Label htmlFor="warranty">Warranty line</Label>
        <Input
          id="warranty"
          value={s.warrantyLine}
          onChange={(e) => s.setWarrantyLine(e.target.value)}
        />
      </section>

      <section className="mt-10 flex flex-col gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Counties</p>
        <Label htmlFor="counties">Which counties?</Label>
        <Input
          id="counties"
          value={profile.counties}
          onChange={(e) => patchProfile({ counties: e.target.value })}
          placeholder="Where you actually knock"
        />
        <Label htmlFor="states">Which state?</Label>
        <Input
          id="states"
          value={profile.states}
          onChange={(e) => patchProfile({ states: e.target.value })}
          placeholder="PA, Ohio, whatever you cover"
        />
        <p className="text-xs leading-relaxed text-faint">
          Streets builds zips from these counties. Rebuild Streets if you change them.
        </p>
      </section>

      <section className="mt-10 flex flex-col gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Hours</p>
        <Label htmlFor="knockWindow">When do you knock?</Label>
        <Input
          id="knockWindow"
          value={profile.knockWindow}
          onChange={(e) => patchProfile({ knockWindow: e.target.value })}
          placeholder="After work, 3–4 hours"
        />
        <Label htmlFor="paperWindow">Morning work</Label>
        <Input
          id="paperWindow"
          value={profile.paperWindow}
          onChange={(e) => patchProfile({ paperWindow: e.target.value })}
          placeholder="Calls and paperwork — not porches"
        />
        <Label htmlFor="hardStop">When do you stop?</Label>
        <Input
          id="hardStop"
          value={profile.hardStop}
          onChange={(e) => patchProfile({ hardStop: e.target.value })}
          placeholder="When it gets dark"
        />
      </section>
      <NotionBackup />
    </main>
  );
}
