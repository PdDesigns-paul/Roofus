import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { GableMark } from "@/components/gable-mark";
import { Input } from "@/components/ui/input";
import { MRI_CHAPTERS, MRI_COUNT, mriSearchHay } from "@/lib/mri-index";

export const Route = createFileRoute("/coach/reference")({
  codeSplitGroupings: [],
  component: ReferencePage,
});

function ReferencePage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const needle = q.trim().toLowerCase();
  const chapters = useMemo(() => {
    if (!needle) return MRI_CHAPTERS;
    return MRI_CHAPTERS.map((ch) => ({
      ...ch,
      cards: ch.cards.filter((c) => mriSearchHay(ch, c).includes(needle)),
    })).filter((ch) => ch.cards.length > 0);
  }, [needle]);

  function isOpen(id: string) {
    if (needle) return true;
    return Boolean(open[id]);
  }

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
          Reference
        </div>
        <span className="w-11" />
      </header>

      <h1 className="mt-8 font-display text-3xl leading-tight tracking-tight">The library.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {MRI_COUNT} InterNACHI articles. Search, then open a chapter. Roofus has the same list.
      </p>

      <Input
        className="mt-4"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Hail, kickout, Duration, attic…"
        type="search"
      />

      <div className="mt-6 flex flex-col gap-2">
        {chapters.length === 0 ? (
          <p className="text-sm text-muted">Nothing matches.</p>
        ) : (
          chapters.map((ch) => {
            const expanded = isOpen(ch.id);
            const looks = [...new Set(ch.cards.map((c) => c.look))];
            return (
              <section key={ch.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <button
                  type="button"
                  className="flex w-full min-h-12 items-center justify-between gap-3 px-4 py-3 text-left"
                  onClick={() => setOpen((s) => ({ ...s, [ch.id]: !s[ch.id] }))}
                  aria-expanded={expanded}
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-fg">{ch.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {ch.when} · {ch.cards.length}
                    </span>
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-faint transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded ? (
                  <div className="border-t border-border px-4 pb-3 pt-2">
                    {looks.length === 1 ? (
                      <p className="mb-2 text-sm leading-relaxed text-muted">{looks[0]}</p>
                    ) : null}
                    <ul className="flex flex-col gap-1">
                      {ch.cards.map((c) => (
                        <li key={c.id}>
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm text-fg hover:underline"
                          >
                            <span className="min-w-0">
                              <span className="block">{c.title}</span>
                              {looks.length > 1 ? (
                                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                                  {c.look}
                                </span>
                              ) : null}
                            </span>
                            <ArrowUpRight className="size-4 shrink-0 text-faint" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            );
          })
        )}
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
        <span className="text-fg">Reference</span>
        <Link to="/coach/mindset" className="hover:text-fg">
          Mindset
        </Link>
      </nav>
    </main>
  );
}
