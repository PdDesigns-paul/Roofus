/** Pack `roofus` inspect walk. Kernel Place stays Inspect; these rows are data. */

export const ROOFUS_INSPECT_STEPS = [
  {
    id: "street",
    title: "Street",
    hint: "Mailbox and the house. Prove which one.",
    askPrompt: "What am I looking at?",
    blurb: "One frame that proves this house, not the neighbor.",
    checks: ["House number or mailbox", "Full front elevation", "Street sign if you can"],
  },
  {
    id: "slopes",
    title: "Four slopes",
    hint: "All four. Same height, same light if you can.",
    askPrompt: "Did I get all four?",
    blurb: "Walk the box. Same height. Same light.",
    checks: ["Front", "Back", "Left", "Right"],
  },
  {
    id: "close",
    title: "Close-up",
    hint: "The thing. Bruise, crease, kickout, boot.",
    askPrompt: "Is this my worst photo?",
    blurb: "The defect, filling the frame.",
    checks: ["The bruise or crease", "A boot or kickout", "Granules / tabs around it"],
  },
  {
    id: "witness",
    title: "Witnesses",
    hint: "Soft copper, AC fins, plastic vents.",
    askPrompt: "What does this date?",
    blurb: "Soft metal and plastic that keep a date.",
    checks: ["AC fins", "Copper or aluminum", "Plastic vents or screens"],
  },
  {
    id: "attic",
    title: "Attic",
    hint: "If you can get in. Stains, daylight, wet deck.",
    askPrompt: "What do I say about this?",
    blurb: "Only if you can get in. Skip is fine.",
    checks: ["Sheathing stains", "Daylight through the deck", "Wet or packed insulation"],
  },
] as const;

export const ROOFUS_ASK_STARTERS = [
  "What am I looking at?",
  "Is this my worst photo?",
  "What do I say about this?",
] as const;

export const ROOFUS_INSPECT = {
  steps: ROOFUS_INSPECT_STEPS,
  askStarters: ROOFUS_ASK_STARTERS,
  cameraTip: "Take a photo on the roof",
  practiceTip: "A close-up off the roof. Ask him the i35 slot.",
  reportName: "CompanyCam",
} as const;
