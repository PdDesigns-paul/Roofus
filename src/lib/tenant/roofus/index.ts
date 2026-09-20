import type { BrandPack, TourStep } from "../pack.ts";
import { ROOFUS_BRIEFS, ROOFUS_STARTERS } from "./briefs.ts";
import { ROOFUS_CARDS, ROOFUS_CLAIM_CARD } from "./cards.ts";
import { ROOFUS_HELP } from "./help.ts";
import { ROOFUS_PROMPT_MODULES } from "./prompt.ts";
import { ROOFUS_CLAIM_STAGES, ROOFUS_SCENES, ROOFUS_WHO } from "./scenes.ts";

/** Pack `roofus` must pixel-match the live phone. Do not restyle the dog. */

export const ROOFUS_TOUR = [
  {
    id: "you",
    title: "You",
    body: "This log is yours. Type your name and company in Setup on this page when you close this.",
  },
  {
    id: "house",
    title: "This house",
    body: "Stand at a house. Tap Pin. Put the year and a note.",
  },
  {
    id: "door",
    title: "The door",
    body: "First knock is the age of the roof and a free look. Not a storm story unless you kept one.",
  },
  {
    id: "dog",
    title: "The dog",
    body: "Gold button. Tap Live, Roleplay, or Mindset. Hold starts Live.",
  },
  {
    id: "age",
    title: "Age first",
    body: "Name weather only if you kept it. ? in the header is how this page works.",
    sample: true,
  },
] as const satisfies readonly TourStep[];

export const ROOFUS_PACK = {
  id: "roofus",
  productName: "Roofus",
  talkName: "Roofus",
  places: { today: "Today", door: "Door", inspect: "Roof", plan: "Plan" },
  markSrc: "/roofus.png",
  pwa: { name: "Roofus", themeColor: "#0c0c0d" },
  tokens: {
    accent: "#c28d32",
    paper: "#f3efe4",
    displayFont: '"Fraunces", ui-serif, Georgia, serif',
    goldHi: "#ffd78f",
    goldCoin: "#e0a030",
    goldMid: "#c28d32",
    goldLo: "#8c5e27",
  },
  copy: {
    askHowTodayWent: "Ask Roofus how today went",
    askTalk: "Ask Roofus",
    talkAria: "Talk to Roofus",
    tour: ROOFUS_TOUR,
  },
  modules: { claim: true },
  cards: ROOFUS_CARDS,
  claimCard: ROOFUS_CLAIM_CARD,
  scenes: ROOFUS_SCENES,
  who: ROOFUS_WHO,
  claimStages: ROOFUS_CLAIM_STAGES,
  briefs: ROOFUS_BRIEFS,
  starters: ROOFUS_STARTERS,
  promptModules: ROOFUS_PROMPT_MODULES,
  help: ROOFUS_HELP,
  labor: {
    units: [
      { key: "knocks", label: "Doors", hint: "I knocked" },
      { key: "talks", label: "Talked", hint: "Someone answered" },
      { key: "looks", label: "On the roof", hint: "I went up" },
      { key: "sets", label: "Appointments", hint: "On the calendar" },
    ],
  },
} as const satisfies BrandPack;
