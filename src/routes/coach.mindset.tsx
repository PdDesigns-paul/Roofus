import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { GableMark } from "@/components/gable-mark";
import { MINDSET } from "@/lib/mindset";

export const Route = createFileRoute("/coach/mindset")({
  codeSplitGroupings: [],
  component: MindsetPage,
});

function MindsetPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-16 pt-4">
      <header className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          aria-label="Home"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted">
          <GableMark className="size-4" />
          Mindset
        </div>
        <span className="w-11" />
      </header>
      <h1 className="mt-8 font-display text-3xl leading-tight tracking-tight">On the porch.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Playbook is the map. This is how you stand. Default door is age and a free look. Roofus pulls
        from this so he does not coach hunting.
      </p>
      <div className="mt-8 flex flex-col gap-6">
        {MINDSET.map((m) => (
          <section key={m.id} className="rounded-xl border border-border bg-surface p-4">
            <h2 className="font-display text-xl">{m.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{m.body}</p>
          </section>
        ))}
      </div>
      <nav className="mt-10 flex items-center justify-around text-[11px] text-faint">
        <Link to="/" className="hover:text-fg">
          Home
        </Link>
        <Link to="/coach" className="hover:text-fg">
          Roofus
        </Link>
        <Link to="/coach/inspect" className="hover:text-fg">
          Inspect
        </Link>
        <Link to="/coach/reference" className="hover:text-fg">
          Reference
        </Link>
        <span className="text-fg">Mindset</span>
      </nav>
    </main>
  );
}
