import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AerialFrame } from "@/components/aerial-frame";
import { FAQ } from "@/lib/faq";
import { useJobs } from "@/lib/jobs-store";
import { materialLabel, pitchById, productById } from "@/lib/roofing";
import { useSettings } from "@/lib/settings-store";
import { formatMoney, formatRange } from "@/lib/utils";

export const Route = createFileRoute("/show/$jobId")({
  codeSplitGroupings: [],
  component: ShowPage,
});

function ShowPage() {
  const { jobId } = Route.useParams();
  const job = useJobs((s) => s.jobs[jobId]);
  const book = useSettings((s) => s.book);
  const company = useSettings((s) => s.companyName);
  const warranty = useSettings((s) => s.warrantyLine);

  if (!job?.quote || !job.analysis) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6">
        <p className="text-muted">Nothing to show yet.</p>
        <Link to="/" className="text-sm underline">
          Home
        </Link>
      </main>
    );
  }

  const q = job.quote;
  const pitch = pitchById(job.pitchOverride ?? job.analysis.pitchPreset);
  const comingOff = materialLabel(job.materialOverride ?? job.analysis.material);
  const street = job.address.split(",")[0];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-paper px-5 pb-16 pt-4">
      <header className="flex items-center justify-between">
        <Link
          to="/job/$jobId"
          params={{ jobId: job.id }}
          className="inline-flex size-11 items-center justify-center rounded-md text-muted"
          aria-label="Ticket"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <p className="text-xs uppercase tracking-wide text-faint">{company}</p>
        <span className="w-11" />
      </header>

      <p className="mt-6 text-xs uppercase tracking-wide text-faint">{street}</p>
      <h1 className="mt-2 font-display text-3xl leading-tight">Tear-off and replace</h1>
      <p className="mt-3 font-display text-5xl leading-none tracking-tight tabular-nums">
        {formatRange(q.rangeLow, q.rangeHigh)}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {productById(job.product).line} on a {pitch.customer} roof. Full tear-off and haul-away
        included. Not a per-square rate — the whole job.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Typical replacement quotes for a roof this size often land around{" "}
        {formatRange(q.marketLow, q.marketHigh)}.
      </p>

      {job.aerial ? (
        <div className="mt-6">
          <AerialFrame aerial={job.aerial} />
        </div>
      ) : null}

      <ul className="mt-8 flex flex-col gap-3 text-sm leading-relaxed">
        <li>Full tear-off of existing {comingOff.toLowerCase()}</li>
        <li>Haul-away and dumpsters</li>
        <li>New underlayment, drip edge, ridge, and Duration</li>
        <li>
          First sheet of damaged wood included; {formatMoney(book.plywoodUsd)} each after
        </li>
      </ul>

      <dl className="mt-10 grid grid-cols-2 gap-x-3 gap-y-2 border-y border-border py-4 text-sm">
        <dt className="text-muted">Roof size</dt>
        <dd className="text-right tabular-nums">{q.roofSquares.toFixed(1)} squares</dd>
        <dt className="text-muted">Slope</dt>
        <dd className="text-right">{pitch.customer}</dd>
        <dt className="text-muted">Stories</dt>
        <dd className="text-right">{job.storiesOverride ?? job.analysis.stories}</dd>
      </dl>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Questions people ask</h2>
        <ul className="mt-4 flex flex-col gap-5">
          {FAQ.map((item) => (
            <li key={item.q}>
              <p className="text-sm font-medium">{item.q}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{item.a}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-xs leading-relaxed text-faint">{warranty}</p>
    </main>
  );
}