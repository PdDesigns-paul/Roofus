export const PAGE_HELP = {
  home: {
    title: "Roofus",
    body: [
      "This is the porch. Setup is one card — name, company, counties first. Tap the card to open the rest (zips, hours, warranty, Why). Tell Roofus writes those fields. Open Today is the day.",
      "The gold button is Roofus — dog face. Tap to pick Live, Roleplay, or Mindset. Hold starts Live. History is the clock in the chat. ? and Menu live in the header. Menu: Cards, Reference, Streets, Presets.",
      "Bottom: Today, Inspect, Home. Back is in the header on Cards, Reference, Presets, and Streets. Put the app on your Home Screen so the tile says Roofus and shows the dog.",
    ],
  },
  today: {
    title: "Today",
    body: [
      "First time: counties and a state on Home. Hours live in Presets. Then the four counts. Tap a count tile to add one. Minus is the small control.",
      "Before you knock is the loop, age band, weather you may mention, and the first door line. Pocket cards is Door, Pushback, i35, Set, Compass.",
      "Neighborhood today is one or more park-once loops from Streets. Check backups in case a loop is picked over — first remaining is Working. Open Streets from More, Home, or that line. After Action Report is wins first, then facts, then a plan with verbs. Ask Roofus and he’ll name tomorrow.",
    ],
  },
  streets: {
    title: "Streets",
    body: [
      "Build from the counties in Presets. Open from More, Home, Today, or Presets. You pick the roof age — default 17–25 years. Tap Change to edit. Each card is a park-once loop (Census streets or a small CDP). Township is the folder. Working sits at the top. Tap a county to open the rest. Search township, loop, street, or zip. A rural county still gets a row even if Census found no age-band loops yet.",
      "A Working loop shows one sentence if a kept storm actually hit it. Use today adds that loop to Today’s plan and copies the sentence if the weather box is empty. Last 48 hours and the season log are not on this page. Rebuild does not copy old zip Working onto the new loops.",
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
      "Two jobs. Walk this house: Street, Four slopes, Close-up, Witnesses, Attic — tap a row for what to shoot. Ticks are this house. They don’t save. Not a report.",
      "This shot: Camera, Photos, or Practice. Ask what you’re looking at, whether it’s the worst, or what to say. He names the i35 slot — Bad, Good, Worst, or skip theater. Practice is not this house.",
      "Don’t announce off the ladder. Opening this page starts a blank ask — old inspect chats live under Roofus history.",
    ],
  },
  mindset: {
    title: "Mindset",
    body: [
      "Worksheets live in Presets → Mindset. Four truths at the top. Then Why, Name the demon, Pace, Talent stack.",
      "Why is a ladder: number, what it buys, who else, the person or promise. Read it with Roofus on a dead day. Demon names the attack. Pace drops a gear. Stack is three skills. After Action Report is on Today — wins, facts, a plan.",
      "Coach me through this opens a Mindset chat and asks one question. The orange fan also opens that chat. Answers land on this page. Private. Not a pitch.",
    ],
  },
  reference: {
    title: "Reference",
    body: [
      "Search. Open a chapter. Tap a card to open the InterNACHI article. If they pasted a company site in Presets, that chapter sits on top with direct links.",
      "Ask Roofus for the card title if you don’t want to read. He will not paste the article.",
    ],
  },
  settings: {
    title: "Presets",
    body: [
      "Presets is a list of pages. You, Territory, Hours, Mindset, Reminders, Backup. Streets is its own page. Back on every sub page. Tour and sample day stay on this list.",
      "You: first name, company, website, warranty. Paste a URL — we crawl it in the background. Pages land in Reference. He uses those notes when he talks product.",
      "Territory: counties and a state. Rebuild Streets after you change them. Hours: when you knock, morning work, hard stop.",
      "Reminders: morning storm if empty, evening After Action Report if blank, Sundays pace, the 1st talent stack. Did it is a chip. Finish-setup is the card on Home, not a nag.",
      "Mindset worksheets (Why, demon, Pace, stack) have their own page. The orange fan opens the chat. After Action Report is on Today.",
      "Backup: optional Notion copy of days, streets, storms, mindset, and FAQs. Do not Restore onto a full phone. Do not Backup from an empty one.",
      "Show the question-mark tour plays the first-open walk again.",
    ],
  },
  coach: {
    title: "Roofus",
    body: [
      "Tap the orange button to pick a mode. That starts a fresh chat. Live, Roleplay, Mindset. Hold starts Live. Live’s first starter is the million-dollar script. The dog in the corner is him. History is the clock at the bottom. Tags by color.",
      "Roleplay: pick a beat at the bottom (Walk-up, They push, After photos, The set, Whole visit), who they are, then knock. Hold the mic. Score me grades it. Hear it plays his line. Practice only — do not record a homeowner.",
      "Mindset is truck only. Worksheets are in Presets → Mindset. Camera is the Inspect page. X closes him. The day is still underneath.",
    ],
  },
} as const;

export type HelpPageId = keyof typeof PAGE_HELP;
