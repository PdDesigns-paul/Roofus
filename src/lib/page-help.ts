export const PAGE_HELP = {
  home: {
    title: "Today",
    body: [
      "This is your day. Tap Doors, Talked, On the roof, Appointments. That’s the count Roofus reads tonight.",
      "Orange button is Roofus. Tap him — he's in the corner of the chat. Hold the button for old chats. Three dots: Mindset, Reference, company name.",
      "Bottom: Today, Streets, Inspect. Put the app on your Home Screen so it opens like anything else on this phone.",
    ],
  },
  today: {
    title: "Today",
    body: [
      "First time: which counties and which state. Then the four counts.",
      "Neighborhood today is the loop you’re on. After Action Report is wins first, then what you’ll do different. Ask Roofus and he’ll name tomorrow.",
      "Weather you can mention only fills from storms you Keep on Streets, and only if they hit this loop.",
    ],
  },
  streets: {
    title: "Streets",
    body: [
      "Build from the counties on Today. You pick the roof age — default 17–25 years. Same idea as the old assessor year filter.",
      "Last 48 hours: tap to check. NWS first, then local news and X. High on a loop you keep is tomorrow. Keep is the porch line. Medium and Low stay a footnote.",
      "Season log is six months of NWS. Keep / Toss. Age first. A subdivision name only if the map has one.",
    ],
  },
  inspect: {
    title: "Inspect",
    body: [
      "Photos first. Check Street, Four slopes, Close-up, Witnesses, Attic.",
      "Then Camera or Photos. Then ask about that shot. He names what it looks like and the next shot. CompanyCam is the report.",
      "The Inspect hat is talk on the roof. This page is the camera.",
    ],
  },
  mindset: {
    title: "Mindset",
    body: [
      "Four truths at the top. Then Why, Name the demon, Pace, Talent stack.",
      "After Action Report is on Today. Coach me through this asks one question at a time. Private. Not a pitch.",
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
      "Company name and warranty line. He uses those when he talks product.",
      "Backup: optional Notion copy of days, streets, storms, mindset, and FAQs. Free account. Recommended so a dead phone is not a dead year.",
      "Counties and hours live on Today.",
    ],
  },
  coach: {
    title: "Roofus",
    body: [
      "Pin a hat. Tell him what just happened. Door, Inspect, Pushback, Set, Roleplay, Score. The dog in the corner is him.",
      "Roleplay: hold the mic and knock. Hear it plays his line. Practice only — do not record a homeowner.",
      "Inspect hat is on-roof talk. Camera is the Inspect page. X closes him. The day is still underneath.",
    ],
  },
} as const;

export type HelpPageId = keyof typeof PAGE_HELP;
