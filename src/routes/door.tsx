import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PlaceCard } from "@/components/place-card";
import { whenCoachReady, useCoach } from "@/lib/coach-store";
import { readFreshKept } from "@/lib/kept-storm";
import { abortTalk } from "@/lib/roofus-talk";
import { doorList, type PocketCard } from "@/lib/pocket-cards";
import { useWeather } from "@/lib/weather-store";

/** Door cards. Formerly /coach/cards. */
export const Route = createFileRoute("/door")({
  codeSplitGroupings: [],
  component: Door,
});

function Door() {
  const keptStorms = useWeather((s) => s.keptStorms);
  const showClaim = readFreshKept(keptStorms).length > 0;
  const cards = doorList(showClaim);
  const [open, setOpen] = useState<PocketCard["id"] | null>("door");

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title="Door" />
      <h1 className="mt-4 font-display text-2xl leading-tight tracking-tight">In your pocket.</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Pocket cards. Each has a formula: hook, honest reason, one open question. Door is the default
        knock. Claim path shows after you Keep a storm. Compass stays here — read it in the truck. Ask
        Roofus opens Roleplay on that beat. Compass opens Mindset.
      </p>
      <ul className="mt-5 flex flex-col gap-3">
        {cards.map((c) => (
          <PlaceCard
            key={c.id}
            id={c.id}
            when={c.when}
            title={c.title}
            formula={c.formula}
            open={open === c.id}
            onToggle={(id) => setOpen((cur) => (cur === id ? null : (id as PocketCard["id"])))}
          >
            <CardBody card={c} />
          </PlaceCard>
        ))}
      </ul>
    </main>
  );
}

function CardBody({ card }: { card: PocketCard }) {
  return (
    <>
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
    </>
  );
}

function askCard(card: PocketCard) {
  abortTalk();
  whenCoachReady(() => {
    useCoach.getState().startNew({
      mode: card.mode,
      scene: card.scene,
      title: card.id === "claim" ? "Claim path" : undefined,
    });
    useCoach.getState().openSheet();
  });
}
