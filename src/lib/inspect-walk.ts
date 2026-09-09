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

export const ASK_STARTERS = [
  "What's this type of roof called again?",
  "Does this look like hail or old lichen?",
  "What am I looking at?",
];
