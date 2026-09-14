import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SurviveState = {
  earned: string;
  byDate: string;
  why1: string;
  why2: string;
  why3: string;
  writtenOn: string;
  demon: string;
  origin: string;
  radar: string;
  attack: string;
  offBlock: string;
  phoneDown: string;
  gear: string;
  drop: string;
  alreadyHave: string;
  stackMonth: string;
  skill: string;
  drill: string;
  windshield: string;
  nightBook: string;
  patch: (p: Partial<Omit<SurviveState, "patch">>) => void;
};

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const FIELDS = [
  "earned",
  "byDate",
  "why1",
  "why2",
  "why3",
  "writtenOn",
  "demon",
  "origin",
  "radar",
  "attack",
  "offBlock",
  "phoneDown",
  "gear",
  "drop",
  "alreadyHave",
  "stackMonth",
  "skill",
  "drill",
  "windshield",
  "nightBook",
] as const;

export const useSurvive = create<SurviveState>()(
  persist(
    (set) => ({
      earned: "",
      byDate: "",
      why1: "",
      why2: "",
      why3: "",
      writtenOn: "",
      demon: "",
      origin: "",
      radar: "",
      attack: "",
      offBlock: "",
      phoneDown: "",
      gear: "",
      drop: "",
      alreadyHave: "",
      stackMonth: thisMonth(),
      skill: "",
      drill: "",
      windshield: "",
      nightBook: "",
      patch: (p) => set(p),
    }),
    {
      name: "roofus-survive-v1",
      partialize: (s) => {
        const out: Record<string, string> = {};
        for (const k of FIELDS) out[k] = s[k];
        return out;
      },
    },
  ),
);

if (typeof window !== "undefined") {
  void useSurvive.persist.rehydrate();
}

export function whyFilled(s: SurviveState) {
  return Boolean(s.earned.trim() && s.why3.trim());
}

export function demonFilled(s: SurviveState) {
  return Boolean(s.demon.trim());
}

export function paceFilled(s: SurviveState, _knockWindow?: string) {
  return Boolean(s.offBlock.trim() && s.gear.trim());
}

export function stackFilled(s: SurviveState) {
  return Boolean(s.skill.trim());
}

export function surviveForCoach(): string {
  const s = useSurvive.getState();
  const lines = [
    "# Mindset (private. Never say this at a door. Not a pitch.)",
  ];
  if (whyFilled(s)) {
    lines.push(`Why: they wrote they have earned ${s.earned} by ${s.byDate || "a date they set"}.`);
    if (s.writtenOn) lines.push(`Written ${s.writtenOn}. If that date is older than ~90 days, ask if it still holds.`);
    if (s.why1) lines.push(`What the number buys: ${s.why1}`);
    if (s.why2) lines.push(`Who else is on the other side: ${s.why2}`);
    if (s.why3) lines.push(`Why they care: ${s.why3}`);
    lines.push("On a dead day or self-doubt, read this why back. Do not invent a new one.");
  } else {
    lines.push("Why is blank. If the week feels heavy, open Mindset and fill Why. One question at a time. Ladder: number as done, what it buys, who else, then the person/promise/version of them.");
  }
  if (demonFilled(s)) {
    lines.push(`Demon (private): they named it “${s.demon}”. Origin they wrote: ${s.origin || "not written"}.`);
    if (s.radar) lines.push(`If that radar helped a homeowner instead of hiding: ${s.radar}`);
    if (s.attack === "fear") lines.push("Attack this week: fear (truck). First door in 10 minutes. Through, not around.");
    else if (s.attack === "doubt") lines.push("Attack this week: doubt. Read Why out loud. Then one more cluster.");
    else if (s.attack === "more") lines.push("Attack this week: just one more (beer, scroll, episode). Hear the phrase. Stand up. Phone in the other room.");
    lines.push("If they are sitting in the truck, that is the stay-in-the-truck voice. Walk through. Do not therapy-dump. Do not put this on a porch.");
  } else {
    lines.push("Demon is unnamed. Mindset walk 2 if fear is running the day.");
  }
  if (s.offBlock.trim() || s.phoneDown.trim() || s.gear.trim()) {
    lines.push(
      `Pace: off-block ${s.offBlock || "—"}. Phone down: ${s.phoneDown || "—"}. Gear: ${s.gear || "not circled"}.`,
    );
    if (s.drop) lines.push(`What they will drop so they last: ${s.drop}`);
    if (s.alreadyHave) lines.push(`Already have (happy-when trap): ${s.alreadyHave}`);
  }
  if (stackFilled(s)) {
    lines.push(`Talent stack (${s.stackMonth || "this month"}): ${s.skill}. Drill: ${s.drill || "not set"}.`);
    if (s.windshield) lines.push(`Windshield: ${s.windshield}`);
    if (s.nightBook) lines.push(`Night book (person, not work): ${s.nightBook}`);
  }
  lines.push("After Action Report is on Truck and After — same fields. Wins first, then facts, then a plan with verbs. Do not duplicate it here.");
  return lines.join("\n");
}
