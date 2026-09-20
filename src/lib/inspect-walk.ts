import { PEST_INSPECT } from "./tenant/pest/inspect.ts";
import { ROOFUS_INSPECT } from "./tenant/roofus/inspect.ts";
import { SOLAR_INSPECT } from "./tenant/solar/inspect.ts";
import { resolvePackId, tenantEnvId } from "./tenant/resolve.ts";

export type WalkSlotId = string;

/** i35 order after photos. Good must be true. Skip theater if the field is just old. */
export const I35_SLOTS = ["Bad", "Good", "Worst", "Skip theater"] as const;

export const PRACTICE_SHOT = "/inspect-practice.png";

export type InspectWalkProgress = {
  done: Record<string, boolean>;
  checks: Record<string, boolean>;
  openSlot: string | null;
};

/** Leaf inspect rows — not the tenant barrel (that would cycle day-book ↔ survive). */
const INSPECT_BY_PACK = {
  roofus: ROOFUS_INSPECT,
  pest: PEST_INSPECT,
  solar: SOLAR_INSPECT,
} as const;

function inspectSteps() {
  const id = resolvePackId(tenantEnvId());
  return (INSPECT_BY_PACK[id] ?? ROOFUS_INSPECT).steps;
}

function slotIds(): Set<string> {
  return new Set(inspectSteps().map((s) => s.id));
}

function checkKeys(): Set<string> {
  return new Set(inspectSteps().flatMap((s) => s.checks.map((_, i) => `${s.id}-${i}`)));
}

function isSlot(id: unknown): id is string {
  return typeof id === "string" && slotIds().has(id);
}

/** One key per pack step. Old Roofus ids (street, slopes, close, witness, attic) stay in pack roofus. */
export function emptyWalk(): InspectWalkProgress {
  const done: Record<string, boolean> = {};
  for (const s of inspectSteps()) done[s.id] = false;
  return { done, checks: {}, openSlot: null };
}

/** Drop unknown slots so an old or junk blob cannot tick a station that is not on the walk. */
export function restoreWalk(raw: unknown): InspectWalkProgress {
  const base = emptyWalk();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  if (o.done && typeof o.done === "object") {
    for (const [k, v] of Object.entries(o.done as Record<string, unknown>)) {
      if (isSlot(k) && v === true) base.done[k] = true;
    }
  }
  if (o.checks && typeof o.checks === "object") {
    const allowed = checkKeys();
    for (const [k, v] of Object.entries(o.checks as Record<string, unknown>)) {
      if (allowed.has(k) && v === true) base.checks[k] = true;
    }
  }
  base.openSlot = isSlot(o.openSlot) ? o.openSlot : null;
  return base;
}

export function serializeWalk(progress: InspectWalkProgress): InspectWalkProgress {
  return restoreWalk(progress);
}

export function walkHasTicks(w: InspectWalkProgress | undefined): boolean {
  if (!w) return false;
  return Object.values(w.done).some(Boolean) || Object.values(w.checks).some(Boolean);
}
