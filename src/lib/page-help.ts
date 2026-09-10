export const PAGE_HELP = {
  home: {
    title: "Roofus",
    body: [
      "This is the porch. The bar is setup — name, territory, zips, hours, warranty, Why. Each row opens Presets or Ask Roofus. Tell Roofus is the pinned setup chat.",
      "Orange button is Roofus. Tap to pick Live, Roleplay, or Mindset — each is a new chat. Hold starts Live. History is the clock in the chat. Menu: Cards, Reference, Presets. First open walks the question mark.",
      "Bottom: Today, Inspect, Home. Back shows on Cards, Reference, Presets, and Streets. Put the app on your Home Screen so the tile says Roofus and shows the dog.",
    ],
  },
  today: {
    title: "Today",
    body: [
      "First time: finish setup on Home — counties and a state. Hours live in Presets. Then the four counts.",
      "Before you knock is the zip, age band, weather you may mention, and the first door line. Pocket cards is Door, Pushback, i35, Set, Compass.",
      "Neighborhood today is the zip you’re on. After Action Report is wins first, then facts, then a plan with verbs. Ask Roofus and he’ll name tomorrow.",
    ],
  },
  streets: {
    title: "Streets",
    body: [
      "Build from the counties in Presets — this page is not a tab. You pick the roof age — default 17–25 years. Tap Change to edit. Cards are zips. Working sits at the top. Tap a county to open the rest. Streets on a card are the age-band pockets — tap the card.",
      "A Working zip shows one sentence if a kept storm actually hit it. Use today copies that sentence onto Today. Last 48 hours and the season log are not on this page.",
    ],
  },
  cards: {
    title: "Cards",
    body: [
      "Five pocket cards from the porch book. Door is the default knock. Pushback restates first. i35 is after photos. Set is morning or afternoon. Compass is truck only.",
      "Ask Roofus opens Roleplay on that beat. Compass opens Mindset. This is not Reference — those are InterNACHI articles.",
    ],
  },
  inspect: {
    title: "Inspect",
    body: [
      "Photos first. Check Street, Four slopes, Close-up, Witnesses, Attic. Ticks are working memory for this house — they don’t save and they’re not a report.",
      "Then Camera, Photos, or Practice shot. Ask what you’re looking at, whether it’s the worst, or what to say. He names the i35 slot — Bad, Good, Worst, or skip theater. Practice is not this house.",
      "Don’t announce off the ladder. Opening this page starts a blank ask — old inspect chats live under Roofus history.",
    ],
  },
  mindset: {
    title: "Mindset",
    body: [
      "Worksheets live in Presets. Four truths at the top. Then Why, Name the demon, Pace, Talent stack.",
      "Why is a ladder: number, what it buys, who else, the person or promise. Read it with Roofus on a dead day. Demon names the attack. Pace drops a gear. Stack is three skills. After Action Report is on Today — wins, facts, a plan.",
      "Coach me through this opens a Mindset chat and asks one question. The orange fan also opens that chat. Answers land on this page. Private. Not a pitch.",
    ],
  },
  reference: {
    title: "Reference",
    body: [
      "Search. Open a chapter. Tap a card to open the InterNACHI article.",
      "Ask Roofus for the card title if you don’t want to read. He will not paste the article.",
    ],
  },
  settings: {
    title: "Presets",
    body: [
      "First name, counties, state, when you knock, morning work, hard stop. Company name and warranty line. He uses those when he talks product.",
      "Zips (Streets) opens from this page. Rebuild after you change counties.",
      "Reminders nag you when you open the app. Lock-screen push is later.",
      "Mindset worksheets (Why, demon, Pace, stack) live on this page. The orange fan opens the chat. After Action Report is on Today.",
      "Backup: optional Notion copy of days, streets, storms, mindset, and FAQs. Connect finds the tables. Restore brings the copy onto this phone. Do not Backup from an empty phone.",
      "FAQs ship with public porch answers already filled. Edit or drop. Your office rules win.",
      "Show the question-mark tour plays the first-open walk again.",
    ],
  },
  coach: {
    title: "Roofus",
    body: [
      "Tap the orange button to pick a mode. That starts a fresh chat. Live, Roleplay, Mindset. Hold starts Live. Live’s first starter is the million-dollar script. The dog in the corner is him. History is the clock at the bottom. Tags by color.",
      "Roleplay: pick a beat at the bottom (Walk-up, They push, After photos, The set, Whole visit), who they are, then knock. Hold the mic. Score me grades it. Hear it plays his line. Practice only — do not record a homeowner.",
      "Mindset is truck only. Worksheets are in Presets. Camera is the Inspect page. X closes him. The day is still underneath.",
    ],
  },
} as const;

export type HelpPageId = keyof typeof PAGE_HELP;
