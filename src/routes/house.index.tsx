import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tip } from "@/components/ui/tooltip";
import { geocodeAddress, lookupHouse, reverseGeocode } from "@/lib/house-lookup";
import { newHouseId, useHouses } from "@/lib/houses-store";

export const Route = createFileRoute("/house/")({
  codeSplitGroupings: [],
  component: ThisHouse,
});

const DEMOS = [
  {
    label: "23 Coventry Dr, Carlisle, PA 17015",
    query: "23 Coventry Dr, Carlisle, PA 17015",
    lat: 40.17403,
    lng: -77.155,
  },
];

function ThisHouse() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<"gps" | "addr" | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useHouses((s) => s.hydrated);
  const ready = hydrated;
  const order = useHouses((s) => s.order);
  const housesMap = useHouses((s) => s.houses);
  const houses = order.map((id) => housesMap[id]).filter(Boolean);

  async function openAt(lat: number, lng: number, address: string) {
    const looked = await lookupHouse({
      data: { lat, lng, address },
    });
    if (!looked || !looked.ok) {
      throw new Error(!looked ? "Lookup did not come back." : looked.error);
    }
    const id = newHouseId();
    useHouses.getState().upsert({ id, ...looked.brief });
    await navigate({ to: "/house/$houseId", params: { houseId: id } });
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
        data: { lat, lng },
      });
      const address = rev && rev.ok ? rev.address : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      await openAt(lat, lng, address);
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
        : await geocodeAddress({
            data: { query },
          }).then((r) => {
            if (!r || typeof r.ok !== "boolean") {
              throw new Error("Address lookup did not come back. Retry.");
            }
            if (!r.ok) throw new Error(r.error);
            useHouses.getState().rememberGeocode(query, r.hit);
            return r.hit;
          });
      await openAt(hit.lat, hit.lng, hit.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No match for that address");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-24 pt-4">
      <AppHeader title="This House" page="house" />

      <h1 className="mt-8 font-display text-3xl leading-tight tracking-tight">Before the door.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Look up the house. Year, beds, a listing if one is out there. Then ask Roofus.
      </p>

      <Tip label="Use this phone's location">
        <Button
          size="xl"
          className="mt-8 w-full"
          disabled={busy !== null || !ready}
          onClick={() => void onThisHouse()}
        >
          <MapPin className="size-5" />
          {busy === "gps" ? "Finding you…" : "This House"}
        </Button>
      </Tip>

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
          {busy === "addr" ? "Looking up…" : "Look up"}
        </Button>
      </form>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Demo</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMOS.map((s) => (
            <Tip key={s.query} label="Opens the demo house">
              <button
                type="button"
                disabled={busy !== null || !ready}
                onClick={() => {
                  setQuery(s.query);
                  setBusy(s.label);
                  void openAt(s.lat, s.lng, s.query).finally(() => setBusy(null));
                }}
                className="min-h-10 rounded-full border border-border bg-surface px-3 py-2 text-left text-sm text-fg hover:bg-surface-2 disabled:opacity-40"
              >
                {busy === s.label ? "Opening…" : s.label}
              </button>
            </Tip>
          ))}
        </div>
      </div>

      {houses.length > 0 ? (
        <section className="mt-10">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Recent</p>
          <ul className="mt-2 flex flex-col gap-2">
            {houses.slice(0, 12).map((h) => (
              <li key={h.id}>
                <Link
                  to="/house/$houseId"
                  params={{ houseId: h.id }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-fg">{h.address.split(",")[0]}</span>
                    <span className="mt-0.5 block text-xs text-faint">
                      {h.yearBuilt ? `Built ${h.yearBuilt}` : "Year unknown"}
                      {h.stories ? ` · ${h.stories} story` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
