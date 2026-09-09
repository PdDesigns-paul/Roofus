export const HELP_PAGES = {
  home: {
    question:
      "I'm new here. I'm on the Home screen. Explain Roofus, This House, Inspect, Mindset, and Reference — what I tap, and in what order before a street. Don't start a door script.",
  },
  house: {
    question:
      "I'm on This House. Explain the GPS button, typing an address, the demo address, and what happens after I look one up. Don't start a door script.",
  },
  houseBrief: {
    question:
      "I'm looking at one house. Explain the year, dragging the pin, Zillow, and Ask Roofus about this house. Don't start a door script.",
  },
  inspect: {
    question:
      "I'm on Inspect. Explain the walk list, taking a photo, and asking you what I'm looking at. Don't start a door script.",
  },
  mindset: {
    question:
      "I'm on Mindset. How do I use this before I knock, and how do you use it when I chat with you? Don't start a door script.",
  },
  reference: {
    question:
      "I'm on Reference. How do I find an article, and when should I ask you instead of reading? Don't start a door script.",
  },
  settings: {
    question:
      "I'm on Settings. What should I fill in, and what can I leave as Paul's Default Option? Don't start a door script.",
  },
  coach: {
    question:
      "I'm in your chat. Explain the hats — Door, Inspect, Pushback, Set, Roleplay, Score — and when to pin a house. Don't start a door script unless I paste a knock.",
  },
} as const;

export type HelpPageId = keyof typeof HELP_PAGES;

export function helpQuestion(page: HelpPageId) {
  return HELP_PAGES[page].question;
}

export const HOUSE_WALKUP =
  "I just looked up this house. Brief me for the walk-up. Use the pin facts. If a year is missing, say so. Next line I can say, then the next physical step. Don't invent a storm.";

