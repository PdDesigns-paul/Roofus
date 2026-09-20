import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PlaceCard } from "@/components/place-card";
import { Button } from "@/components/ui/button";
import { whenCoachReady, useCoach } from "@/lib/coach-store";
import { blankDay, localDateKey, useDayBook } from "@/lib/day-book";
import { readFreshKept } from "@/lib/kept-storm";
import { abortTalk, sendRoofus } from "@/lib/roofus-talk";
import { practiceUnlocked } from "@/lib/coach-modes";
import { useSettings } from "@/lib/settings-store";
import { lastPinOnLoop, nextBlankOnLoop, streetNameOf, type HousePin } from "@/lib/pins";
import { usePins } from "@/lib/pins-store";
import {
  claimOnStreet,
  doorList,
  doorStrip,
  fillPocketCard,
  fillSpoken,
  hasOpenToken,
  nextKnockDay,
  stripWeather,
  type PocketCard,
  type PocketFill,
} from "@/lib/pocket-cards";
import { companyOf } from "@/lib/setup-progress";
import { loopHeadline, loopZip, zipFromHeadline } from "@/lib/streets-rank";
import { useStreets } from "@/lib/streets-store";
import { speakText } from "@/lib/speech";
import { useWeather } from "@/lib/weather-store";
import { pack } from "@/lib/tenant";


/** Door cards. Formerly /coach/cards. */
export const Route = createFileRoute("/door")({
  codeSplitGroupings: [],
  component: Door,
});

function lastPin(pins: HousePin[]): HousePin | undefined {
  return pins.reduce<HousePin | undefined>((a, b) => (!a || a.createdAt < b.createdAt ? b : a), undefined);
}

function Door() {
  const profile = useDayBook((s) => s.profile);
  const date = localDateKey();
  const day = useDayBook((s) => s.days[date]) ?? blankDay(date);
  const loops = useStreets((s) => s.loops);
  const ageMin = useStreets((s) => s.ageMin);
  const ageMax = useStreets((s) => s.ageMax);
  const allPins = usePins((s) => s.pins);
  const keptStorms = useWeather((s) => s.keptStorms);
  const working = loops.find((l) => l.status === "working");
  const nextDoor = working ? nextBlankOnLoop(allPins, working.id) : undefined;
  const lastOnLoop = working ? lastPinOnLoop(allPins, working.id) : lastPin(allPins);
  const pin = nextDoor ?? lastOnLoop;
  const streetName = pin ? streetNameOf(pin) : "";
  const pinZip = pin?.zip.trim() ?? "";
  const workingZip = working ? loopZip(working) : "";
  const streetZip = pinZip || workingZip;
  const fresh = readFreshKept(keptStorms);
  const matching = fresh.flatMap((row) => {
    const loop = loops.find((l) => l.id === row.loopId);
    const zip = (loop ? loopZip(loop) : "") || zipFromHeadline(row.loopLabel);
    if (!streetZip || zip !== streetZip || !row.say.trim()) return [];
    return [{ say: row.say.trim(), zip }];
  });
  const claim = claimOnStreet(matching);
  const fill: PocketFill = {
    goBy: profile.goBy,
    company: companyOf(profile.company),
    ageMin,
    ageMax,
    day: nextKnockDay(),
  };
  const cards = doorList(claim.show).map((c) => {
    const filled = fillPocketCard(c, fill);
    if (c.id === "claim") return { ...filled, when: claim.when };
    return filled;
  });
  const strip = doorStrip({
    goBy: profile.goBy,
    company: companyOf(profile.company),
    streetName,
    loopLabel: working ? loopHeadline(working) : "",
    ageMin,
    ageMax,
    weather: stripWeather(matching[0]?.say ?? "", day.storm),
  });
  const [open, setOpen] = useState<PocketCard["id"] | null>("door");

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-4 pb-tab pt-3">
      <AppHeader title={pack.places.door} />
      <h1 className="mt-4 font-display text-2xl leading-tight tracking-tight">In your pocket.</h1>
      <p className="mt-3 text-sm leading-relaxed">
        {strip.emptyYou ? (
          <Link to="/settings/you" className="text-fg underline underline-offset-4">
            Name and company live in You.
          </Link>
        ) : (
          <Link to="/settings/you" className="text-fg underline underline-offset-4">
            {strip.identity}
          </Link>
        )}
        {" · "}
        {strip.pinNeeded ? (
          <Link to="/truck" className="text-fg underline underline-offset-4">
            Pin this house on Today.
          </Link>
        ) : (
          <Link to={strip.placeGo} className="text-fg underline underline-offset-4">
            {strip.place}
          </Link>
        )}
        {` · ${strip.age} · ${strip.weather}`}
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
            tone={c.id === "compass" ? "truck" : "porch"}
            clearFab
            onToggle={(id) => setOpen((cur) => (cur === id ? null : (id as PocketCard["id"])))}
          >
            <CardBody card={c} fill={fill} />
          </PlaceCard>
        ))}
      </ul>
    </main>
  );
}

function CardBody({ card, fill }: { card: PocketCard; fill: PocketFill }) {
  const firstSay = card.lines.findIndex((l) => l.say && !hasOpenToken(l.say));
  return (
    <>
      <ul className="flex flex-col gap-3">
        {card.lines.map((l, i) => {
          const say = l.say && !hasOpenToken(l.say) ? l.say : "";
          const note = l.note && !hasOpenToken(l.note) ? l.note : "";
          if (!say && !note) return null;
          return (
            <li key={`${card.id}-${i}`}>
              {say ? <p className="text-lg leading-snug text-fg">{say}</p> : null}
              {say && i === firstSay ? <HearLine text={say} /> : null}
              {note ? (
                <p className={`text-sm leading-relaxed text-muted ${say ? "mt-1" : ""}`}>{note}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="mt-4 w-full"
        onClick={() => askCard(card, fill)}
      >
        {pack.copy.askTalk}
      </Button>
    </>
  );
}

function HearLine({ text }: { text: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!text.trim()) return null;

  async function play() {
    setErr(null);
    setBusy(true);
    try {
      await speakText(text);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      <Button type="button" variant="outline" size="lg" disabled={busy} onClick={() => void play()}>
        {busy ? "Reading…" : "Hear this line"}
      </Button>
      {err ? <p className="mt-1 text-sm text-danger">{err}</p> : null}
    </div>
  );
}

function askCard(card: PocketCard, fill: PocketFill) {
  abortTalk();
  whenCoachReady(() => {
    useCoach.getState().startNew({
      mode: card.mode,
      scene: card.scene,
      title: card.id === "claim" ? "Claim path" : undefined,
    });
    useCoach.getState().openSheet();
    const opener = card.lines.find((l) => l.say && !hasOpenToken(l.say))?.say?.trim();
    if (card.mode === "roleplay" && opener && practiceUnlocked(useSettings.getState().practiceOn)) {
      void sendRoofus(fillSpoken(opener, fill), { kickoff: true }).catch(() => undefined);
    }
  });
}
