import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Download, MapPin, Search, Settings } from "lucide-react";
import { useState } from "react";
import { GableMark } from "@/components/gable-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportHousesCsv, useHouses } from "@/lib/houses-store";
import { tapeIsFresh } from "@/lib/memory";
import { geocodeAddress, reverseGeocode } from "@/lib/takeoff";
import { newJobId, useJobs, type Job } from "@/lib/jobs-store";
import { useSettings } from "@/lib/settings-store";
import { formatMoney, formatRange } from "@/lib/utils";

export const Route = createFileRoute("/tape")({
  codeSplitGroupings: [],
  component: Home,
});

const DEMOS = [
  {
    label: "23 Coventry Dr, Carlisle, PA 17015",
    query: "23 Coventry Dr, Carlisle, PA 17015",
    lat: 40.17403,
    lng: -77.155,
  },
  {
    label: "SF Victorian",
    query: "2637 Union St, San Francisco, CA",
    lat: 37.7976,
    lng: -122.4348,
  },
  {
    label: "Dallas ranch",
    query: "3601 Turtle Creek Blvd, Dallas, TX",
    lat: 32.8234,
    lng: -96.8072,
  },
];

function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<"gps" | "addr" | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const jobs = useJobs();
  const hydrated = useJobs((s) => s.hydrated);
  const settingsReady = useSettings((s) => s.hydrated);
  const ready = hydrated && settingsReady;
  const googleMapsKey = useSettings((s) => s.googleMapsKey);
  const houseMap = useHouses((s) => s.houses);
  const houses = Object.values(houseMap).sort((a, b) => b.lastAt - a.lastAt);

  async function startAt(lat: number, lng: number, address: string) {
    const id = newJobId();
    const job: Job = {
      id,
      createdAt: Date.now(),
      status: "running",
      address,
      lat,
      lng,
      aerial: null,
      outline: null,
      analysis: null,
      solar: null,
      instant: null,
      solarSkip: null,
      product: "duration",
      pitchOverride: null,
      materialOverride: null,
      storiesOverride: null,
      layers: 1,
      quote: null,
      error: null,
      steps: ["Locating the house"],
    };
    jobs.upsert(job);
    await navigate({ to: "/job/$jobId", params: { jobId: id } });
  }

  async function onThisHouse() {
    setError(null);
    setBusy("gps");
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Location is off on this phone"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,
        });
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const rev = await reverseGeocode({
        data: { lat, lng, googleKey: googleMapsKey || undefined },
      });
      const address =
        rev && rev.ok ? rev.address : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      await startAt(lat, lng, address);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read location");
    } finally {
      setBusy(null);
    }
  }

  async function onAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy("addr");
    try {
      const cached = useHouses.getState().geocodeHit(query);
      const hit = cached
        ? cached
        : (await geocodeAddress({
            data: { query, googleKey: googleMapsKey || undefined },
          }).then((r) => {
            if (!r || typeof r.ok !== "boolean") {
              throw new Error("Address lookup did not come back. Retry.");
            }
            if (!r.ok) throw new Error(r.error);
            useHouses.getState().rememberGeocode(query, r.hit);
            return r.hit;
          }));
      await startAt(hit.lat, hit.lng, hit.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No match for that address");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-16 pt-6">
      <header className="flex items-center gap-2 text-sm text-muted">
        <GableMark className="size-5" />
        RoofUs
      </header>
      <h1 className="mt-8 font-display text-4xl leading-tight tracking-tight">This house.</h1>
      <p className="mt-2 text-sm text-muted">
        Tap once. Walk away. Show the range in two minutes.
      </p>

      <Button
        size="xl"
        className="mt-8 w-full"
        disabled={busy !== null || !ready}
        onClick={() => void onThisHouse()}
      >
        <MapPin className="size-5" />
        {busy === "gps" ? "Finding you…" : "This House"}
      </Button>

      <form className="mt-6 flex flex-col gap-2" onSubmit={(e) => void onAddress(e)}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Street, city, ZIP"
          autoComplete="street-address"
          enterKeyHint="go"
        />
        <Button
          type="submit"
          variant="outline"
          size="lg"
          className="w-full"
          disabled={busy !== null || !query.trim() || !ready}
        >
          {busy === "addr" ? "Looking up…" : "Run takeoff"}
        </Button>
      </form>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Demo</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMOS.map((s) => (
            <button
              key={s.query}
              type="button"
              disabled={busy !== null || !ready}
              onClick={() => {
                setQuery(s.query);
                setBusy(s.label);
                void startAt(s.lat, s.lng, s.query).finally(() => setBusy(null));
              }}
              className="min-h-10 rounded-full border border-border bg-surface px-3 py-2 text-left text-sm text-fg hover:bg-surface-2 disabled:opacity-40"
            >
              {busy === s.label ? "Opening…" : s.label}
            </button>
          ))}
        </div>
      </div>

      <nav className="mt-8 grid grid-cols-3 gap-2">
        <Link
          to="/coach"
          className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-border bg-surface p-3 hover:bg-surface-2"
        >
          <span className="text-lg leading-none">🐕</span>
          <span>
            <span className="block text-sm font-medium text-fg">Roofus</span>
            <span className="mt-0.5 block text-xs text-faint">Coach</span>
          </span>
        </Link>
        <Link
          to="/coach/inspect"
          className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-border bg-surface p-3 hover:bg-surface-2"
        >
          <Search className="size-5 text-muted" />
          <span>
            <span className="block text-sm font-medium text-fg">Inspect</span>
            <span className="mt-0.5 block text-xs text-faint">Shoot, then ask</span>
          </span>
        </Link>
        <Link
          to="/settings"
          className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-border bg-surface p-3 hover:bg-surface-2"
        >
          <Settings className="size-5 text-muted" />
          <span>
            <span className="block text-sm font-medium text-fg">Settings</span>
            <span className="mt-0.5 block text-xs text-faint">Presets & keys</span>
          </span>
        </Link>
      </nav>

      {houses.length > 0 ? (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">Follow-up</p>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg"
              onClick={() => {
                const csv = exportHousesCsv(useHouses.getState().list());
                const blob = new Blob([csv], { type: "text/csv" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "roofus-houses.csv";
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              <Download className="size-3.5" />
              Mailer CSV
            </button>
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {houses.slice(0, 20).map((h) => (
              <li key={h.key}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left"
                  onClick={() => void startAt(h.lat, h.lng, h.address)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-fg">
                      {h.address.split(",")[0]}
                    </span>
                    <span className="mt-0.5 block text-xs text-faint">
                      {h.lastTapeAt ? new Date(h.lastTapeAt).toLocaleDateString() : "no tape"}
                      {h.tapes > 1 ? ` · ${h.tapes} tapes` : ""}
                      {h.lastTapeAt && !tapeIsFresh(h.lastTapeAt) ? " · re-tape" : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-muted">
                    {h.rangeLow && h.rangeHigh
                      ? formatRange(h.rangeLow, h.rangeHigh)
                      : h.packageUsd
                        ? formatMoney(h.packageUsd)
                        : "—"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}