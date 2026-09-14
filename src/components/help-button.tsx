import { CircleHelp } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/sheet";
import { Tip } from "@/components/ui/tooltip";
import { PAGE_HELP, type HelpPageId } from "@/lib/page-help";

function HelpOverlay({ page, onClose }: { page: HelpPageId; onClose: () => void }) {
  const help = PAGE_HELP[page];

  return (
    <Sheet open onClose={onClose} z={70}>
      <h2 id="help-title" className="mt-3 font-display text-2xl">
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
    </Sheet>
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
