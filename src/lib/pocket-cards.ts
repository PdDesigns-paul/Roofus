/** Pocket cards. Distilled from /DOCTRINE.md. Not a Drive dump. */
import type { CoachMode, RoleplaySceneId } from "./coach-modes.ts";
import { COMPASS } from "./survive.ts";

export type PocketLine = { say?: string; note?: string };

export type PocketCard = {
  id: "door" | "claim" | "pushback" | "i35" | "set" | "compass";
  mode: CoachMode;
  scene?: RoleplaySceneId;
  title: string;
  when: string;
  formula: string;
  lines: PocketLine[];
};

export const POCKET_CARDS: PocketCard[] = [
  {
    id: "door",
    mode: "roleplay",
    scene: "walkup",
    title: "Door",
    when: "Walk-up. Default knock.",
    formula: "What’s going on → original roofs + free looks → what year is this one?",
    lines: [
      { note: "SLAP in your head: say hi, why you stopped, one open question, present only to that." },
      {
        say: "Hey — I’m [name] with [company]. I stopped by to see if you heard what’s been going on in the area.",
      },
      { note: "They ask what’s going on. That question is the enrollment. Then tell the truth." },
      {
        say: "A lot of these houses are on the original roof from around [year]. That’s first-roof age. We’re doing free looks this week. Do you know what year this one went on?",
      },
      { note: "Homeowner? If no, card for the owner. Leave." },
      { say: "Has anyone been up on yours lately?" },
      {
        say: "We’d both agree this roof is at the age where it’s time to plan a replacement, right?",
        note: "Only if it is actually old. Ask to look. Do not grab the ladder on a no.",
      },
      {
        note: "Do not use “what’s been going on” as fake hail. Script A only after Keep, and only on this zip.",
      },
    ],
  },
  {
    id: "pushback",
    mode: "roleplay",
    scene: "push",
    title: "Pushback",
    when: "They push. Restate first.",
    formula: "Restate → one honest beat → one question that books a next look",
    lines: [
      { note: "Acknowledge. Restate their words. Do not argue. Do not drop price on the porch." },
      { say: "Are you selling something? — Yes. Roofs. Not a number on the porch. Age + free look." },
      { say: "Busy / door closing — I’ll cut right to the chase. Then leave." },
      { say: "Already have a guy — Good. Keep him. Second set of photos if you ever want it." },
      { say: "Need to think — You want to think about it. Then one question that books a real next look." },
      { say: "Price is higher — That’s true. Then ice and water, valleys, who is on the warranty." },
      { note: "Insurance said no: only if a kept storm hit this zip. Do not promise a flip." },
      { note: "A no is the second-best answer. Name even on a no." },
    ],
  },
  {
    id: "i35",
    mode: "roleplay",
    scene: "after",
    title: "i35",
    when: "After photos. Never on the ladder.",
    formula: "Can you see this → Bad / Good / Worst → what would you like to do about it?",
    lines: [
      { note: "Take as many pictures as you need. Show three. Five max. Do not announce off the ladder." },
      { note: "Bad — relatable. Good — a sound area. Has to be true. Worst — the one that matters." },
      { say: "Can you see this?" },
      { say: "How long have you noticed this? / Has anybody ever showed you this?" },
      { say: "How does that make you feel?" },
      { say: "What would you like to do about it?" },
      { note: "Never WHY in the house. WHY puts them on trial. Save why for Mindset." },
      { note: "If the roof is just old, do not put worst-photo theater on a clean field." },
    ],
  },
  {
    id: "set",
    mode: "roleplay",
    scene: "set",
    title: "Set",
    when: "After they agreed what they saw.",
    formula: "What they already agreed → three options → [day] morning or afternoon?",
    lines: [
      { note: "Ask to present before paper. Same three options every time. From what they already agreed." },
      { note: "1. Insurance — documented storm damage. A claim can be denied. Carrier decides." },
      { note: "2. Repair — isolated, if the field still has life. Default in-house under about $1,500." },
      { note: "3. Retail replace — age + wear. Cash or monthly." },
      { say: "Does [day] morning or [day] afternoon work better?" },
      { note: "Both decision-makers. Before the driveway. Name even on a no." },
      { note: "Text the confirm from the number in Settings. Never invent a number." },
      {
        say: "No answer, I leave a card. We talked or I looked, I leave a flyer. Storm damage on camera, I leave the claims how-to. Auth only after they read it. Storm letter only if a kept storm matches this zip.",
      },
      {
        say: "We can do in-home, or I inspect first and we do a 20–30 minute phone review.",
      },
      {
        say: "I’ll text the confirm from the number in Settings. Both names. Roofus does not send that text.",
      },
    ],
  },
  {
    id: "compass",
    mode: "mindset",
    title: "Compass",
    when: "Truck only. Never a porch line.",
    formula: "Read this in the truck.",
    lines: [
      ...COMPASS.map((line) => ({ note: line })),
      { note: "Why is in Settings. The demon never goes on a door." },
    ],
  },
];

/** Script A. Door list only after a fresh Keep. Matching zip is the when-line. Do not invent hail. */
export const CLAIM_PATH_CARD: PocketCard = {
  id: "claim",
  mode: "roleplay",
  scene: "walkup",
  title: "Claim path",
  when: "Only after Keep. Matching zip.",
  formula: "Where are you at with insurance → present only to that → document first",
  lines: [
    {
      say: "Where are you at with insurance on the house — nothing filed, adjuster’s been out, they paid something, they denied it, or you already have a check?",
    },
    { note: "Present only to that answer. Do not dump all four stages." },
    { note: "Document first. No claim speech until something is on camera." },
    {
      say: "The average deductible is a few thousand dollars. Are you comfortable with that before we go further?",
    },
    { note: "Do not say every carrier pays. Do not promise a flip on a denial." },
  ],
};

/** B cards always. A card after Door when they Kept a storm. */
export function doorList(showClaim: boolean): PocketCard[] {
  if (!showClaim) return POCKET_CARDS;
  const [door, ...rest] = POCKET_CARDS;
  return [door, CLAIM_PATH_CARD, ...rest];
}

export type PreKnockInput = {
  cluster: string;
  storm: string;
  goBy: string;
  company: string;
  knockWindow: string;
  hardStop: string;
  ageMin: number;
  ageMax: number;
  workingZip: string;
};

export type PreKnock = {
  zip: string;
  age: string;
  weather: string;
  hours: string;
  script: string;
  opener: string;
};

export function fillName(goBy: string, company: string): { name: string; company: string } {
  return {
    name: goBy.trim() || "[your name]",
    company: company.trim() || "[company]",
  };
}

export function preKnock(input: PreKnockInput): PreKnock {
  const zip = input.cluster.trim() || input.workingZip.trim();
  const storm = input.storm.trim();
  const who = fillName(input.goBy, input.company);
  const hours = [input.knockWindow.trim(), input.hardStop.trim() ? `stop ${input.hardStop.trim()}` : ""]
    .filter(Boolean)
    .join(" · ");
  return {
    zip: zip || "Pick a zip on After",
    age: `Roofs ${input.ageMin}–${input.ageMax}`,
    weather: storm || "Age only. Do not invent weather.",
    hours: hours || "Hours live in Settings",
    script: storm
      ? "Age first. Name this weather only on this zip."
      : "Million-dollar script. Age and a free look.",
    opener: `Hey — I’m ${who.name} with ${who.company}. I stopped by to see if you heard what’s been going on in the area.`,
  };
}

export function pocketKnowledge(): string {
  const cards = [POCKET_CARDS[0], CLAIM_PATH_CARD, ...POCKET_CARDS.slice(1)];
  return cards
    .map((c) => {
      const body = c.lines
        .map((l) => {
          if (l.say && l.note) return `- Say: ${l.say}\n  (${l.note})`;
          if (l.say) return `- Say: ${l.say}`;
          return `- ${l.note}`;
        })
        .join("\n");
      return `### ${c.title} (${c.when})\nFormula: ${c.formula}\n${body}`;
    })
    .join("\n\n");
}
