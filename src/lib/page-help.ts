/** Header ? copy. Door / Roof / Coach paragraphs are pack-owned. Settings and kernel chrome stay here. */
import { pack } from "./tenant/index.ts";

export const PAGE_HELP = {
  today: {
    title: pack.places.today,
    body: [
      "First time: name, company, one county on this page if those are blank. Then Setup leaves Today. Hours live in Settings. Working loop is one line plus Cards. Start day / End day sit under the date. Pause is a chip. Trail is a chip — off until you tap it. Works while Today is open. Locked phone or a killed tab stops the line, not the clock. Elapsed is on this page — your clock, not a manager report. Each tile writes a time so Hours can show when doors happened. Pin on this page drops GPS and opens the house editor here (address, year, status, note, roof look). Works with no Working loop. Next door is the next blank pin on that walk. Four counts sit on this page. Pin status writes the matching Today count once. Tiles still work without a pin. First open is five job slides over the field log: who I am, drop a pin, what to say at the door, talk to the dog, age first. Do not list tab names on slide 1. Skip is on every slide.",
      "One weather sentence, read-only from Keep or Use today. Night opens Finish the day on Plan. Formula reads AAR · blank or AAR · done. If the clock is open, End day is on Finish the day too. No After Action Report fields here. Wins, better, and tomorrow live on Plan. No Keep / Toss on Today. No plan chips. No weather box. The map and the long board stay on Plan.",
      "Pick the Working loop on Plan (Use today). Ask Roofus how today went is an outline. Start day is the clock. Pin drops the house. Pin still works on an empty book.",
    ],
  },
  plan: {
    title: pack.places.plan,
    body: [
      "Night-before and morning. Not a fifth Place. Where you knock is the map — drop pins, search a zip, drag onto the house. Satellite is on so you can see the roof; chip off for the street drawing. Walks form from distance. Default open until a Working loop exists. Year filter (all / in band / no year) uses years you typed. Default targeting 15–22. Tap Change. Chips pick a band. From and To take the number when you leave the field, not on the first digit. Each card is a park-once walk of pins. Working sits at the top. Search a loop, street, or zip. Empty match says so. Near me is a chip — it sorts walks you already have. Empty book does not invent a zip. Map key missing: pins still save. Today’s trail is a quiet line under the pins when you opted in. The trail is not a pin.",
      "Keep / Toss lives here. Age first on the porch. Today may show one kept sentence. It does not host Keep / Toss. Use today is a chip — it picks the Working loop and copies the sentence if the weather box is empty. Skip and Done freeze that walk. Morning is a chip — only pins with status set or revisit. Same PinCard. Empty: nothing to call. Pin a house or knock. That is the 7am job, not a pipeline.",
      "Finish the day owns the night form. After Action Report and Tomorrow I start at live here only. Night on Today opens Finish the day here. If the clock is still open, End day is here too. Same store. Open a loop: that card is the pin board in walking order. Revisit is a chip — houses to come back to, across loops. Settings is a Go at the bottom, not a fifth tab. Pick tomorrow. Finish the journal. Desk drops are tagged.",
    ],
  },
  door: {
    title: pack.places.door,
    body: pack.help.door,
  },
  roof: {
    title: pack.places.inspect,
    body: pack.help.inspect,
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
      "You: whose book (This phone; Switch book is a chip when another book is already on this phone). First name, company, website, warranty, packets. Paste a URL — we crawl it in the background. Pages land in Reference. Photo or File under the website: flyer, form, warranty, other. Type the porch line in notes. He quotes saved text only. No text, no “I read your flyer.” Account is a key on this page, not a login screen. No model picker.",

      "Territory: counties and a state. Counties are for storms. Pins make the walks. Hours: usual windows stay as policy. This week is your clock, counts, and conversion — not a hidden office report. A picture of the week sits under the numbers. Last 30 is a chip. Those numbers stay after old days prune. Each door tile writes a time; the picture uses those times. Pause is a chip on Today. Trail is opt-in, foreground only.",
      "Reminders: morning storm if empty, evening After Action Report only after a door, a pin, or finished setup, Sundays pace, the 1st talent stack. Did it is a chip. Finish-setup is Settings, not a nag. Blank first hour after 5pm is Setup, not AAR.",
      "Mindset worksheets (Why, demon, Pace, stack) have their own page. The orange fan opens the chat. After Action Report lives on Plan.",
      "Backup: Copy this phone. Last copy is a line on You. Save a file works offline. Notion is an optional office connector behind Use Notion. Restore onto a full day or pins asks you to type your first name or This phone.",
      "Show the tour and Load a sample day are outlined pills under the list. Show the tour plays the five job slides again. Skip is on every slide. Load a sample day only on an empty book.",
    ],
  },
  coach: {
    title: pack.talkName,
    body: pack.help.coach,
  },
};

/** leftover ids — product words are Plan / Door */
export const HELP_ID_ALIAS = { streets: "plan", cards: "door" } as const;

export type HelpPageId = keyof typeof PAGE_HELP;
