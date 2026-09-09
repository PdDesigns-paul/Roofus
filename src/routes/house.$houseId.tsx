import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { GableMark } from "@/components/gable-mark";
import { RoofusMark } from "@/components/roofus-mark";
import { Button } from "@/components/ui/button";
import { formatHouseBlurb } from "@/lib/house-lookup";
import { useHouses } from "@/lib/houses-store";
import { useCoach } from "@/lib/coach-store";

export const Route = createFileRoute("/house/$houseId")({
  codeSplitGroupings: [],
  component: HouseBriefPage,
});

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-3">
      <span className="text-xs uppercase tracking-wide text-faint">{k}</span>
      <span className="text-right text-sm text-fg">{v}</span>
    </div>
  );
}

function HouseBriefPage() {
  const { houseId } = Route.useParams();
  const house = useHouses((s) => s.houses[houseId]);
  const hydrated = useHouses((s) => s.hydrated);
  const navigate = useNavigate();
  const setTicketId = useCoach((s) => s.setTicketId);
  const setHat = useCoach((s) => s.setHat);

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

  function askRoofus() {
    setTicketId(houseId);
    setHat("door");
    void navigate({ to: "/coach" });
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-16 pt-4">
      <RoofusMark />
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

      <section className="mt-8 rounded-2xl border border-border bg-surface px-4">
        <Row k="Year built" v={house.yearBuilt ? String(house.yearBuilt) : "Not in this public set"} />
        <Row k="Source" v={house.yearSource ?? "—"} />
        <Row k="Stories" v={house.stories ? String(house.stories) : "—"} />
        <Row k="Roof" v={[house.roofShape, house.roofMaterial].filter(Boolean).join(", ") || "—"} />
        <Row k="Building" v={house.building ?? "—"} />
        <Row
          k="Place"
          v={[house.place, house.county, house.state].filter(Boolean).join(", ") || "—"}
        />
      </section>

      {house.notes.length > 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">{house.notes.join(" ")}</p>
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-faint">
        Census + OpenStreetMap. Not a tape. Not a report. Ask on the porch if the year is blank.
      </p>

      <Button size="xl" className="mt-8 w-full" onClick={askRoofus}>
        Ask Roofus about this house
      </Button>

      <details className="mt-6 text-xs text-faint">
        <summary className="cursor-pointer">What he will see</summary>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-surface p-3 text-muted">
          {formatHouseBlurb(house)}
        </pre>
      </details>
    </main>
  );
}
