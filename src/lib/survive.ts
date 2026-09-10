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

export function walkPrompt(id: WalkId, s: SurviveState, hours: { knock: string; paper: string; stop: string }) {
  const common =
    "Coach the Mindset page. One question at a time. Wait for my answer. Do not quote a book. Do not use any of this at a door. If I already filled a line, read it back once and go to the next blank.";
  if (id === "why") {
    return `${common}
Worksheet 1 — Why.
I have earned: ${s.earned || "(blank)"}.
By: ${s.byDate || "(blank)"}.
Why that number: ${s.why1 || "(blank)"}.
Why that matters: ${s.why2 || "(blank)"}.
Why I care that much: ${s.why3 || "(blank)"}.
Start at the first blank. Keep it short. Then tell me to type it on the Mindset page so it sticks.`;
  }
  if (id === "demon") {
    return `${common}
Worksheet 2 — Name the demon. Private.
I named it: ${s.demon || "(blank)"}.
Where it started: ${s.origin || "(blank)"}.
Start at the first blank. One word is enough for the name. Then how it shows up at a door (truck, scroll, “just one more”). Do not diagnose me.`;
  }
  if (id === "pace") {
    return `${common}
Worksheet 4 — Pace.
Knock hours on Today: ${hours.knock || "(blank)"}. Paper: ${hours.paper || "(blank)"}. Hard stop: ${hours.stop || "(blank)"}.
Off-block: ${s.offBlock || "(blank)"}.
Phone down: ${s.phoneDown || "(blank)"}.
Help me set an all-day pace, then drop one gear. One real off-block. When the phone goes down.`;
  }
  return `${common}
Worksheet 5 — Talent stack for ${s.stackMonth || "this month"}.
Skill: ${s.skill || "(blank)"}.
Drill: ${s.drill || "(blank)"}.
Pick one skill to stack this month (questions, writing, time, close). One drill I can do every day. Fundamentals, not a new job.`;
}
