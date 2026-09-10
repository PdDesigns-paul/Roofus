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
