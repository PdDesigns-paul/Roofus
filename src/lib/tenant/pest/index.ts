/** Pack `pest` — proof tenant. Not a second Roofus. Packets, not chemicals. */
import type { BrandPack, PocketCard, RoleplayScene, RoleplayWho, TourStep } from "../pack.ts";
import { PEST_INSPECT } from "./inspect.ts";

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
    body: "Already on this block. Ask to walk the foundation. Not a storm story.",
  },
  {
    id: "dog",
    title: "The coach",
    body: "Gold button. Tap Live, Roleplay, or Mindset. Hold starts Live.",
  },
  {
    id: "age",
    title: "The walk",
    body: "Walk the foundation. ? in the header is how this page works.",
    sample: true,
  },
] as const satisfies readonly TourStep[];

const CARDS: PocketCard[] = [
  {
    id: "door",
    mode: "roleplay",
    scene: "walkup",
    title: "Opening",
    when: "Already on this block. Not a storm.",
    formula: "Who I am → I walk foundations on this block → may I walk yours?",
    lines: [
      {
        say: "Hey — I’m [name] with [company]. I’m already on this block walking foundations and eaves.",
      },
      {
        say: "I’m not selling a spray on the porch. I’m asking to walk the outside with you. All right if I start at the corner?",
      },
      { note: "Homeowner? If no, card for the owner. Leave. Do not invent a neighbor on this street." },
    ],
  },
  {
    id: "pushback",
    mode: "roleplay",
    scene: "push",
    title: "Pushback",
    when: "They push. Restate first.",
    formula: "Restate → one honest beat → next look or a name on a no",
    lines: [
      { note: "Not interested — Got it. Card for when something shows. Name even on a no." },
      { note: "Spouse — Who else has to see a start date?" },
      { note: "Already quarterly — Keep them. What is covered vs add-on is a shop question, not a porch fight." },
      { note: "No bugs right now — Prevention is the walk. Ask to look at mulch and the garage gap anyway." },
      { note: "Price — Restate. Do not drop a number you do not have. Point at the shop packet." },
      { note: "Leave a card — Leave the card. Do not linger." },
    ],
  },
  {
    id: "after",
    mode: "roleplay",
    scene: "after",
    title: "Site walk",
    when: "Walk is done. Talk only.",
    formula: "What they saw → how it sits → what they want to do",
    lines: [
      { say: "You saw the gap at the garage and the mulch against the siding. How long has that been like that?" },
      { say: "What would you like to do about it?" },
      { note: "Never WHY in the house. Never name a chemical. Pet / kid questions → shop packet." },
    ],
  },
  {
    id: "set",
    mode: "roleplay",
    scene: "set",
    title: "The start",
    when: "Book the first service, not a porch signature.",
    formula: "Both names → [day] morning or afternoon → cooling-off out loud",
    lines: [
      {
        say: "I’ll put a start on [day] afternoon. Who else needs to be home — interior vs exterior is a shop call.",
      },
      { note: "Compass: three business days to cancel. Hand the shop’s form. Never coach a waiver." },
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
      { note: "Ask the shop for the label / license. Pet and kid notes live in the packet, not in your head." },
    ],
  },
];

const SCENES: RoleplayScene[] = [
  {
    id: "walkup",
    label: "Walk-up",
    hint: "First 30 seconds",
    knockLine: "[who]. Walk-up. I start.",
    brief: `Beat: WALK-UP. Already on this block. Walk the foundation. Do not invent a neighbor. Stay the homeowner. Short.`,
  },
  {
    id: "push",
    label: "They push",
    hint: "Objections",
    knockLine: "[who]. They already pushed back. I keep going.",
    brief: `Beat: THEY PUSH. Restate first. Do not drop a number you do not have. End at a walk or a name on a no. Honest exit.`,
  },
  {
    id: "after",
    label: "Site walk",
    hint: "Talk only",
    knockLine: "[who]. Site walk is done. I start the talk. No pictures in this chat.",
    brief: `Beat: SITE WALK. Talk only. What they saw, how it sits, what they want to do. Never WHY in the house. Never name a chemical.`,
  },
  {
    id: "set",
    label: "The start",
    hint: "Book it",
    knockLine: "[who]. I book the first service.",
    brief: `Beat: THE START. Both names. [day] morning or afternoon. Cooling-off out loud. Not a porch signature.`,
  },
  {
    id: "visit",
    label: "Whole visit",
    hint: "Opening through start",
    knockLine: "[who]. Whole visit. I start.",
    brief: `Beat: WHOLE VISIT. Opening → foundation walk → talk → start. No chemical. No fake neighbor. Stay the homeowner until Score me.`,
  },
];

const WHO: RoleplayWho[] = [
  { id: "busy", label: "Busy", prompt: "Be a polite busy owner. Door is already closing." },
  { id: "spouse", label: "Not alone", prompt: "Be the spouse — you decide together. The other person is not here." },
  { id: "skeptic", label: "Skeptic", prompt: "Be skeptical. You have heard pitches." },
  { id: "nope", label: "Not interested", prompt: "You are not interested. You will take a card. You will not walk today." },
  {
    id: "quarterly",
    label: "Already covered",
    prompt: "You already have a quarterly. You are not switching on the porch.",
  },
  { id: "nobugs", label: "No bugs now", prompt: "You have not seen anything. You do not want a spray today." },
  { id: "price", label: "Price first", prompt: "You want the number before a walk. You will not give a card if they push." },
  { id: "card", label: "Leave a card", prompt: "You will take a card. You will not linger. You will not walk today." },
];

export { PEST_INSPECT };

export const PEST_PACK = {
  id: "pest",
  productName: "Stoop",
  talkName: "Stoop",
  places: { today: "Today", door: "Pitch", inspect: "Site", plan: "Route" },
  markSrc: "/favicon.png",
  pwa: { name: "Stoop", themeColor: "#2a1610" },
  tokens: {
    accent: "#9a4d2e",
    paper: "#f4efe8",
    displayFont: '"Fraunces", ui-serif, Georgia, serif',
    goldHi: "#e8c4a4",
    goldCoin: "#c47a4a",
    goldMid: "#9a4d2e",
    goldLo: "#5a2e1c",
  },
  copy: {
    askHowTodayWent: "Ask Stoop how today went",
    askTalk: "Ask Stoop",
    talkAria: "Talk to Stoop",
    tour: TOUR,
    todayFallback: "Walk the foundation.",
  },
  modules: { storms: false, claim: false, internachi: false, packets: true },
  cards: CARDS,
  scenes: SCENES,
  who: WHO,
  claimStages: [] as RoleplayWho[],
  briefs: {
    live: `Mode: LIVE. Ride-along. Real door, real day. You are not the homeowner. Default pitch is already on this block — walk the foundation. Do not invent a neighbor. Photos go to the Site page. After Action Report writes on Route.`,
    roleplay: `Mode: ROLEPLAY. You are the homeowner until they tap Score me or type score me / break. Stay in character. Short. After score me: keep / cut / say instead, one better sentence, then wait. Never ask them to record a customer. Honest exit on a no.`,
    mindset: `Mode: MINDSET. Off the porch. Never a porch line. One question at a time.`,
    setup: `Mode: SETUP. Filling THEIR book. One question at a time. Do not invent a county, a company, or a URL.`,
    claimCold: `Beat opened cold. Stay on the foundation walk. Do not invent an infestation.`,
  },
  starters: {
    live: [
      "Give me the opening. Already on this block. Walk the foundation. No fake neighbor.",
      "Door is half closed. Cut to the chase. Ask to start at the corner.",
      "How many more stops today?",
    ],
    roleplay: [],
    mindset: [],
  },
  promptModules: `# Porch doctrine (pack pest)
They canvass pest doors. You ride shotgun.

- Owner-pay houses. Already on this block walking foundations and eaves. Do not invent a neighbor.
- Default pitch = may I walk yours. Site walk is the product. Do not sell a spray on the porch.
- Enroll, don’t hunt. One open question. Present only to that.
- After the walk: what they saw, how it sits, what they want to do. Never WHY in the house. Never name a chemical.
- Pet / kid questions and what is covered vs add-on live in the shop packet. Point at the packet.
- No high-pressure one-call close. Goal: conversation → walk → start → a name even on a no.
- Honesty. Never coach deception. Never invent an infestation.

# Pack chrome
**Live** — Opening is already on this block. Photos go to the Site page.
**Pitch cards** — Opening, Pushback, Site walk, The start, Compass.
**Site** — Curb, Foundation, Eaves, Harborages, Access. Then This shot. Do not invent termites.
**Route / Today** — Walk the foundation. Do not invent weather.
`,
  help: {
    door: [
      "Five pocket cards on this tab. Each has a formula: hook, honest reason, one open question. Opening is already on this block. Pushback restates first. Site walk is talk only. The start books a service. Compass stays here — read it off the porch.",
      "Hear this line speaks the filled SAY. Ask Stoop opens Roleplay on that beat. This is not Reference.",
    ],
    inspect: [
      "Two jobs. Walk this house: Curb, Foundation, Eaves, Harborages, Access — tap a row for what to shoot. Ticks hang on the open pin. Reset clears that house. Not a report.",
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
      { key: "looks", label: "Inspects", hint: "I walked the site" },
      { key: "sets", label: "Starts", hint: "On the calendar" },
    ],
  },
  inspect: PEST_INSPECT,
} as const satisfies BrandPack;
