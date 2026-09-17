/** Three chat modes. Formerly rufus-modes. Old Door/Inspect/Pushback/Set hats are Roleplay beats now. */

import {
  CLAIM_COLD_BRIEF,
  LIVE_BRIEF,
  MINDSET_BRIEF,
  ROLEPLAY_BRIEF,
  SETUP_BRIEF,
} from "./coach-briefs.ts";
import { ROLEPLAY_SCENES } from "./roleplay-scenes.ts";

export type CoachMode = "live" | "roleplay" | "mindset";

export type RoleplaySceneId = "walkup" | "claim" | "push" | "after" | "walk" | "set" | "phone" | "visit";

export type CoachModeMeta = {
  id: CoachMode;
  label: string;
  hint: string;
  use: string;
  starters: string[];
};

export const COACH_MODES: CoachModeMeta[] = [
  {
    id: "live",
    label: "Live",
    hint: "Ride-along",
    use: "Real door, real day. Next line, morale, policy, how many more. He is not the homeowner. Photos go to Roof. Why-walks go to Mindset.",
    starters: [
      "Give me the million-dollar door script. Age and a free look. No fake storm.",
      "Door is half closed. 2004 roof. Cut to the chase.",
      "They asked if we are selling something.",
      "How many more doors today?",
      "They just asked about insurance. What's our policy?",
    ],
  },
  {
    id: "roleplay",
    label: "Roleplay",
    hint: "You be them",
    use: "Practice. Pick a beat, then knock. Hold the mic or type it. He stays the homeowner. Score me after. Truck or the parking lot. Do not record a customer.",
    starters: [],
  },
  {
    id: "mindset",
    label: "Mindset",
    hint: "Off the porch",
    use: "Why ladder, the demon, pace, talent stack. One question at a time. Private. Never a porch line. What you already wrote in Settings is his notes.",
    starters: [],
  },
];

export { ROLEPLAY_SCENES };

export const ROLEPLAY_WHO = [
  { id: "busy", label: "Polite, busy", prompt: "Be a polite busy owner" },
  { id: "skeptic", label: "Three roofers already", prompt: "Be skeptical. You already had three roofers this week" },
  { id: "spouse", label: "Not the decision maker", prompt: "Be a spouse who is not the decision maker" },
] as const;

export type RoleplayWhoCore = (typeof ROLEPLAY_WHO)[number]["id"];

export const ROLEPLAY_CLAIM_STAGES = [
  { id: "none", label: "Nothing filed", prompt: "Owner. Nothing filed. Curious, not desperate." },
  { id: "adjuster", label: "Adjuster been out", prompt: "Owner. Adjuster already walked it. Waiting." },
  { id: "paid", label: "They paid something", prompt: "Owner. Partial pay / scope fight." },
  { id: "denied", label: "Denied", prompt: "Owner. Carrier said no. Not asking you to flip it." },
  { id: "check", label: "Check in hand", prompt: "Owner. Check in the drawer. Wants to know what it means." },
] as const;

export type RoleplayClaimStageId = (typeof ROLEPLAY_CLAIM_STAGES)[number]["id"];
export type RoleplayPersonId = RoleplayWhoCore | RoleplayClaimStageId;
export type RoleplayWhoId = RoleplayPersonId;

export function hatToMode(id: string | null | undefined): CoachMode {
  if (id === "roleplay" || id === "score") return "roleplay";
  if (id === "mindset") return "mindset";
  return "live";
}

export function normalizeMode(id: string | null | undefined): CoachMode {
  if (id === "live" || id === "roleplay" || id === "mindset") return id;
  return hatToMode(id);
}

export function normalizeScene(id: string | null | undefined): RoleplaySceneId {
  if (
    id === "walkup" ||
    id === "claim" ||
    id === "push" ||
    id === "after" ||
    id === "walk" ||
    id === "set" ||
    id === "phone" ||
    id === "visit"
  ) {
    return id;
  }
  return "walkup";
}

export function normalizeWho(id: string | null | undefined): RoleplayWhoId {
  if (id === "busy" || id === "skeptic" || id === "spouse") return id;
  if (id === "none" || id === "adjuster" || id === "paid" || id === "denied" || id === "check") return id;
  return "busy";
}

export function normalizeClaimStage(id: string | null | undefined): RoleplayClaimStageId {
  if (id === "none" || id === "adjuster" || id === "paid" || id === "denied" || id === "check") return id;
  return "none";
}

export function isClaimStage(id: string | null | undefined): id is RoleplayClaimStageId {
  return id === "none" || id === "adjuster" || id === "paid" || id === "denied" || id === "check";
}

export function normalizePerson(id: string | null | undefined): RoleplayPersonId {
  if (isClaimStage(id)) return id;
  return normalizeWho(id);
}

export function personForScene(scene: string | null | undefined, who: string | null | undefined): RoleplayPersonId {
  if (normalizeScene(scene) === "claim") return normalizeClaimStage(who);
  return isClaimStage(who) ? "busy" : normalizeWho(who);
}

export function claimUnlocked(keptStorms: unknown): boolean {
  if (Array.isArray(keptStorms)) return keptStorms.length > 0;
  if (typeof keptStorms === "number") return keptStorms > 0;
  return Boolean(keptStorms);
}

export function modeById(id: string | null | undefined): CoachModeMeta {
  const want = normalizeMode(id);
  return COACH_MODES.find((m) => m.id === want) ?? COACH_MODES[0];
}

export function sceneById(id: string | null | undefined) {
  const want = normalizeScene(id);
  return ROLEPLAY_SCENES.find((s) => s.id === want) ?? ROLEPLAY_SCENES[0];
}

export function whoById(id: string | null | undefined) {
  const want = normalizeWho(id);
  return ROLEPLAY_WHO.find((w) => w.id === want) ?? ROLEPLAY_WHO[0];
}

export function claimStageById(id: string | null | undefined) {
  const want = normalizeClaimStage(id);
  return ROLEPLAY_CLAIM_STAGES.find((s) => s.id === want) ?? ROLEPLAY_CLAIM_STAGES[0];
}

export function modeOrigin(mode: CoachMode): "porch" | "mindset" {
  return mode === "mindset" ? "mindset" : "porch";
}

export function modeBrief(
  mode: string | null | undefined,
  scene?: string | null,
  who?: string | null,
  year?: string | null,
  origin?: string | null,
  kept?: boolean,
): string {
  if (origin === "setup") return SETUP_BRIEF;
  const m = normalizeMode(mode);
  if (m === "live") return LIVE_BRIEF;
  if (m === "mindset") return MINDSET_BRIEF;
  const s = sceneById(scene);
  const y = year?.trim();
  const person = s.id === "claim" ? claimStageById(who) : whoById(who);
  const whoLine = y ? `You are: ${person.prompt} with a ${y} roof.` : `You are: ${person.prompt}.`;
  const sceneBrief = s.id === "claim" && kept === false ? CLAIM_COLD_BRIEF : s.brief;
  return `${ROLEPLAY_BRIEF}\n\n${whoLine}\n\n${sceneBrief}`;
}

export function roleplayKnockLine(
  who: RoleplayPersonId,
  year: string,
  scene: RoleplaySceneId = "walkup",
): string {
  const y = year.trim();
  if (scene === "claim") {
    const st = claimStageById(who);
    const whoBit = y ? `${st.prompt} with a ${y} roof` : st.prompt;
    return `${whoBit} Kept storm on this zip. I ask the claim-stage question.`;
  }
  const w = whoById(who);
  const whoBit = y ? `${w.prompt} with a ${y} roof` : w.prompt;
  if (scene === "push") return `${whoBit}. They already pushed back. I keep going.`;
  if (scene === "after") {
    return `${whoBit}. Look is done. I already showed them photos. I start i35. No pictures in this chat.`;
  }
  if (scene === "walk") return `${whoBit}. Look is done. We walk the house. I ask buying questions.`;
  if (scene === "set") return `${whoBit}. Look is done. I am setting morning or afternoon.`;
  if (scene === "phone") {
    return `${whoBit}. Photos already happened. This is the 20–30 min phone review. I answer the phone.`;
  }
  if (scene === "visit") return `${whoBit}. Whole visit from the knock. I knock.`;
  return `${whoBit}. Walk-up. I knock.`;
}

export type ThreadTag = {
  id: "live" | "roleplay" | "mindset" | "inspect" | "help" | "setup";
  label: string;
  className: string;
};

export function threadTag(input: { origin?: string; mode?: string; hat?: string }): ThreadTag {
  if (input.origin === "setup") {
    return { id: "setup", label: "Setup", className: "border border-accent text-accent" };
  }
  if (input.origin === "inspect") {
    return { id: "inspect", label: "Roof", className: "border border-border bg-surface text-muted" };
  }
  if (input.origin === "help") {
    return { id: "help", label: "Help", className: "text-faint" };
  }
  const mode = normalizeMode(input.mode ?? input.hat);
  if (mode === "roleplay") {
    return { id: "roleplay", label: "Roleplay", className: "bg-fg text-paper" };
  }
  if (mode === "mindset") {
    return { id: "mindset", label: "Mindset", className: "bg-surface-2 text-fg" };
  }
  return { id: "live", label: "Live", className: "bg-accent text-paper" };
}

export function cardAsk(cardId: "door" | "claim" | "pushback" | "i35" | "set" | "compass"): {
  mode: CoachMode;
  scene?: RoleplaySceneId;
} {
  if (cardId === "compass") return { mode: "mindset" };
  if (cardId === "claim") return { mode: "roleplay", scene: "claim" };
  if (cardId === "pushback") return { mode: "roleplay", scene: "push" };
  if (cardId === "i35") return { mode: "roleplay", scene: "after" };
  if (cardId === "set") return { mode: "roleplay", scene: "set" };
  return { mode: "roleplay", scene: "walkup" };
}
