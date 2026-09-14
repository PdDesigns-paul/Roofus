/** Three chat modes. Formerly rufus-modes. Old Door/Inspect/Pushback/Set hats are Roleplay beats now. */

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
    hint: "Truck only",
    use: "Why ladder, the demon, pace, talent stack. One question at a time. Private. Never a porch line. What you already wrote in Settings is his notes.",
    starters: [],
  },
];

export const ROLEPLAY_WHO = [
  { id: "busy", label: "Polite, busy", prompt: "Be a polite busy owner" },
  { id: "skeptic", label: "Three roofers already", prompt: "Be skeptical. You already had three roofers this week" },
  { id: "spouse", label: "Not the decision maker", prompt: "Be a spouse who is not the decision maker" },
] as const;

export type RoleplayWhoId = (typeof ROLEPLAY_WHO)[number]["id"];

export const ROLEPLAY_CLAIM_STAGES = [
  { id: "none", label: "Nothing filed", prompt: "Owner. Nothing filed. Curious, not desperate." },
  { id: "adjuster", label: "Adjuster been out", prompt: "Owner. Adjuster already walked it. Waiting." },
  { id: "paid", label: "They paid something", prompt: "Owner. Partial pay / scope fight." },
  { id: "denied", label: "Denied", prompt: "Owner. Carrier said no. Not asking you to flip it." },
  { id: "check", label: "Check in hand", prompt: "Owner. Check in the drawer. Wants to know what it means." },
] as const;

export type RoleplayClaimStageId = (typeof ROLEPLAY_CLAIM_STAGES)[number]["id"];
export type RoleplayPersonId = RoleplayWhoId | RoleplayClaimStageId;
