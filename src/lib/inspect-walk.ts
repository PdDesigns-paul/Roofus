export const WALK_SLOTS = [
  {
    id: "street",
    title: "Street",
    hint: "Mailbox and the house. Prove which one.",
    blurb: "One frame that proves this house, not the neighbor.",
    checks: ["House number or mailbox", "Full front elevation", "Street sign if you can"],
  },
  {
    id: "slopes",
    title: "Four slopes",
    hint: "All four. Same height, same light if you can.",
    blurb: "Walk the box. Same height. Same light.",
    checks: ["Front", "Back", "Left", "Right"],
  },
  {
    id: "close",
    title: "Close-up",
    hint: "The thing. Bruise, crease, kickout, boot.",
    blurb: "The defect, filling the frame.",
    checks: ["The bruise or crease", "A boot or kickout", "Granules / tabs around it"],
  },
  {
    id: "witness",
    title: "Witnesses",
    hint: "Soft copper, AC fins, plastic vents.",
    blurb: "Soft metal and plastic that keep a date.",
    checks: ["AC fins", "Copper or aluminum", "Plastic vents or screens"],
  },
  {
    id: "attic",
    title: "Attic",
    hint: "If you can get in. Stains, daylight, wet deck.",
    blurb: "Only if you can get in. Skip is fine.",
    checks: ["Sheathing stains", "Daylight through the deck", "Wet or packed insulation"],
  },
] as const;

export type WalkSlotId = (typeof WALK_SLOTS)[number]["id"];

/** i35 order after photos. Good must be true. Skip theater if the field is just old. */
export const I35_SLOTS = ["Bad", "Good", "Worst", "Skip theater"] as const;

export const ASK_STARTERS = [
  "What am I looking at?",
  "Is this my worst photo?",
  "What do I say about this?",
];

export const PRACTICE_SHOT = "/inspect-practice.png";

export type InspectWalkProgress = {
  done: Partial<Record<WalkSlotId, boolean>>;
  checks: Partial<Record<string, boolean>>;
  openSlot: WalkSlotId | null;
};

const SLOT_IDS = new Set<string>(WALK_SLOTS.map((s) => s.id));
const CHECK_KEYS = new Set(WALK_SLOTS.flatMap((s) => s.checks.map((_, i) => `${s.id}-${i}`)));

function isSlot(id: unknown): id is WalkSlotId {
  return typeof id === "string" && SLOT_IDS.has(id);
}

export function emptyWalk(): InspectWalkProgress {
  return { done: {}, checks: {}, openSlot: null };
}

/** Drop unknown slots so an old or junk blob cannot tick a station that is not on the walk. */
export function restoreWalk(raw: unknown): InspectWalkProgress {
  if (!raw || typeof raw !== "object") return emptyWalk();
  const o = raw as Record<string, unknown>;
  const done: InspectWalkProgress["done"] = {};
  if (o.done && typeof o.done === "object") {
    for (const [k, v] of Object.entries(o.done as Record<string, unknown>)) {
      if (isSlot(k) && v === true) done[k] = true;
    }
  }
  const checks: InspectWalkProgress["checks"] = {};
  if (o.checks && typeof o.checks === "object") {
    for (const [k, v] of Object.entries(o.checks as Record<string, unknown>)) {
      if (CHECK_KEYS.has(k) && v === true) checks[k] = true;
    }
  }
  return {
    done,
    checks,
    openSlot: isSlot(o.openSlot) ? o.openSlot : null,
  };
}

export function serializeWalk(progress: InspectWalkProgress): InspectWalkProgress {
  return restoreWalk(progress);
}

