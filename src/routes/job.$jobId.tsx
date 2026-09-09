import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { AerialFrame } from "@/components/aerial-frame";
import { GableMark } from "@/components/gable-mark";
import { RepOverrides } from "@/components/rep-overrides";
import { Button } from "@/components/ui/button";
import { kickoffTakeoff } from "@/lib/kickoff";
import { useJobs, type Job } from "@/lib/jobs-store";
import { quoteJob } from "@/lib/quote-from-job";
import { COMPLEXITY_LABEL, materialLabel, pitchById, productById } from "@/lib/roofing";
import { useSettings } from "@/lib/settings-store";
import { formatMoney, formatRange } from "@/lib/utils";

export const Route = createFileRoute("/job/$jobId")({
  codeSplitGroupings: [],
  component: JobPage,
});

function JobPage() {
  const { jobId } = Route.useParams();
  const job = useJobs((s) => s.jobs[jobId]);
  const hydrated = useJobs((s) => s.hydrated);
  const patch = useJobs((s) => s.patch);
  const book = useSettings((s) => s.book);
  const settingsReady = useSettings((s) => s.hydrated);
  const googleMapsKey = useSettings((s) => s.googleMapsKey);
  const instantRooferKey = useSettings((s) => s.instantRooferKey);
  const bookTouched = useSettings((s) => s.bookTouched);
  const navigate = useNavigate();

  useEffect(() => {
    if (!settingsReady || !job || job.status !== "running") return;
    void kickoffTakeoff(job, book, googleMapsKey, instantRooferKey);
  }, [settingsReady, job, book, googleMapsKey, instantRooferKey]);

  function apply(p: Partial<Job>) {
    if (!job) return;
    const merged = { ...job, ...p };
    if (merged.analysis) merged.quote = quoteJob(merged, book);
    patch(job.id, { ...p, quote: merged.quote });
  }

  if (!job) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-fg px-6 text-paper">
        <p className="text-paper/70">{hydrated ? "That ticket is gone." : "Loading ticket…"}</p>
        {hydrated ? (
          <Button asChild variant="outline">
            <Link to="/">Back</Link>
          </Button>
        ) : null}
      </main>
    );
  }

  const quote = job.quote;
  const analysis = job.analysis;
  const pitch = pitchById(job.pitchOverride ?? analysis?.pitchPreset ?? "6");
  const comingOff = materialLabel(job.materialOverride ?? analysis?.material ?? "architectural");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-fg px-5 pb-28 pt-4 text-paper">
      <header className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex size-11 items-center justify-center rounded-md text-paper/60 hover:text-paper"
          aria-label="Home"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2 text-sm text-paper/70">
          <GableMark className="size-4" />
          RoofUs
        </div>
        <Link
          to="/coach"
          className="inline-flex size-11 items-center justify-center rounded-md text-paper/60 hover:text-paper"
          aria-label="Roofus"
        >
          <span className="text-base">🐕</span>
        </Link>
      </header>

      {job.status === "running" ? (
        <section className="mt-16">
          <p className="text-xs font-medium uppercase tracking-wide text-paper/40">
            {job.address}
          </p>
          <h1 className="mt-3 font-display text-3xl">Reading the roof…</h1>
          <p className="mt-2 text-sm text-paper/60">{job.steps.at(-1)}</p>
        </section>
      ) : null}

      {job.status === "failed" ? (
        <section className="mt-16 flex flex-col gap-4">
          <h1 className="font-display text-3xl">Couldn’t tape it.</h1>
          <p className="text-sm text-paper/70">{job.error}</p>
          <Button
            onClick={() => {
              patch(job.id, { status: "running", error: null, steps: ["Retrying"] });
            }}
          >
            Retry
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Try another house</Link>
          </Button>
        </section>
      ) : null}

      {job.status === "ready" && (!quote || !analysis) ? (
        <section className="mt-8 flex flex-col gap-4">
          <h1 className="font-display text-3xl">No tape on this pin.</h1>
          <p className="text-sm leading-relaxed text-paper/70">
            Paste the Instant Roofer API key in Presets & Settings and run the address again.
            We will not invent squares.
          </p>
          <Button asChild>
            <Link to="/settings">Open settings</Link>
          </Button>
        </section>
      ) : null}

      {job.status === "ready" && quote && analysis ? (
        <section className="mt-6 flex flex-col gap-6">
          {job.aerial ? <AerialFrame aerial={job.aerial} outline={job.outline} /> : null}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-paper/40">
              Customer range
            </p>
            <p className="mt-1 font-display text-4xl leading-none tracking-tight tabular-nums">
              {formatRange(quote.rangeLow, quote.rangeHigh)}
            </p>
            <p className="mt-2 text-sm text-paper/70">
              {productById(job.product).line} · full tear-off · {pitch.customer}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-paper/40">
              Range starts at your rate. High is the cushion so you don’t come back with a
              bigger number.
            </p>
          </div>

          {!job.instant ? (
            <p className="rounded-md border border-paper/15 bg-paper/5 px-3 py-2 text-sm text-paper/70">
              {job.solarSkip === "no-key"
                ? "No Instant Roofer tape on this pin. Leave Settings blank for Paul’s Default Option, then retry on the published app."
                : job.solarSkip === "key"
                  ? "Instant Roofer rejected the key. Copy it from the dashboard and paste it in Presets & Settings."
                  : "No Instant Roofer measure on this pin. Don’t show this number. Check the key and retry."}
            </p>
          ) : null}

          <Button
            size="xl"
            className="w-full bg-paper text-fg hover:bg-paper/90"
            onClick={() => void navigate({ to: "/show/$jobId", params: { jobId: job.id } })}
          >
            Show customer
          </Button>

          {!bookTouched ? (
            <p className="text-xs text-paper/40">
              Duration is $550/sq. Change metal/slate in Settings if you need to.
            </p>
          ) : null}

          <div className="rounded-xl border border-paper/10 bg-paper/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-paper/40">Rep ticket</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <dt className="text-paper/60">Squares (roof)</dt>
              <dd className="text-right tabular-nums">{quote.roofSquares.toFixed(1)}</dd>
              <dt className="text-paper/60">Geometry</dt>
              <dd className="text-right">
                {job.instant
                  ? `Instant Roofer · ${job.instant.confidenceLabel}`
                  : "No measure"}
              </dd>
              <dt className="text-paper/60">Bird's-eye</dt>
              <dd className="text-right tabular-nums">
                {job.instant
                  ? `${Math.round(job.instant.aerialSqFt).toLocaleString()} ft²`
                  : "—"}
              </dd>
              <dt className="text-paper/60">After pitch</dt>
              <dd className="text-right tabular-nums">
                {job.instant
                  ? `${Math.round(job.instant.measuredSqFt).toLocaleString()} ft²`
                  : "—"}
              </dd>
              <dt className="text-paper/60">Squares to order</dt>
              <dd className="text-right tabular-nums">{quote.orderSquares.toFixed(2)}</dd>
              <dt className="text-paper/60">Pitch they used</dt>
              <dd className="text-right">{job.instant?.pitchRaw ?? pitch.ratio}</dd>
              <dt className="text-paper/60">Facets</dt>
              <dd className="text-right tabular-nums">{job.instant?.facets || "—"}</dd>
              <dt className="text-paper/60">Waste</dt>
              <dd className="text-right tabular-nums">{quote.wastePct}%</dd>
              <dt className="text-paper/60">Complexity</dt>
              <dd className="text-right">{COMPLEXITY_LABEL[analysis.complexity]}</dd>
              <dt className="text-paper/60">Coming off</dt>
              <dd className="text-right">{comingOff}</dd>
              <dt className="text-paper/60">Package</dt>
              <dd className="text-right tabular-nums">{formatMoney(quote.installUsd)}</dd>
              <dt className="text-paper/60">Typical out there</dt>
              <dd className="text-right tabular-nums">
                {formatRange(quote.marketLow, quote.marketHigh)}
              </dd>
            </dl>
            {job.instant &&
            (job.instant.planOnlyRisk ||
              (job.instant.stories >= 2 &&
                job.instant.aerialSqFt > 400 &&
                job.instant.measuredSqFt / job.instant.aerialSqFt < 1.22 &&
                (job.instant.pitchPreset === "3" ||
                  job.instant.pitchPreset === "4" ||
                  job.instant.pitchPreset === "6"))) ? (
              <p className="mt-3 text-xs leading-relaxed text-accent">
                Instant Roofer priced the bird’s-eye times one pitch. Steep lower mansard
                faces barely show in that view, so this square count often runs light. Don’t
                sell it. Walk it or get a human tape.
              </p>
            ) : null}
          </div>

          <RepOverrides job={job} onChange={apply} />
        </section>
      ) : null}
    </main>
  );
}