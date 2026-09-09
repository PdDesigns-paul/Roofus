import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { GableMark } from "@/components/gable-mark";
import { PinMap } from "@/components/pin-map";
import { Button } from "@/components/ui/button";
import { formatHouseBlurb, lookupHouse, reverseGeocode } from "@/lib/house-lookup";
import { useHouses } from "@/lib/houses-store";
import { useCoach } from "@/lib/coach-store";
import { useSettings } from "@/lib/settings-store";

export const Route = createFileRoute("/house/$houseId")({
  codeSplitGroupings: [],
  component: HouseBriefPage,
});

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="text-xs uppercase tracking-wide text-faint">{k}</span>
      <span className="text-right text-sm text-fg">{v}</span>
    </div>
  );
}

function HouseBriefPage() {
  const { houseId } = Route.useParams();
  const house = useHouses((s) => s.houses[houseId]);
  const hydrated = useHouses((s) => s.hydrated);
  const upsert = useHouses((s) => s.upsert);
  const navigate = useNavigate();
  const setTicketId = useCoach((s) => s.setTicketId);
  const setHat = useCoach((s) => s.setHat);
  const googleMapsKey = useSettings((s) => s.googleMapsKey);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg items-center px-5">
        <p className="text-sm text-muted">Loading the house…</p>
      </main>
    );
  }

  if (!house) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pt-4">
        <Link to="/house" className="text-sm text-muted">
          Back
        </Link>
        <p className="mt-8 text-sm text-muted">That house is not on this phone.</p>
      </main>
    );
  }

  async function relookup(lat: number, lng: number) {
    setBusy(true);
    setError(null);
    try {
      const rev = await reverseGeocode({
        data: { lat, lng, googleKey: googleMapsKey || undefined },
      });
      const address = rev && rev.ok ? rev.address : house.address;
      const looked = await lookupHouse({
        data: { lat, lng, address, googleKey: googleMapsKey || undefined },
      });
      if (!looked || !looked.ok) {
        setError("Could not re-read this pin.");
        return;
      }
      upsert({ id: houseId, ...looked.brief });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not re-read this pin.");
    } finally {
      setBusy(false);
    }
  }

  function askRoofus() {
    setTicketId(houseId);
    setHat("door");
    void navigate({ to: "/coach" });
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-16 pt-4">
      <header className="flex items-center justify-between">
        <Link
          to="/house"
          className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          aria-label="This House"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted">
          <GableMark className="size-4" />
          This House
        </div>
        <span className="w-11" />
      </header>

      <h1 className="mt-8 font-display text-3xl leading-tight tracking-tight">
        {house.address.split(",")[0]}
      </h1>
      <p className="mt-2 text-sm text-muted">{house.address}</p>

      <div className="mt-6">
        <PinMap lat={house.lat} lng={house.lng} onCommit={(la, ln) => void relookup(la, ln)} busy={busy} />
      </div>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      <section className="mt-6 rounded-2xl border border-border bg-surface px-4">
        <Row k="Year built" v={house.yearBuilt ? String(house.yearBuilt) : "Unknown"} />
        <Row k="Source" v={house.yearSource ?? "—"} />
        <Row k="Beds / baths" v={house.beds || house.baths ? `${house.beds ?? "—"} / ${house.baths ?? "—"}` : "—"} />
        <Row k="Living" v={house.livingSqft ? `${house.livingSqft.toLocaleString()} sqft` : "—"} />
        <Row k="Stories" v={house.stories ? String(house.stories) : "—"} />
        <Row k="Roof" v={[house.roofShape, house.roofMaterial].filter(Boolean).join(", ") || "—"} />
        <Row
          k="Place"
          v={[house.place, house.county, house.state].filter(Boolean).join(", ") || "—"}
        />
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {house.listingUrl ? (
          <a
            href={house.listingUrl}
            target="_blank"
            rel="noreferrer"
            className="col-span-2 flex min-h-12 items-center justify-between rounded-xl border border-border bg-surface px-4 text-sm hover:bg-surface-2"
          >
            {house.listingSource ?? "Open listing"}
            <ArrowUpRight className="size-4 text-faint" />
          </a>
        ) : null}
        <a
          href={house.zillowUrl ?? `https://www.zillow.com/homes/${encodeURIComponent(house.address)}_rb/`}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-12 items-center justify-between rounded-xl border border-border bg-surface px-4 text-sm hover:bg-surface-2"
        >
          Zillow
          <ArrowUpRight className="size-4 text-faint" />
        </a>
        <a
          href={house.redfinUrl ?? `https://www.redfin.com/v1/search?search_term=${encodeURIComponent(house.address)}`}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-12 items-center justify-between rounded-xl border border-border bg-surface px-4 text-sm hover:bg-surface-2"
        >
          Redfin
          <ArrowUpRight className="size-4 text-faint" />
        </a>
      </div>

      {house.notes.length > 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">{house.notes.join(" ")}</p>
      ) : null}

      <Button size="xl" className="mt-8 w-full" onClick={askRoofus}>
        Ask Roofus about this house
      </Button>

      <details className="mt-6 text-xs text-faint">
        <summary className="cursor-pointer">What Roofus will use</summary>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-surface p-3 text-muted">
          {formatHouseBlurb(house)}
        </pre>
      </details>
    </main>
  );
}
