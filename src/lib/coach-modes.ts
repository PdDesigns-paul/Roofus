/** Three chat modes. Beats, who-chips, and starters load from the tenant pack. */

import { pack } from "./tenant/index.ts";
import type { RoleplayScene, RoleplayWho } from "./tenant/pack.ts";

export type CoachMode = "live" | "roleplay" | "mindset";

export type RoleplaySceneId = string;
export type RoleplayWhoCore = string;
export type RoleplayClaimStageId = string;
export type RoleplayPersonId = string;
export type RoleplayWhoId = RoleplayPersonId;

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
    use: `Real door, real day. Next line, morale, policy, how many more. He is not the homeowner. Photos go to ${pack.places.inspect}. Why-walks go to Mindset.`,
    starters: [...pack.starters.live],
  },
  {
    id: "roleplay",
    label: "Roleplay",
    hint: "You be them",
    use: "Practice. Pick a beat, then knock. Hold the mic or type it. He stays the homeowner. Score me after. Truck or the parking lot. Do not record a customer.",
    starters: [...pack.starters.roleplay],
  },
  {
    id: "mindset",
    label: "Mindset",
    hint: "Off the porch",
    use: "Why ladder, the demon, pace, talent stack. One question at a time. Private. Never a porch line. What you already wrote in Settings is his notes.",
    starters: [...pack.starters.mindset],
  },
];

export const ROLEPLAY_SCENES: readonly RoleplayScene[] = pack.scenes;
export const ROLEPLAY_WHO: readonly RoleplayWho[] = pack.who;
export const ROLEPLAY_CLAIM_STAGES: readonly RoleplayWho[] = pack.claimStages;

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
  if (id && pack.scenes.some((s) => s.id === id)) return id;
  return pack.scenes[0]?.id ?? "walkup";
}

export function isClaimScene(id: string | null | undefined): boolean {
  return Boolean(pack.modules.claim && pack.scenes.find((s) => s.id === id)?.claim);
}

export function isClaimStage(id: string | null | undefined): boolean {
  return Boolean(id && pack.claimStages.some((s) => s.id === id));
}

export function normalizeWho(id: string | null | undefined): RoleplayWhoId {
  if (id && pack.who.some((w) => w.id === id)) return id;
  if (isClaimStage(id) && id) return id;
  return pack.who[0]?.id ?? "busy";
}

export function normalizeClaimStage(id: string | null | undefined): RoleplayClaimStageId {
  if (id && pack.claimStages.some((s) => s.id === id)) return id;
  return pack.claimStages[0]?.id ?? "none";
}

export function normalizePerson(id: string | null | undefined): RoleplayPersonId {
  if (isClaimStage(id) && id) return id;
  return normalizeWho(id);
}

export function personForScene(scene: string | null | undefined, who: string | null | undefined): RoleplayPersonId {
  if (isClaimScene(scene)) return normalizeClaimStage(who);
  return isClaimStage(who) ? (pack.who[0]?.id ?? "busy") : normalizeWho(who);
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
  return pack.scenes.find((s) => s.id === want) ?? pack.scenes[0];
}

export function whoById(id: string | null | undefined) {
  const want = normalizeWho(id);
  return pack.who.find((w) => w.id === want) ?? pack.who[0];
}

export function claimStageById(id: string | null | undefined) {
  const want = normalizeClaimStage(id);
  return pack.claimStages.find((s) => s.id === want) ?? pack.claimStages[0];
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
  if (origin === "setup") return pack.briefs.setup;
  const m = normalizeMode(mode);
  if (m === "live") return pack.briefs.live;
  if (m === "mindset") return pack.briefs.mindset;
  const s = sceneById(scene);
  const y = year?.trim();
  const person = s?.claim ? claimStageById(who) : whoById(who);
  const prompt = person?.prompt ?? "Be a polite busy owner";
  const whoLine = y ? `You are: ${prompt} with a ${y} roof.` : `You are: ${prompt}.`;
  const sceneBrief = s?.claim && kept === false ? pack.briefs.claimCold : (s?.brief ?? "");
  return `${pack.briefs.roleplay}\n\n${whoLine}\n\n${sceneBrief}`;
}

export function roleplayKnockLine(
  who: RoleplayPersonId,
  year: string,
  scene: RoleplaySceneId = pack.scenes[0]?.id ?? "walkup",
): string {
  const y = year.trim();
  const s = sceneById(scene);
  const person = s?.claim ? claimStageById(who) : whoById(who);
  const prompt = person?.prompt ?? "Be a polite busy owner";
  const whoBit = y ? `${prompt} with a ${y} roof` : prompt;
  return (s?.knockLine ?? "[who]. I knock.").replaceAll("[who]", whoBit);
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
    return { id: "inspect", label: pack.places.inspect, className: "border border-border bg-surface text-muted" };
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

export function cardAsk(cardId: string): {
  mode: CoachMode;
  scene?: RoleplaySceneId;
} {
  const card =
    pack.cards.find((c) => c.id === cardId) ?? (pack.claimCard?.id === cardId ? pack.claimCard : undefined);
  if (!card) return { mode: "roleplay", scene: pack.scenes[0]?.id };
  return card.scene ? { mode: card.mode, scene: card.scene } : { mode: card.mode };
}
