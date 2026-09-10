export const PAGE_HELP = {
  home: {
    title: "Roofus",
    body: [
      "This is the porch. Open Today for the four counts. Streets is zips. Inspect is the camera.",
      "Orange button is Roofus. Tap him — he's in the corner of the chat. Hold the button for old chats. Three dots: Mindset, Cards, Reference, Presets. First open walks the question mark.",
      "Bottom: Today, Streets, Inspect. Put the app on your Home Screen so it opens like anything else on this phone.",
    ],
  },
  today: {
    title: "Today",
    body: [
      "First time: your name, which counties, which state. Hours live in Presets. Then the four counts.",
      "Before you knock is the zip, age band, weather you may mention, and the first door line. Pocket cards is Door, Pushback, i35, Set, Compass.",
      "Neighborhood today is the zip you’re on. After Action Report is wins first, then what you’ll do different. Ask Roofus and he’ll name tomorrow.",
    ],
  },
  streets: {
    title: "Streets",
    body: [
      "Build from the counties in Presets. You pick the roof age — default 17–25 years. Tap Change to edit. Cards are zips. Working sits at the top. Tap a county to open the rest. Streets on a card are the age-band pockets — tap the card.",
      "A Working zip shows one sentence if a kept storm actually hit it. Use today copies that sentence onto Today. Last 48 hours and the season log are not on this page.",
    ],
  },
  cards: {
    title: "Cards",
    body: [
      "Five pocket cards from the porch book. Door is the default knock. Pushback restates first. i35 is after photos. Set is morning or afternoon. Compass is truck only.",
      "Ask Roofus pins the matching hat. This is not Reference — those are InterNACHI articles.",
    ],
  },
  inspect: {
    title: "Inspect",
    body: [
      "Photos first. Check Street, Four slopes, Close-up, Witnesses, Attic.",
      "Then Camera or Photos. Then ask about that shot. Opening this page starts a blank ask — old inspect chats live under Roofus, hold the orange button.",
      "The Inspect hat is talk on the roof. This page is the camera.",
    ],
  },
  mindset: {
    title: "Mindset",
    body: [
      "Four truths at the top. Then Why, Name the demon, Pace, Talent stack.",
      "After Action Report is on Today. Coach me through this pins the Mindset hat and asks one question. Answers land on this page. Private. Not a pitch.",
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
      "Backup: optional Notion copy of days, streets, storms, mindset, and FAQs. Connect finds the tables. Restore brings the copy onto this phone. Do not Backup from an empty phone.",
      "FAQs ship with public porch answers already filled. Edit or drop. Your office rules win.",
      "Show the question-mark tour plays the first-open walk again.",
    ],
  },
  coach: {
    title: "Roofus",
    body: [
      "Pin a hat. That starts a fresh chat. Door, Inspect, Pushback, Set, Roleplay, Mindset. Door’s first starter is the million-dollar script. The dog in the corner is him.",
      "Roleplay: pick who they are, then knock. Hold the mic. Score me grades it. Hear it plays his line. Practice only — do not record a homeowner.",
      "Mindset is truck only. Inspect hat is on-roof talk. Camera is the Inspect page. X closes him. The day is still underneath.",
    ],
  },
} as const;

export type HelpPageId = keyof typeof PAGE_HELP;
