import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCTS, type ProductId } from "@/lib/roofing";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/settings")({
  codeSplitGroupings: [],
  component: SettingsPage,
});

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-faint">{label}</span>
      <Input
        type="number"
        inputMode="decimal"
        value={Number.isFinite(value) ? Number(Number(value.toFixed(4))) : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 text-sm"
      />
    </label>
  );
}

function SettingsPage() {
  const s = useSettings();
  const b = s.book;

  function setSell(id: ProductId, n: number) {
    s.patchBook({
      sellPerSq: { ...b.sellPerSq, [id]: n },
      install: {
        ...b.install,
        [id]: { low: n, standard: n, steep: n },
      },
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-20 pt-4">
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
        Duration is $550 a square, tear-off included. The customer never sees the unit rate —
        only a range.
      </p>

      <section className="mt-8 flex flex-col gap-4">
        <Label htmlFor="company">Name on the reveal</Label>
        <Input
          id="company"
          value={s.companyName}
          onChange={(e) => s.setCompanyName(e.target.value)}
          placeholder="RoofUs"
        />
        <Label htmlFor="ir">Instant Roofer key</Label>
        <Input
          id="ir"
          value={s.instantRooferKey}
          onChange={(e) => s.setInstantRooferKey(e.target.value)}
          placeholder="Paul's Default Option"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs leading-relaxed text-faint">
          This is the tape. $3 a house. Leave blank for Paul’s Default Option. Same pin is
          free for six months.
        </p>
        <Label htmlFor="key">Google Maps key</Label>
        <Input
          id="key"
          value={s.googleMapsKey}
          onChange={(e) => s.setGoogleMapsKey(e.target.value)}
          placeholder="Paul's Default Option"
          autoComplete="off"
        />
        <p className="text-xs leading-relaxed text-faint">
          Leave blank for Paul’s Default Option. Makes typed addresses sharper. Instant Roofer
          does not need this.
        </p>
        <Label htmlFor="warranty">Warranty line</Label>
        <Input
          id="warranty"
          value={s.warrantyLine}
          onChange={(e) => s.setWarrantyLine(e.target.value)}
        />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg">Sell $ / square</h2>
        <p className="mt-1 text-xs text-faint">Complete job. Tear-off included.</p>
        <div className="mt-4 flex flex-col gap-3">
          {PRODUCTS.map((p) => (
            <Num
              key={p.id}
              label={p.name}
              value={b.sellPerSq[p.id]}
              onChange={(n) => setSell(p.id, n)}
            />
          ))}
        </div>
      </section>

      <section className="mt-10 grid grid-cols-2 gap-2">
        <Num
          label="Market multiplier"
          value={b.marketMultiplier}
          onChange={(n) => s.patchBook({ marketMultiplier: n })}
        />
        <Num
          label="Plywood $ / sheet"
          value={b.plywoodUsd}
          onChange={(n) => s.patchBook({ plywoodUsd: n })}
        />
      </section>
    </main>
  );
}