/** Mindset worksheets. Private. Never a pitch. After Action Report lives on Plan. */
import { localDateKey } from "./day-book.ts";
import type { SurviveState } from "./survive-store.ts";

export type WalkId = "why" | "demon" | "pace" | "stack";

export const COMPASS = [
  "This job is personal growth that pays. Highs and lows in the same day.",
  "Do not wait to feel passionate. Choose to care about the work in front of you.",
  "Do not work so you can be happy later. Be glad you get to work today.",
  "Stack skills. One extra appointment a month compounds for years.",
];

export const WALKS: {
  id: WalkId;
  n: string;
  title: string;
  when: string;
  blurb: string;
}[] = [
  {
    id: "why",
    n: "1",
    title: "Your why",
    when: "Once, then every dead day",
    blurb: "Money fades. Write the number as if it already happened. What it buys, who else, then the person or promise. Stop when it still hurts a little.",
  },
  {
    id: "demon",
    n: "2",
    title: "Name the demon",
    when: "Once. Private.",
    blurb: "The voice that keeps you in the truck. Name it. Where it started. Then how that same radar could help a homeowner.",
  },
  {
    id: "pace",
    n: "4",
    title: "Pace",
    when: "This week",
    blurb: "Hours you knock. One real off-block. Drop one gear. Name one thing you already have that last-year-you wanted.",
  },
  {
    id: "stack",
    n: "5",
    title: "Talent stack",
    when: "First of the month",
    blurb: "Pick three skills. One tiny drill. Windshield learning. A night book that is a person, not work.",
  },
];

export const ATTACKS = [
  { id: "fear", label: "Fear", fix: "First door in 10 minutes. Through, not around." },
  { id: "doubt", label: "Doubt", fix: "Read Why out loud. Then one more cluster." },
  { id: "more", label: "Just one more", fix: "Hear the phrase. Stand up. Phone in the other room." },
] as const;

export type AttackId = (typeof ATTACKS)[number]["id"];

export const GEARS = ["sprint", "grind", "all-day", "coast"] as const;

export type GearId = (typeof GEARS)[number];

export const STACK_SKILLS = [
  "Talk / listen",
  "Ask questions",
  "Body language",
  "Conflict",
  "Time blocks",
  "Truck",
  "Product",
  "Texts",
  "Numbers",
  "Photos",
  "Negotiation",
  "Systems",
] as const;

const SKILL_MAX = 3;
const SKILL_JOIN = " · ";

export function parseSkills(value: string): string[] {
  return value
    .split(SKILL_JOIN)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toggleSkill(value: string, name: string): string {
  const have = parseSkills(value);
  if (have.includes(name)) return have.filter((s) => s !== name).join(SKILL_JOIN);
  if (have.length >= SKILL_MAX) return value;
  return [...have, name].join(SKILL_JOIN);
}

export function whyRecap(s: Pick<SurviveState, "earned" | "byDate" | "why3" | "writtenOn">): string | null {
  if (!s.earned.trim() || !s.why3.trim()) return null;
  const when = s.byDate.trim() ? ` by ${s.byDate.trim()}` : "";
  const dated = s.writtenOn.trim() ? ` Written ${s.writtenOn.trim()}.` : "";
  return `I have earned ${s.earned.trim()}${when}. ${s.why3.trim()}.${dated} If the street feels pointless, read this out loud before you drive home.`;
}

/** Short kickoff for the API. Not shown as a homework dump in chat. */
export function walkKickoff(id: WalkId): string {
  if (id === "why") return "Walk me through Why. One question. First blank. Private. Not a door.";
  if (id === "demon") return "Walk me through naming the demon. One question. Private. Not a door.";
  if (id === "pace") return "Walk me through Pace. One question. First blank. Not a door.";
  return "Walk me through talent stack. One question. First blank. Not a door.";
}

export function walkReadWhy(): string {
  return "Read my why back. One breath. Ask if it still holds. Private. Not a door.";
}

/** Coach appendix. Off the porch. Never a porch line. Not pocket cards. */
export function surviveKnowledge(): string {
  const compass = COMPASS.map((line) => `- ${line}`).join("\n");
  const attacks = ATTACKS.map((a) => `- ${a.label}: ${a.fix}`).join("\n");
  return `Survival field manual. Off the porch. Never a porch line. Never quote a book at a homeowner.\n\n## Compass\n${compass}\n\n## Why\n- Number as if earned. Date it.\n- What it buys. Who else. Then the person or promise.\n- Dead day: read it out loud before you drive home.\n- Check in 90 days.\n- Money fades once bills are paid. Why has to outlast the first check.\n\n## Demon\n- One word. Where it started. How that same radar could help a homeowner.\n- Never put the demon on the porch.\n${attacks}\n\n## Pace\n- Knock hours from Settings.\n- One real off-block.\n- When the phone goes down.\n- Circle a gear. Drop one thing.\n- Name one thing they already have.\n\n## Talent stack\n- Three skills this month.\n- One tiny drill.\n- Windshield audio.\n- Night book that is a person, not work.\n\n## After Action Report\n- After Action Report lives on Plan. Not Mindset chat. Not a Today textarea.\n- Wins: long list first.\n- Facts: not self-hate.\n- Plan: verbs.\n- Five minutes of mental reps.\n\n## ARO (disaster / leak call)\n- Acknowledge the mess in detail.\n- Reassure you will make it right.\n- Overcome with a real plan.\n- Service, not a door trick.\n\n## Only competitor\n- You are the only competitor that matters.\n- Measure today vs yesterday.\n- Do not compare to Drew.`;
}

export type WalkPatch = {
  survive?: Partial<Omit<SurviveState, "patch">>;
  profile?: { knockWindow?: string; paperWindow?: string; hardStop?: string };
};

function stampWritten(s: SurviveState): Partial<SurviveState> {
  return s.writtenOn.trim() ? {} : { writtenOn: localDateKey() };
}

/** Next blank on this walk gets their chat answer. Null if the sheet is full. */
export function applyWalkAnswer(
  id: WalkId,
  text: string,
  s: SurviveState,
  hours: { knock: string; paper: string; stop: string },
): WalkPatch | null {
  const value = text.trim();
  if (!value) return null;
  if (id === "why") {
    if (!s.earned.trim()) return { survive: { earned: value, ...stampWritten(s) } };
    if (!s.byDate.trim()) return { survive: { byDate: value } };
    if (!s.why1.trim()) return { survive: { why1: value } };
    if (!s.why2.trim()) return { survive: { why2: value } };
    if (!s.why3.trim()) return { survive: { why3: value, ...stampWritten(s) } };
    return null;
  }
  if (id === "demon") {
    if (!s.demon.trim()) return { survive: { demon: value } };
    if (!s.origin.trim()) return { survive: { origin: value } };
    if (!s.radar.trim()) return { survive: { radar: value } };
    if (!s.attack.trim()) {
      const hit = ATTACKS.find((a) => a.id === value || a.label.toLowerCase() === value.toLowerCase());
      return { survive: { attack: hit?.id ?? value } };
    }
    return null;
  }
  if (id === "pace") {
    if (!hours.knock.trim()) return { profile: { knockWindow: value } };
    if (!hours.paper.trim()) return { profile: { paperWindow: value } };
    if (!hours.stop.trim()) return { profile: { hardStop: value } };
    if (!s.offBlock.trim()) return { survive: { offBlock: value } };
    if (!s.phoneDown.trim()) return { survive: { phoneDown: value } };
    if (!s.gear.trim()) {
      const hit = GEARS.find((g) => g === value || g === value.toLowerCase());
      return { survive: { gear: hit ?? value } };
    }
    if (!s.drop.trim()) return { survive: { drop: value } };
    if (!s.alreadyHave.trim()) return { survive: { alreadyHave: value } };
    return null;
  }
  if (!s.skill.trim()) return { survive: { skill: value } };
  if (!s.drill.trim()) return { survive: { drill: value } };
  if (!s.windshield.trim()) return { survive: { windshield: value } };
  if (!s.nightBook.trim()) return { survive: { nightBook: value } };
  return null;
}
