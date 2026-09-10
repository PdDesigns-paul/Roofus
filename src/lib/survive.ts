/** Mindset worksheets. Private. Never a pitch. After Action Report lives on Today. */
import type { SurviveState } from "@/lib/survive-store";

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
    blurb: "Money fades. Write the number as if it already happened, then ask why three times.",
  },
  {
    id: "demon",
    n: "2",
    title: "Name the demon",
    when: "Once. Private.",
    blurb: "The voice that keeps you in the truck. One word is enough. Private.",
  },
  {
    id: "pace",
    n: "4",
    title: "Pace",
    when: "This week",
    blurb: "Hours you knock. When the phone goes down. One real off-block. You train people when you reply late.",
  },
  {
    id: "stack",
    n: "5",
    title: "Talent stack",
    when: "First of the month",
    blurb: "What you are practicing. Treat reps like free throws, not a new career.",
  },
];

/** Short kickoff for the API. Not shown as a homework dump in chat. */
export function walkKickoff(id: WalkId): string {
  if (id === "why") return "Walk me through Why. One question. First blank. Private. Not a door.";
  if (id === "demon") return "Walk me through naming the demon. One question. Private. Not a door.";
  if (id === "pace") return "Walk me through Pace. One question. First blank. Not a door.";
  return "Walk me through talent stack. One question. First blank. Not a door.";
}

export type WalkPatch = {
  survive?: Partial<Omit<SurviveState, "patch">>;
  profile?: { knockWindow?: string; paperWindow?: string; hardStop?: string };
};

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
    if (!s.earned.trim()) return { survive: { earned: value } };
    if (!s.byDate.trim()) return { survive: { byDate: value } };
    if (!s.why1.trim()) return { survive: { why1: value } };
    if (!s.why2.trim()) return { survive: { why2: value } };
    if (!s.why3.trim()) return { survive: { why3: value } };
    return null;
  }
  if (id === "demon") {
    if (!s.demon.trim()) return { survive: { demon: value } };
    if (!s.origin.trim()) return { survive: { origin: value } };
    return null;
  }
  if (id === "pace") {
    if (!hours.knock.trim()) return { profile: { knockWindow: value } };
    if (!hours.paper.trim()) return { profile: { paperWindow: value } };
    if (!hours.stop.trim()) return { profile: { hardStop: value } };
    if (!s.offBlock.trim()) return { survive: { offBlock: value } };
    if (!s.phoneDown.trim()) return { survive: { phoneDown: value } };
    return null;
  }
  if (!s.skill.trim()) return { survive: { skill: value } };
  if (!s.drill.trim()) return { survive: { drill: value } };
  return null;
}
