export const WALK_SLOTS = [
  {
    id: "street",
    title: "Street",
    hint: "Mailbox and the house. Prove which one.",
  },
  {
    id: "slopes",
    title: "Four slopes",
    hint: "All four. Same height, same light if you can.",
  },
  {
    id: "close",
    title: "Close-up",
    hint: "The thing. Bruise, crease, kickout, boot.",
  },
  {
    id: "witness",
    title: "Witnesses",
    hint: "Soft copper, AC fins, plastic vents.",
  },
  {
    id: "attic",
    title: "Attic",
    hint: "If you can get in. Stains, daylight, wet deck.",
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
