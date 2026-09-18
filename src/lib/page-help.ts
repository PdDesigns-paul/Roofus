export const PAGE_HELP = {
  today: {
    title: "Today",
    body: [
      "First time: name, company, one county on this page if those are blank. Then Setup leaves Today. Hours live in Settings. Working loop is one line plus Cards. Pin on this page drops GPS and opens the house editor here (address, year, status, note, roof look). Works with no Working loop. Next door is the next blank pin on that walk. Four counts sit on this page. Pin status writes the matching Today count once. Tiles still work without a pin. First open is five job slides over the field log: who I am, drop a pin, what to say at the door, talk to the dog, age first. Do not list tab names on slide 1. Skip is on every slide.",
      "One weather sentence, read-only from Keep or Use today. Night opens Finish the day on Plan. Formula reads AAR · blank or AAR · done. No After Action Report fields here. Wins, better, and tomorrow live on Plan. No Keep / Toss on Today. No plan chips. No weather box. The map and the long board stay on Plan.",
      "Pick the Working loop on Plan (Use today). Ask Roofus how today went is an outline. Pin is the action on this page. Pin still works on an empty book.",
    ],
  },
  streets: {
    title: "Plan",
    body: [
      "Night-before and morning. Not a fifth Place. Where you knock is the map — drop pins, search a zip, drag onto the house. Satellite is on so you can see the roof; chip off for the street drawing. Walks form from distance. Default open until a Working loop exists. Year filter (all / in band / no year) uses years you typed. Default targeting 15–22. Tap Change. Chips pick a band. From and To take the number when you leave the field, not on the first digit. Each card is a park-once walk of pins. Working sits at the top. Search a loop, street, or zip. Empty match says so. Near me is a chip — it sorts walks you already have. Empty book does not invent a zip. Map key missing: pins still save.",
      "Keep / Toss lives here. Age first on the porch. Today may show one kept sentence. It does not host Keep / Toss. Use today is a chip — it picks the Working loop and copies the sentence if the weather box is empty. Skip and Done freeze that walk. Morning is a chip — only pins with status set or revisit. Same PinCard. Empty: nothing to call. Pin a house or knock. That is the 7am job, not a pipeline.",
      "Finish the day owns the night form. After Action Report and Tomorrow I start at live here only. Night on Today opens Finish the day here. Same store. Open a loop: that card is the pin board in walking order. Revisit is a chip — houses to come back to, across loops. Settings is a Go at the bottom, not a fifth tab. Pick tomorrow. Finish the journal. Desk drops are tagged.",
    ],
  },
  cards: {
    title: "Door",
    body: [
      "Five pocket cards on this tab, plus Claim path after you Keep a storm that matches this zip. Each has a formula: hook, honest reason, one open question. Door is the default knock. Pushback restates first. i35 is after photos. Set is morning or afternoon, paper, and a phone-review path. Compass stays here — read it off the porch.",
      "The line under the title is You, the street or Working loop, the age band, and Keep or Use-today weather. Tap the name to open You. Tap the street to open Plan or Today. Empty You is a Go, not brackets. Hear this line speaks the filled SAY. Ask Roofus opens Roleplay on that beat with the filled opener. Claim path opens with the A constraint. Compass opens Mindset. This is not Reference — those are InterNACHI articles.",
    ],
  },
  roof: {
    title: "Roof",
    body: [
      "Two jobs. Walk this house: Street, Four slopes, Close-up, Witnesses, Attic — tap a row for what to shoot. Ticks hang on the open pin. Reset clears that house. Coach may quote the open pin’s year, status, note, and look. No pin, no “this house.” Not a report.",
      "This shot: Camera, Photos, or Practice. Ask what you’re looking at, whether it’s the worst, or what to say. He names the i35 slot — Bad, Good, Worst, or skip theater. Practice is not this house.",
      "Don’t announce off the ladder. Opening this page starts a blank ask — old Roof chats live under Roofus history.",
    ],
  },
  mindset: {
    title: "Mindset",
    body: [
      "Worksheets live in Settings → Mindset. Four truths at the top. Then Why, Name the demon, Pace, Talent stack.",
      "Why is a ladder: number, what it buys, who else, the person or promise. Read it with Roofus on a dead day. Demon names the attack. Pace drops a gear. Stack is three skills. After Action Report lives on Plan — wins, facts, a plan.",
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
      "Settings is a list of pages. You, Territory, Hours, Mindset, Reminders, Backup. Each row is a Go — title, hint, chevron. Plan is its own tab, not a row here. Back on every sub page.",
      "You: first name, company, website, warranty, packets. Paste a URL — we crawl it in the background. Pages land in Reference. Photo or File under the website: flyer, form, warranty, other. Type the porch line in notes. He quotes saved text only. No text, no “I read your flyer.”",
      "Territory: counties and a state. Counties are for storms. Pins make the walks. Hours: when you knock, morning work, hard stop.",
      "Reminders: morning storm if empty, evening After Action Report only after a door, a pin, or finished setup, Sundays pace, the 1st talent stack. Did it is a chip. Finish-setup is Settings, not a nag. Blank first hour after 5pm is Setup, not AAR.",
      "Mindset worksheets (Why, demon, Pace, stack) have their own page. The orange fan opens the chat. After Action Report lives on Plan.",
      "Backup: optional Notion copy of days, streets, storms, mindset, FAQs, and pins. Do not Restore onto a full phone. Do not Backup from an empty one.",
      "Show the tour and Load a sample day are outlined pills under the list. Show the tour plays the five job slides again. Skip is on every slide. Load a sample day only on an empty book.",
    ],
  },
  coach: {
    title: "Roofus",
    body: [
      "Tap the orange button to pick a mode. That starts a fresh chat. Live, Roleplay, Mindset. Hold starts Live. Live’s first starter is the million-dollar script. The dog in the header is him — big enough to read in sun. History is the clock at the bottom. Tags by color.",
      "Roleplay: pick a beat at the bottom (Walk-up, They push, After photos, The set, Whole visit), who they are, then knock. Hold the mic. Score me grades it. Hear it plays his line. Practice only — do not record a homeowner.",
      "Mindset is off the porch. Worksheets are in Settings → Mindset. Camera is the Roof page. X closes him. The day is still underneath.",
    ],
  },
} as const;

export type HelpPageId = keyof typeof PAGE_HELP;
