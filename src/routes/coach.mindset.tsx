import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { RoofusMark } from "@/components/roofus-mark";
import { MINDSET } from "@/lib/mindset";

export const Route = createFileRoute("/coach/mindset")({
  codeSplitGroupings: [],
  component: MindsetPage,
});

function MindsetPage() {
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-24 pt-4">
      <RoofusMark />
      <AppHeader title="Mindset" page="mindset" />
      <h1 className="mt-8 font-display text-3xl leading-tight tracking-tight">On the porch.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        How you stand. Age and a free look unless a real storm hit that street. Roofus reads this
        too.
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
