export const PAGE_HELP = {
  home: {
    title: "Roofus",
    body: [
      "Bottom: Truck, Door, Roof, After. Setup lives in Settings — name, company, counties. Tell Roofus writes those fields. Truck is the day.",
      "The gold button is Roofus — dog face. Tap to pick Live, Roleplay, or Mindset. Hold starts Live. History is the clock in the chat. ? and Menu live in the header. Menu: Reference, Settings.",
      "Back is in the header on Settings, Reference, and nested settings pages. Put the app on your Home Screen so the tile says Roofus and shows the dog.",
    ],
  },
  today: {
    title: "Truck",
    body: [
      "First time: name, company, counties on this page if the book is blank. Hours live in Settings. Then Door-style cards, one open. Tap a count tile to add one. Minus is the small control.",
      "Before you knock is the loop, age band, weather you may mention, and the first door line. Cards in that card is a Go to Door — Door, Pushback, Claim path after Keep, i35, Set, Compass. Pin is a filled Do when a Working loop exists — drop plus the last pin only. The house list lives on After. Night is a Go to After. Formula reads AAR · blank or AAR · done. No Wins / Better / Plan textareas here.",
      "Plan is chips of loops already on today’s plan. No county hunt on Truck. Open After from that card. Last 48 hours stays here. Weather you can say lives here. Ask Roofus how today went is the filled Do on Truck when there is no Working loop. When there is, Pin is the filled Do.",
    ],
  },
  streets: {
    title: "After",
    body: [
      "Two stacks. Where you knock is the hunt — age, build, search, Near me, Morning, Revisit, Working, county folders. Default open until a Working loop exists. You pick the roof age — default 15–22 years. Tap Change. Chips pick a band. From and To take the number when you leave the field, not on the first digit. Each card is a park-once loop (Census streets or a small CDP). Township is the folder. Working sits at the top. Tap a county to open the rest. Search township, loop, street, zip, or county. Empty match says so. Near me is a chip — it sorts loops you already built. Empty book does not invent a zip. A rural county still gets a row even if Census found no age-band loops yet. Military bases (barracks, NSA, depots) are dropped — rebuild to take them off a list you already have.",
      "When a scout card exists, the loop shows a muted ageBand / stormBand / why. That is not porch copy. A Working loop shows one sentence if a kept storm actually hit it. Use today is a chip — it adds that loop to Truck’s plan and copies the sentence if the weather box is empty. Skip is still a chip you tap. Last 48 hours and the season log are not on this page. Rebuild does not copy old zip Working onto the new loops. Morning is a chip — only pins with status set or revisit. Same PinCard. Empty: nothing to call. Build a loop or knock. That is the 7am job, not a pipeline.",
      "Finish the day owns the night form. After Action Report and Tomorrow I start at live here only. Truck Night is a Go. Same store. Open a loop: that card is the pin board. Revisit is a chip — houses to come back to, across loops. Settings is a Go at the bottom, not a fifth tab. Pick tomorrow. Finish the journal. Do not expand the hunt.",
    ],
  },
  cards: {
    title: "Door",
    body: [
      "Five pocket cards on this tab, plus Claim path after you Keep a storm. Each has a formula: hook, honest reason, one open question. Door is the default knock. Pushback restates first. i35 is after photos. Set is morning or afternoon, paper, and a phone-review path. Compass stays here — read it in the truck.",
      "Ask Roofus opens Roleplay on that beat. Claim path opens walk-up with the A constraint. Compass opens Mindset. This is not Reference — those are InterNACHI articles.",
    ],
  },
  roof: {
    title: "Roof",
    body: [
      "Two jobs. Walk this house: Street, Four slopes, Close-up, Witnesses, Attic — tap a row for what to shoot. Ticks are this house. They stay until Reset. Not a report.",
      "This shot: Camera, Photos, or Practice. Ask what you’re looking at, whether it’s the worst, or what to say. He names the i35 slot — Bad, Good, Worst, or skip theater. Practice is not this house.",
      "Don’t announce off the ladder. Opening this page starts a blank ask — old Roof chats live under Roofus history.",
    ],
  },
  mindset: {
    title: "Mindset",
    body: [
      "Worksheets live in Settings → Mindset. Four truths at the top. Then Why, Name the demon, Pace, Talent stack.",
      "Why is a ladder: number, what it buys, who else, the person or promise. Read it with Roofus on a dead day. Demon names the attack. Pace drops a gear. Stack is three skills. After Action Report lives on After — wins, facts, a plan.",
      "Coach me through this opens a Mindset chat and asks one question. The orange fan also opens that chat. Answers land on this page. Private. Not a pitch.",
    ],
  },
  reference: {
    title: "Reference",
    body: [
      "Search. Open a chapter. Tap a card to open the InterNACHI article. If they pasted a company site in Settings, that chapter sits on top with direct links.",
      "Ask Roofus for the card title if you don’t want to read. He will not paste the article.",
    ],
  },
  settings: {
    title: "Settings",
    body: [
      "Settings is a list of pages. You, Territory, Hours, Mindset, Reminders, Backup. After is its own tab. Back on every sub page. Tour and sample day stay on this list.",
      "You: first name, company, website, warranty. Paste a URL — we crawl it in the background. Pages land in Reference. He uses those notes when he talks product.",
      "Territory: counties and a state. Rebuild After after you change them. Hours: when you knock, morning work, hard stop.",
      "Reminders: morning storm if empty, evening After Action Report if blank, Sundays pace, the 1st talent stack. Did it is a chip. Finish-setup is Settings, not a nag.",
      "Mindset worksheets (Why, demon, Pace, stack) have their own page. The orange fan opens the chat. After Action Report lives on After.",
      "Backup: optional Notion copy of days, streets, storms, mindset, FAQs, and pins. Do not Restore onto a full phone. Do not Backup from an empty one.",
      "Show the question-mark tour plays the first-open walk again.",
    ],
  },
  coach: {
    title: "Roofus",
    body: [
      "Tap the orange button to pick a mode. That starts a fresh chat. Live, Roleplay, Mindset. Hold starts Live. Live’s first starter is the million-dollar script. The dog in the corner is him. History is the clock at the bottom. Tags by color.",
      "Roleplay: pick a beat at the bottom (Walk-up, They push, After photos, The set, Whole visit), who they are, then knock. Hold the mic. Score me grades it. Hear it plays his line. Practice only — do not record a homeowner.",
      "Mindset is truck only. Worksheets are in Settings → Mindset. Camera is the Roof page. X closes him. The day is still underneath.",
    ],
  },
} as const;

export type HelpPageId = keyof typeof PAGE_HELP;
