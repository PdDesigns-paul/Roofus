/** Pack `demo` — proof tenant. Not a second Roofus. Packets only. */
import type { BrandPack, PocketCard, RoleplayScene, RoleplayWho, TourStep } from "../pack.ts";
import { DEMO_INSPECT } from "./inspect.ts";

const TOUR = [
  {
    id: "you",
    title: "You",
    body: "This log is yours. Type your name and company in Setup on this page when you close this.",
  },
  {
    id: "house",
    title: "This stop",
    body: "Stand at a house. Tap Pin. Put the year and a note.",
  },
  {
    id: "door",
    title: "The pitch",
    body: "First talk is the age of the system and a free site walk. Not a storm story.",
  },
  {
    id: "dog",
    title: "The coach",
    body: "Gold button. Tap Live, Roleplay, or Mindset. Hold starts Live.",
  },
  {
    id: "age",
    title: "Year first",
    body: "Ask the year. ? in the header is how this page works.",
    sample: true,
  },
] as const satisfies readonly TourStep[];

const CARDS: PocketCard[] = [
  {
    id: "door",
    mode: "roleplay",
    scene: "walkup",
    title: "Opening",
    when: "Walk-up. Default pitch.",
    formula: "Why you stopped → system age + free walk → what year is this one?",
    lines: [
      { say: "Hey — I’m [name] with [company]. I stopped because a lot of these houses still have the original system from around [year]." },
      { say: "We’re doing free site walks this week. Do you know what year this one went in?" },
      { note: "Homeowner? If no, card for the owner. Leave." },
    ],
  },
  {
    id: "pushback",
    mode: "roleplay",
    scene: "push",
    title: "Pushback",
    when: "They push. Restate first.",
    formula: "Restate → one honest beat → one question that books a next look",
    lines: [
      { say: "Got it — you weren’t looking to do anything this week." },
      { say: "Would a 10-minute walk this afternoon or [day] morning be easier?" },
    ],
  },
  {
    id: "after",
    mode: "roleplay",
    scene: "after",
    title: "After the walk",
    when: "Site walk is done. Talk only.",
    formula: "What they saw → how it sits → what they want to do",
    lines: [
      { say: "You saw the wear on the south row. How long has that been like that?" },
      { say: "What would you like to do about it?" },
      { note: "Never WHY in the house. Do not invent a number." },
    ],
  },
  {
    id: "set",
    mode: "roleplay",
    scene: "set",
    title: "The set",
    when: "Book the next look.",
    formula: "Paper in hand → both names → [day] morning or afternoon",
    lines: [
      { say: "I’ll put you down for [day] afternoon. Who else needs to see a number?" },
    ],
  },
  {
    id: "compass",
    mode: "mindset",
    title: "Compass",
    when: "Off the porch.",
    formula: "Why this work → who it is for → one drill",
    lines: [
      { note: "Private. Never a porch line." },
      { note: "Three business days to cancel (FTC 429). Hand the shop’s form. Never coach a waiver." },
      { note: "Never the utility. Credit, tariff, and kWh live in the shop packet." },
    ],
  },
];

const SCENES: RoleplayScene[] = [
  {
    id: "walkup",
    label: "Walk-up",
    hint: "First 30 seconds",
    knockLine: "[who]. Walk-up. I start.",
    brief: `Beat: WALK-UP. First 30 seconds. Age of the system and a free site walk. Do not invent weather. Stay the homeowner. Short.`,
  },
  {
    id: "push",
    label: "They push",
    hint: "Objections",
    knockLine: "[who]. They already pushed back. I keep going.",
    brief: `Beat: THEY PUSH. Restate first. Do not drop price on the porch. End at a next look or a name on a no.`,
  },
  {
    id: "after",
    label: "After the walk",
    hint: "Talk only",
    knockLine: "[who]. Site walk is done. I start the talk. No pictures in this chat.",
    brief: `Beat: AFTER THE WALK. Talk only. What they saw, how it sits, what they want to do. Never WHY in the house.`,
  },
  {
    id: "set",
    label: "The set",
    hint: "Book it",
    knockLine: "[who]. I book the next look.",
    brief: `Beat: THE SET. Both names. [day] morning or afternoon. Paper. Not a porch signature.`,
  },
  {
    id: "visit",
    label: "Whole visit",
    hint: "Opening through set",
    knockLine: "[who]. Whole visit. I start.",
    brief: `Beat: WHOLE VISIT. Opening → walk → talk → options → set. Stay the homeowner until Score me.`,
  },
];

const WHO: RoleplayWho[] = [
  { id: "busy", label: "Busy", prompt: "Be a polite busy owner" },
  { id: "spouse", label: "Not alone", prompt: "Be the spouse — you decide together" },
  { id: "skeptic", label: "Skeptic", prompt: "Be skeptical. You have heard pitches." },
];

export { DEMO_INSPECT };

export const DEMO_PACK = {
  id: "demo",
  productName: "Stride",
  talkName: "Stride",
  places: { today: "Today", door: "Pitch", inspect: "Site", plan: "Route" },
  markSrc: "/favicon.png",
  pwa: { name: "Stride", themeColor: "#123c2e" },
  tokens: {
    accent: "#2f6f4e",
    paper: "#f3f1ea",
    displayFont: '"Fraunces", ui-serif, Georgia, serif',
    goldHi: "#b7e0c4",
    goldCoin: "#3f8f62",
    goldMid: "#2f6f4e",
    goldLo: "#1c4631",
  },
  copy: {
    askHowTodayWent: "Ask Stride how today went",
    askTalk: "Ask Stride",
    talkAria: "Talk to Stride",
    tour: TOUR,
    todayFallback: "Ask the year.",
  },
  modules: { storms: false, claim: false, internachi: false, packets: true },
  cards: CARDS,
  scenes: SCENES,
  who: WHO,
  claimStages: [] as RoleplayWho[],
  briefs: {
    live: `Mode: LIVE. Ride-along. Real door, real day. You are not the homeowner. Default pitch is system age and a free site walk. Do not invent weather. Photos go to the Site page. After Action Report writes on Route.`,
    roleplay: `Mode: ROLEPLAY. You are the homeowner until they tap Score me or type score me / break. Stay in character. Short. After score me: keep / cut / say instead, one better sentence, then wait. Never ask them to record a customer.`,
    mindset: `Mode: MINDSET. Off the porch. Never a porch line. One question at a time.`,
    setup: `Mode: SETUP. Filling THEIR book. One question at a time. Do not invent a county, a company, or a URL.`,
    claimCold: `Beat opened cold. Stay on age / retail. Do not invent weather.`,
  },
  starters: {
    live: [
      "Give me the opening. Age of the system and a free walk. No fake weather.",
      "Door is half closed. 2011 system. Cut to the chase.",
      "How many more stops today?",
    ],
    roleplay: [],
    mindset: [],
  },
  promptModules: `# Porch doctrine (pack demo)
They canvass solar and home-energy doors. You ride shotgun.

- Owner-pay houses. Ask the year of the system in front of them. Do not invent a year.
- Default pitch = age of the system and a free site walk. Do not invent weather. Do not invent a neighbor.
- Enroll, don’t hunt. One open question. Present only to that.
- After the walk: what they saw, how it sits, what they want to do. Never WHY in the house.
- No high-pressure one-call close. Goal: conversation → walk → set → a name even on a no.
- Honesty. Never coach deception.

# Pack chrome
**Live** — Opening is age + free walk. Photos go to the Site page.
**Pitch cards** — Opening, Pushback, After the walk, The set, Compass.
**Site** — Curb, Array, Inverter, Access. Then This shot. Do not invent a count.
**Route / Today** — Do not invent weather.
`,
  help: {
    door: [
      "Five pocket cards on this tab. Each has a formula: hook, honest reason, one open question. Opening is the default pitch. Pushback restates first. After the walk is talk only. The set books a time. Compass stays here — read it off the porch.",
      "Hear this line speaks the filled SAY. Ask Stride opens Roleplay on that beat. This is not Reference.",
    ],
    inspect: [
      "Two jobs. Walk this house: Curb, Array, Inverter, Access — tap a row for what to shoot. Ticks hang on the open pin. Reset clears that house. Not a report.",
      "This shot: Camera, Photos, or Practice. Ask what you’re looking at. Practice is not this house.",
    ],
    coach: [
      "Tap the orange button to pick a mode. Live, Roleplay, Mindset. Hold starts Live.",
      "Roleplay: pick a beat, who they are, then start. Score me grades it. Practice only — do not record a homeowner.",
      "Mindset is off the porch. Camera is the Site page.",
    ],
  },
  labor: {
    units: [
      { key: "knocks", label: "Stops", hint: "I stopped" },
      { key: "talks", label: "Talks", hint: "Someone answered" },
      { key: "looks", label: "Surveys", hint: "I walked the site" },
      { key: "sets", label: "Sets", hint: "On the calendar" },
    ],
  },
  inspect: DEMO_INSPECT,
} as const satisfies BrandPack;
