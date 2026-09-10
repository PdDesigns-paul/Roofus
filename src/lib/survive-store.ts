import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SurviveState = {
  earned: string;
  byDate: string;
  why1: string;
  why2: string;
  why3: string;
  demon: string;
  origin: string;
  offBlock: string;
  phoneDown: string;
  stackMonth: string;
  skill: string;
  drill: string;
  patch: (p: Partial<Omit<SurviveState, "patch">>) => void;
};

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const useSurvive = create<SurviveState>()(
  persist(
    (set) => ({
      earned: "",
      byDate: "",
      why1: "",
      why2: "",
      why3: "",
      demon: "",
      origin: "",
      offBlock: "",
      phoneDown: "",
      stackMonth: thisMonth(),
      skill: "",
      drill: "",
      patch: (p) => set(p),
    }),
    {
      name: "roofus-survive-v1",
      partialize: (s) => ({
        earned: s.earned,
        byDate: s.byDate,
        why1: s.why1,
        why2: s.why2,
        why3: s.why3,
        demon: s.demon,
        origin: s.origin,
        offBlock: s.offBlock,
        phoneDown: s.phoneDown,
        stackMonth: s.stackMonth,
        skill: s.skill,
        drill: s.drill,
      }),
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

export function paceFilled(s: SurviveState, knockWindow: string) {
  return Boolean(s.offBlock.trim() || knockWindow.trim());
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
    if (s.why1) lines.push(`Why that number: ${s.why1}`);
    if (s.why2) lines.push(`Why that matters: ${s.why2}`);
    if (s.why3) lines.push(`Why they care: ${s.why3}`);
    lines.push("On a dead day or self-doubt, send them back to this why. Do not invent a new one.");
  } else {
    lines.push("Why is blank. If the week feels heavy, open Mindset and fill Why. One question at a time.");
  }
  if (demonFilled(s)) {
    lines.push(`Demon (private): they named it “${s.demon}”. Origin they wrote: ${s.origin || "not written"}.`);
    lines.push("If they are sitting in the truck, that is the stay-in-the-truck voice. Walk through. Do not therapy-dump. Do not put this on a porch.");
  } else {
    lines.push("Demon is unnamed. Mindset walk 2 if fear is running the day.");
  }
  if (s.offBlock.trim() || s.phoneDown.trim()) {
    lines.push(`Pace: off-block ${s.offBlock || "—"}. Phone down: ${s.phoneDown || "—"}.`);
  }
  if (stackFilled(s)) {
    lines.push(`Talent stack (${s.stackMonth || "this month"}): ${s.skill}. Drill: ${s.drill || "not set"}.`);
  }
  lines.push("After Action Report is on Today. Do not duplicate it here.");
  return lines.join("\n");
}
