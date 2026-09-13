import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { whenCoachReady, useCoach } from "@/lib/coach-store";
import { abortTalk } from "@/lib/roofus-talk";
import { POCKET_CARDS, type PocketCard } from "@/lib/pocket-cards";

/** Door cards. Formerly /coach/cards. */
export const Route = createFileRoute("/door")({
  codeSplitGroupings: [],
  component: CardsPage,
});

export function CardsPage() {
  const [open, setOpen] = useState<PocketCard["id"] | null>("door");

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Door" />
      <h1 className="mt-4 font-display text-2xl leading-tight tracking-tight">In your pocket.</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Five cards. Door is the default knock. Compass is truck only. Ask Roofus opens Roleplay on
        that beat — Compass opens Mindset.
      </p>
      <ul className="mt-5 flex flex-col gap-3">
        {POCKET_CARDS.map((c) => (
          <li key={c.id} className="rounded-2xl border border-border bg-surface">
            <button
              type="button"
              onClick={() => setOpen((cur) => (cur === c.id ? null : c.id))}
              className="w-full px-4 py-3 text-left"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-faint">{c.when}</p>
              <p className="mt-1 font-display text-xl tracking-tight">{c.title}</p>
            </button>
            {open === c.id ? <CardBody card={c} /> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}

function CardBody({ card }: { card: PocketCard }) {
  return (
    <div className="border-t border-border px-4 pb-4 pt-3">
      <ul className="flex flex-col gap-3">
        {card.lines.map((l, i) => (
          <li key={`${card.id}-${i}`}>
            {l.say ? <p className="text-sm leading-relaxed">{l.say}</p> : null}
            {l.note ? (
              <p className={`text-xs leading-relaxed text-muted ${l.say ? "mt-1" : ""}`}>{l.note}</p>
            ) : null}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-4 h-11 w-full rounded-full border border-border text-sm"
        onClick={() => askCard(card)}
      >
        Ask Roofus
      </button>
    </div>
  );
}

function askCard(card: PocketCard) {
  abortTalk();
  whenCoachReady(() => {
    useCoach.getState().startNew({
      mode: card.mode,
      scene: card.scene,
    });
    useCoach.getState().openSheet();
  });
}