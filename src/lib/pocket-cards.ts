/** Five pocket cards. Distilled from /DOCTRINE.md. Not a Drive dump. */
import type { CoachMode, RoleplaySceneId } from "./rufus-modes.ts";
import { COMPASS } from "./survive.ts";

export type PocketLine = { say?: string; note?: string };

export type PocketCard = {
  id: "door" | "pushback" | "i35" | "set" | "compass";
  mode: CoachMode;
  scene?: RoleplaySceneId;
  title: string;
  when: string;
  lines: PocketLine[];
};

export const POCKET_CARDS: PocketCard[] = [
  {
    id: "door",
    mode: "roleplay",
    scene: "walkup",
    title: "Door",
    when: "Walk-up. Default knock.",
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
    lines: [
      { note: "Ask to present before paper. Same three options every time. From what they already agreed." },
      { note: "1. Insurance — documented storm damage. A claim can be denied. Carrier decides." },
      { note: "2. Repair — isolated, if the field still has life. Default in-house under about $1,500." },
      { note: "3. Retail replace — age + wear. Cash or monthly." },
      { say: "Does [day] morning or [day] afternoon work better?" },
      { note: "Both decision-makers. Before the driveway. Name even on a no." },
      { note: "Text the confirm from the number in Presets. Never invent a number." },
    ],
  },
  {
    id: "compass",
    mode: "mindset",
    title: "Compass",
    when: "Truck only. Never a porch line.",
    lines: [
      ...COMPASS.map((line) => ({ note: line })),
      { note: "Why is on Mindset. The demon never goes on a door." },
    ],
  },
];

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
    zip: zip || "Pick a zip on Streets",
    age: `Roofs ${input.ageMin}–${input.ageMax}`,
    weather: storm || "Age only. Do not invent weather.",
    hours: hours || "Hours live in Presets",
    script: storm
      ? "Age first. Name this weather only on this zip."
      : "Million-dollar script. Age and a free look.",
    opener: `Hey — I’m ${who.name} with ${who.company}. I stopped by to see if you heard what’s been going on in the area.`,
  };
}

export function pocketKnowledge(): string {
  return POCKET_CARDS.map((c) => {
    const body = c.lines
      .map((l) => {
        if (l.say && l.note) return `- Say: ${l.say}\n  (${l.note})`;
        if (l.say) return `- Say: ${l.say}`;
        return `- ${l.note}`;
      })
      .join("\n");
    return `### ${c.title} (${c.when})\n${body}`;
  }).join("\n\n");
}
