import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/settings")({
  codeSplitGroupings: [],
  component: SettingsPage,
});

function SettingsPage() {
  const s = useSettings();

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-20 pt-4">
      <header className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2"
          aria-label="Home"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-xl">Presets & Settings</h1>
        <ThemeToggle />
      </header>

      <p className="mt-6 text-sm leading-relaxed text-muted">
        Maps makes typed addresses sharper. Leave a field blank for Paul’s Default Option.
      </p>

      <section className="mt-8 flex flex-col gap-4">
        <Label htmlFor="company">Company name</Label>
        <Input
          id="company"
          value={s.companyName}
          onChange={(e) => s.setCompanyName(e.target.value)}
          placeholder="Roofus"
        />
        <Label htmlFor="key">Google Maps key</Label>
        <Input
          id="key"
          value={s.googleMapsKey}
          onChange={(e) => s.setGoogleMapsKey(e.target.value)}
          placeholder="Paul's Default Option"
          autoComplete="off"
        />
        <p className="text-xs leading-relaxed text-faint">
          Optional. Leave blank for Paul’s Default Option.
        </p>
        <Label htmlFor="warranty">Warranty line</Label>
        <Input
          id="warranty"
          value={s.warrantyLine}
          onChange={(e) => s.setWarrantyLine(e.target.value)}
        />
      </section>
    </main>
  );
}
