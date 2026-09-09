import { CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";
import { Tip } from "@/components/ui/tooltip";
import { PAGE_HELP, type HelpPageId } from "@/lib/page-help";

function HelpOverlay({ page, onClose }: { page: HelpPageId; onClose: () => void }) {
  const help = PAGE_HELP[page];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-fg/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl border border-border bg-paper px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="help-title"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <h2 id="help-title" className="font-display text-2xl">
          {help.title}
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {help.body.map((p) => (
            <p key={p} className="text-sm leading-relaxed text-muted">
              {p}
            </p>
          ))}
        </div>
        <button
          type="button"
          className="mt-6 h-12 w-full rounded-full bg-fg text-sm text-paper"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export function HelpButton({ page }: { page: HelpPageId }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tip label="How this page works">
        <button
          type="button"
          aria-label="How this page works"
          className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg"
          onClick={() => setOpen(true)}
        >
          <CircleHelp className="size-5" />
        </button>
      </Tip>
      {open ? <HelpOverlay page={page} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
