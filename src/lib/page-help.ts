export const PAGE_HELP = {
  home: {
    title: "Home",
    body: [
      "Four tiles. The big one is Roofus — pin a hat, tell him what just happened, he hands you the next line.",
      "Mindset is how you stand at the door. Inspect is the camera walk. Reference is 145 InterNACHI articles.",
      "? on any page is this box. The round button: tap resumes chat, hold is history.",
    ],
  },
  inspect: {
    title: "Inspect",
    body: [
      "Walk first. Check Street, Four slopes, Close-up, Witnesses, Attic.",
      "Then Camera or Photos. Then ask about that frame. He names what it looks like and the next shot. CompanyCam is the report.",
      "The Inspect hat in chat is talk on the roof. This page is the camera.",
    ],
  },
  mindset: {
    title: "Mindset",
    body: [
      "Four cards: the door, after photos, three honest options, honesty first.",
      "Read them before the street. He already has the same playbook when you chat.",
    ],
  },
  reference: {
    title: "Reference",
    body: [
      "Search. Open a chapter. Tap a card to open the InterNACHI article.",
      "Ask him in chat if you want the card title without reading. He will not paste the article.",
    ],
  },
  settings: {
    title: "Presets",
    body: [
      "Company name and warranty line. He uses those when he talks product.",
      "Leave a field as it is for Paul’s defaults.",
    ],
  },
  coach: {
    title: "Roofus",
    body: [
      "Hats: Door, Inspect, Pushback, Set, Roleplay, Score. Pin one. Tell him what just happened.",
      "Inspect hat is on-roof talk. Camera lives on the Inspect page.",
      "New starts a blank thread. Past chats is history. Stop while he is talking.",
    ],
  },
} as const;

export type HelpPageId = keyof typeof PAGE_HELP;
