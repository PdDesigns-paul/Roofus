/** Pocket cards. Distilled from /DOCTRINE.md. Arrays live on the tenant pack. */
import { pack } from "./tenant/index.ts";
import type { PocketCard, PocketLine } from "./tenant/pack.ts";

export type { PocketCard, PocketLine };

export const POCKET_CARDS: PocketCard[] = [...pack.cards];

export const CLAIM_PATH_CARD: PocketCard = pack.claimCard ?? pack.cards[0];

/** B cards always. A card after Door when they Kept a storm and the pack sells claim. */
export function doorList(showClaim: boolean): PocketCard[] {
  const cards = [...pack.cards];
  if (!showClaim || !pack.modules.claim || !pack.claimCard) return cards;
  const [door, ...rest] = cards;
  return [door, pack.claimCard, ...rest];
}

export type PreKnockInput = {
  cluster: string;
  storm: string;
  goBy: string;
  company: string;
  knockWindow: string;
  hardStop: string;
  ageMin: number;
  ageMax: number;
  workingZip: string;
};

export type PreKnock = {
  zip: string;
  age: string;
  weather: string;
  hours: string;
  script: string;
  opener: string;
};

export function fillName(goBy: string, company: string): { name: string; company: string } {
  return {
    name: goBy.trim() || "[your name]",
    company: company.trim() || "[company]",
  };
}

export type PocketFill = {
  goBy: string;
  company: string;
  ageMin: number;
  ageMax: number;
  day: string;
};

export function youEmpty(goBy: string, company: string): boolean {
  return !goBy.trim() || !company.trim();
}

/** Next calendar weekday. Hours are free text — do not invent a knockable day they did not set. */
export function nextKnockDay(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export function yearWindowPhrase(ageMin: number, ageMax: number): string {
  return `that ${ageMin}–${ageMax} year window`;
}

export function hasOpenToken(text: string): boolean {
  return /\[[^\]]+\]/.test(text);
}

/** Fill what we know. Leave [name]/[company] if You is empty so the UI can hide them. */
export function fillTokens(text: string, fill: PocketFill): string {
  const year = yearWindowPhrase(fill.ageMin, fill.ageMax);
  const day = fill.day.trim() || nextKnockDay();
  let out = text.replaceAll("[year]", year).replaceAll("[day]", day);
  const name = fill.goBy.trim();
  const company = fill.company.trim();
  if (name) out = out.replaceAll("[name]", name);
  if (company) out = out.replaceAll("[company]", company);
  return out;
}

/** Never leave brackets. Roleplay / TTS. Empty You becomes “your name”, not a person. */
export function fillSpoken(text: string, fill: PocketFill): string {
  const year = yearWindowPhrase(fill.ageMin, fill.ageMax);
  const day = fill.day.trim() || nextKnockDay();
  const name = fill.goBy.trim() || "your name";
  const company = fill.company.trim() || "your company";
  return text
    .replaceAll("[year]", year)
    .replaceAll("[day]", day)
    .replaceAll("[name]", name)
    .replaceAll("[company]", company);
}

export function fillPocketCard(card: PocketCard, fill: PocketFill): PocketCard {
  return {
    ...card,
    when: fillTokens(card.when, fill),
    formula: fillTokens(card.formula, fill),
    lines: card.lines.map((l) => ({
      say: l.say ? fillTokens(l.say, fill) : l.say,
      note: l.note ? fillTokens(l.note, fill) : l.note,
    })),
  };
}

export type DoorStripInput = {
  goBy: string;
  company: string;
  streetName: string;
  loopLabel: string;
  ageMin: number;
  ageMax: number;
  weather: string;
};

export type DoorStrip = {
  emptyYou: boolean;
  identity: string;
  place: string;
  placeGo: "/truck" | "/after";
  pinNeeded: boolean;
  age: string;
  weather: string;
};

export function doorStrip(input: DoorStripInput): DoorStrip {
  const goBy = input.goBy.trim();
  const company = input.company.trim();
  const emptyYou = !goBy || !company;
  const street = input.streetName.trim();
  const loop = input.loopLabel.trim();
  const place = street || loop;
  return {
    emptyYou,
    identity: emptyYou ? "" : `${goBy} · ${company}`,
    place,
    placeGo: loop ? "/after" : "/truck",
    pinNeeded: !place,
    age: `roofs ${input.ageMin}–${input.ageMax}`,
    weather: input.weather.trim() || "Age only",
  };
}

/** Claim path only when a kept storm names this zip. */
export function claimOnStreet(kept: { say: string; zip: string }[]): { show: boolean; when: string } {
  const row = kept.find((k) => k.say.trim() && k.zip.trim());
  if (!row) return { show: false, when: "" };
  return { show: true, when: `${row.say.trim()} · ${row.zip.trim()}` };
}

export function stripWeather(matchingKeptSay: string, useToday: string): string {
  const kept = matchingKeptSay.trim();
  if (kept) return kept;
  const today = useToday.trim().split("\n")[0]?.trim() ?? "";
  if (today) return today;
  return "Age only";
}

export function preKnock(input: PreKnockInput): PreKnock {
  const zip = input.cluster.trim() || input.workingZip.trim();
  const storm = input.storm.trim();
  const who = fillName(input.goBy, input.company);
  const hours = [input.knockWindow.trim(), input.hardStop.trim() ? `stop ${input.hardStop.trim()}` : ""]
    .filter(Boolean)
    .join(" · ");
  return {
    zip: zip || "Pick a zip on Plan",
    age: `Roofs ${input.ageMin}–${input.ageMax}`,
    weather: storm || "Age only. Do not invent weather.",
    hours: hours || "Hours live in Settings",
    script: storm
      ? "Age first. Name this weather only on this zip."
      : "Million-dollar script. Age and a free look.",
    opener: `Hey — I’m ${who.name} with ${who.company}. I stopped by to see if you heard what’s been going on in the area.`,
  };
}

export function pocketKnowledge(): string {
  const claim = pack.modules.claim && pack.claimCard ? pack.claimCard : null;
  const cards = claim ? [pack.cards[0], claim, ...pack.cards.slice(1)] : [...pack.cards];
  return cards
    .map((c) => {
      const body = c.lines
        .map((l) => {
          if (l.say && l.note) return `- Say: ${l.say}\n  (${l.note})`;
          if (l.say) return `- Say: ${l.say}`;
          return `- ${l.note}`;
        })
        .join("\n");
      return `### ${c.title} (${c.when})\nFormula: ${c.formula}\n${body}`;
    })
    .join("\n\n");
}
