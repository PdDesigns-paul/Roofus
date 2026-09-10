import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
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
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Reference" page="reference" />

      <h1 className="mt-4 font-display text-2xl leading-tight tracking-tight">The library.</h1>
      <p className="mt-2 text-sm leading-snug text-muted">
        {MRI_COUNT} InterNACHI articles. Search, open a chapter. Roofus has the same list.
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
    </main>
  );
}
