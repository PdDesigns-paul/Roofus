/** Pack `solar` — Stride, graduated from demo. Packets only. Not a second Roofus. */
import type { BrandPack, PocketCard, RoleplayScene, RoleplayWho, TourStep } from "../pack.ts";
import { SOLAR_INSPECT } from "./inspect.ts";

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
    body: "Four questions, then leave if no. Not a storm story.",
  },
  {
    id: "dog",
    title: "The coach",
    body: "Gold button. Tap Live, Roleplay, or Mindset. Hold starts Live.",
  },
  {
    id: "age",
    title: "Qualify first",
    body: "Ask the four questions. ? in the header is how this page works.",
    sample: true,
  },
] as const satisfies readonly TourStep[];

const CARDS: PocketCard[] = [
  {
    id: "door",
    mode: "roleplay",
    scene: "walkup",
    title: "Opening",
    when: "Walk-up. Qualify first.",
    formula: "Who I am → four questions → leave if no",
    lines: [
      { say: "Hey — I’m [name] with [company]. Four quick questions and I will not waste your evening." },
      {
        say: "Do you own the home? What do you pay for electricity? How old is the roof? Is the other decision-maker here?",
      },
      {
        note: "Renter / full shade / roof at end of life → card for the owner or the roofer, warm exit. Do not invent a year or a bill.",
      },
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
      { note: "Solar is a scam / last company lied — Acknowledge. Show license from Settings / packet. No one-call close." },
      { note: "Spouse not here — Who else has to see a number? Book both." },
      {
        note: "Roof too old — Agree if they said 20+. Roof first. Do not sell an array onto a roof they already called dead.",
      },
      { note: "Busy / door closing — Cut to the four questions or leave." },
    ],
  },
  {
    id: "after",
    mode: "roleplay",
    scene: "after",
    title: "Site / survey walk",
    when: "Survey is done. Talk only.",
    formula: "What they saw → how it sits → lease vs loan vs PPA vs cash as one question",
    lines: [
      { say: "You saw the shade on the south face and the year on the shingles. How does that sit with you?" },
      {
        say: "If we go further, who would own it — you, a lender, or the system owner on a lease or PPA?",
      },
      {
        note: "Do not invent a bill cut or a production number. Lease / PPA credits belong to the system owner. Utility / tariff / interconnection = packet.",
      },
    ],
  },
  {
    id: "set",
    mode: "roleplay",
    scene: "set",
    title: "The set",
    when: "Book the next look, not a signed PPA in this PWA.",
    formula: "Both names → [day] morning or afternoon → cooling-off out loud",
    lines: [
      { say: "I’ll put you down for [day] afternoon. Who else needs to see a number?" },
      { note: "Three business days to cancel. Hand the shop’s form. Never coach a waiver. Never the utility." },
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
      { note: "Never the utility. Credit lives in the shop packet. Roof year is a question, not a promise." },
    ],
  },
];

const SCENES: RoleplayScene[] = [
  {
    id: "walkup",
    label: "Walk-up",
    hint: "First 30 seconds",
    knockLine: "[who]. Walk-up. I start.",
    brief: `Beat: WALK-UP. Four questions, then leave if no. Do not invent a year or a bill. Stay the homeowner. Short.`,
  },
  {
    id: "push",
    label: "They push",
    hint: "Objections",
    knockLine: "[who]. They already pushed back. I keep going.",
    brief: `Beat: THEY PUSH. Restate first. Scam / last company lied — acknowledge, show license, no one-call close. End at a next look or a name on a no.`,
  },
  {
    id: "after",
    label: "After the survey",
    hint: "Talk only",
    knockLine: "[who]. Survey is done. I start the talk. No pictures in this chat.",
    brief: `Beat: AFTER THE SURVEY. Talk only. What they saw, how it sits, who would own it. Never WHY in the house. Do not invent a production number.`,
  },
  {
    id: "set",
    label: "The set",
    hint: "Book it",
    knockLine: "[who]. I book the next look.",
    brief: `Beat: THE SET. Both names. [day] morning or afternoon. Cooling-off out loud. Never the utility. Not a porch signature.`,
  },
  {
    id: "visit",
    label: "Whole visit",
    hint: "Opening through set",
    knockLine: "[who]. Whole visit. I start.",
    brief: `Beat: WHOLE VISIT. Four qualifiers → warm exit or survey → talk → set. Never the utility. Stay the homeowner until Score me.`,
  },
];

const WHO: RoleplayWho[] = [
  { id: "busy", label: "Busy", prompt: "Be a polite busy owner. Door is already closing." },
  { id: "spouse", label: "Not alone", prompt: "Be the spouse — you decide together. The other person is not here." },
  { id: "skeptic", label: "Skeptic", prompt: "Be skeptical. You have heard pitches." },
  { id: "renter", label: "Renter", prompt: "You rent. You cannot sign. You will take a card for the owner." },
  { id: "shade", label: "Full shade", prompt: "Big trees on the south. You already think solar is a waste here." },
  { id: "roofage", label: "Roof too old", prompt: "You think the roof is 22+ years. You will not put holes in it first." },
  { id: "scam", label: "Scam", prompt: "You think solar is a scam. You want a license, not a pitch." },
  { id: "lied", label: "Last company lied", prompt: "Last company lied. You want a license, not another pitch." },
];

export { SOLAR_INSPECT };

export const SOLAR_PACK = {
  id: "solar",
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
    todayFallback: "Ask the four questions.",
  },
  modules: { storms: false, claim: false, internachi: false, packets: true },
  cards: CARDS,
  scenes: SCENES,
  who: WHO,
  claimStages: [] as RoleplayWho[],
  briefs: {
    live: `Mode: LIVE. Ride-along. Real door, real day. You are not the homeowner. Default pitch is four qualifiers, then a warm exit if they rent, sit in full shade, or the roof is at end of life. Do not invent a year or a bill. Photos go to the Site page. After Action Report writes on Route.`,
    roleplay: `Mode: ROLEPLAY. You are the homeowner until they tap Score me or type score me / break. Stay in character. Short. After score me: keep / cut / say instead, one better sentence, then wait. Never ask them to record a customer. Honest exit on a no.`,
    mindset: `Mode: MINDSET. Off the porch. Never a porch line. One question at a time.`,
    setup: `Mode: SETUP. Filling THEIR book. One question at a time. Do not invent a county, a company, or a URL.`,
    claimCold: `Beat opened cold. Stay on the four questions. Do not invent weather.`,
  },
  starters: {
    live: [
      "Give me the opening. Four questions. Warm exit if they rent.",
      "Door is half closed. Cut to the four questions or leave.",
      "How many more stops today?",
    ],
    roleplay: [],
    mindset: [],
  },
  promptModules: `# Porch doctrine (pack solar)
They canvass solar doors. You ride shotgun.

- Owner-pay houses. Qualify first: own the home, bill, roof year, other decision-maker here. Renter / full shade / roof at end of life → warm exit.
- Default pitch = four questions, then leave if no. Do not invent a year or a bill. Do not invent a neighbor.
- Enroll, don’t hunt. One open question. Present only to that.
- After the survey: what they saw, how it sits, who would own it (you, a lender, or the system owner on a lease or PPA). Never WHY in the house.
- Credit, tariff, interconnection live in the shop packet. Point at the packet. Never the utility.
- No high-pressure one-call close. Goal: conversation → survey → set → a name even on a no.
- Honesty. Never coach deception.

# Pack chrome
**Live** — Opening is four questions. Photos go to the Site page.
**Pitch cards** — Opening, Pushback, Site / survey walk, The set, Compass.
**Site** — Curb, Roof / array, Shade, Meter / inverter, Access. Then This shot. Do not invent remaining life.
**Route / Today** — Ask the four questions. Do not invent weather.
`,
  help: {
    door: [
      "Five pocket cards on this tab. Each has a formula: hook, honest reason, one open question. Opening is four questions, then leave if no. Pushback restates first. Site / survey walk is talk only. The set books a time. Compass stays here — read it off the porch.",
      "Hear this line speaks the filled SAY. Ask Stride opens Roleplay on that beat. This is not Reference.",
    ],
    inspect: [
      "Two jobs. Walk this house: Curb, Roof / array, Shade, Meter / inverter, Access — tap a row for what to shoot. Ticks hang on the open pin. Reset clears that house. Not a report.",
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
  inspect: SOLAR_INSPECT,
} as const satisfies BrandPack;
