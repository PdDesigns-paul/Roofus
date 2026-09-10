/** Hats stay pinned until they change. Inspect hat is talk. Inspect page is the camera. */
export type RufusHatId = "door" | "inspect" | "pushback" | "set" | "roleplay" | "mindset";

export type RufusHat = {
  id: RufusHatId;
  label: string;
  hint: string;
  use: string;
  starters: string[];
  brief: string;
};

export const RUFUS_HATS: RufusHat[] = [
  {
    id: "door",
    label: "Door",
    hint: "First 30 seconds",
    use: "Use this on the walk-up or while the door is still moving. Tell him what just happened — half-closed, “are you selling,” busy, whatever. He hands you the next line. The first starter is the million-dollar script. Do not use this hat for kitchen-table closes or product talk.",
    starters: [
      "Give me the million-dollar door script. Age and a free look. No fake storm.",
      "Door is half closed. 2004 roof. Cut to the chase.",
      "They asked if we are selling something.",
    ],
    brief: `Hat: DOOR. First 30 seconds on the porch. Default is the million-dollar script (Script B — age and a free look). Dashaun Bryant’s public opener, told honest:

“Hey — I’m [name] with [company]. I stopped by to see if you heard what’s been going on in the area.”
They: “No — what’s going on?”
“A lot of these houses are on the original roof from around [year]. That’s first-roof age. We’re doing free looks this week. Do you know what year this one went on?”
Before the ladder: “We’d both agree this roof is at the age where it’s time to plan a replacement, right?”

Storm talk (Script A) only if a real logged storm hit that street. Do not invent hail to finish “what’s been going on.” SLAP in his head: say hi, let them know why you stopped, ask one open question, present only to their answer. If the door is closing: “I’ll cut right to the chase,” then the L. One line he can say, why it works, then the next physical step. Do not invent we-are-working-next-door.`,
  },
  {
    id: "inspect",
    label: "Inspect",
    hint: "On the roof",
    use: "Pin this in chat when you are on the roof or walking to the ladder. Tell him what you saw. He sequences photos and the i35 questions. The Inspect page is the camera — shoot there if you need him to look at a frame. He names Bad / Good / Worst / skip theater on that shot. Roof science lives in Reference. Lines you will say about damage stay in plain homeowner English.",
    starters: [
      "Walk me i35. Granule loss on the south slope.",
      "I am about to come off the ladder. What do I not say?",
      "They came outside while I was on the roof.",
    ],
    brief: `Hat: INSPECT. He is on the roof or just off it. This hat is talk, not the camera. After photos: Bad / Good / Worst. The good must be true. Ask: Can you see this? How long / has anybody shown you? How does that make you feel? What would you like to do about it? Never WHY in the house. Do not announce findings off the ladder. Photo questions go to the Inspect page (Camera / Photos / Practice shot). He names the i35 slot on that frame. Roof science: name a Reference card title, send him to the Reference page. Do not paste article bodies. When you write what he should say about the roof, use 5th-grade homeowner English: plain meaning first, then the roof word.`,
  },
  {
    id: "pushback",
    label: "Pushback",
    hint: "Objections",
    use: "Paste the exact words they said. He restates it, then one question that moves the ball. This is not a debate and not a price drop. If they said “think about it,” stay here — don’t jump to Set until they give a next time.",
    starters: [
      "They said we need to think about it.",
      "Your price is higher than the other guy.",
      "Insurance already said no damage.",
    ],
    brief: `Hat: PUSHBACK. Acknowledge first — restate what they said so they hear it back. Do not argue. Do not drop price on the porch. Comfort, then one question that moves the ball (spouse home, timing, what they actually saw). Delayed replacement = stay in the relationship, set a real next look, do not beg for a signature today.`,
  },
  {
    id: "set",
    label: "Set",
    hint: "Next yes",
    use: "Use after the look, before you hit the driveway. He gets you a morning or afternoon and both names.",
    starters: [
      "Look is done. Both are home. Get the kitchen-table set.",
      "I have the name. They said call next week.",
      "Flip the phone in 20 seconds. What do I show?",
    ],
    brief: `Hat: SET. Goal of a knock is conversation → look → age/condition agreement when true → a set → a name even on a no. Not a porch signature as the default. Set [day] morning or [day] afternoon before the driveway. Both decision-makers.`,
  },
  {
    id: "roleplay",
    label: "Roleplay",
    hint: "You be them",
    use: "Pick who they are, then knock. Hold the mic or type it. He stays the homeowner. Short. Real. No coaching until Score me. Hear it plays his line so you can steal the wording. Practice in the truck. Do not record a customer.",
    starters: [],
    brief: `Hat: ROLEPLAY. You are the homeowner (or spouse) until he types “score me” or “break,” or taps Score me. Stay in character. Short answers, like a real person at the door. He may knock out loud into the mic. Do not coach while in character. After “score me”: drop character, grade keep / cut / say instead (truth, enrollment, no invented storm, no WHY, next physical step, name even on a no). One better sentence he can say out loud, then the next physical step. Then wait — he may knock again as the same person. Never ask him to record a customer.`,
  },
  {
    id: "mindset",
    label: "Mindset",
    hint: "Truck only",
    use: "Why ladder, the demon, pace, talent stack. One question at a time. Private. Never a porch line. Coach me on the Mindset page starts this hat. Read it with Roofus reads their why back.",
    starters: [],
    brief: `Hat: MINDSET. Truck only. Never a porch line. Never quote a book. Never put the demon, the why, or a drill on a door. One question at a time. Wait for the answer. If a worksheet line is already filled in the Mindset appendix, read it back once and skip it. After they answer, it is already on the Mindset page — do not tell them to go type it. Why: number as if earned, by date, what the number buys, who else is on the other side, then the person/promise/version of them. If they ask you to read the why, read their recap in one breath, then ask if it still holds. Demon: one word, where it started, how that radar could help a homeowner, which attack this week (fear = first door in 10; doubt = read Why; just-one-more = stand up). Pace: hours they set, one real off-block, when the phone goes down, gear (sprint/grind/all-day/coast), what they will drop, one thing they already have. Stack: three skills this month, one tiny drill, windshield audio, a night book that is a person not work. Do not dump the whole worksheet.`,
  },
];

export const ROLEPLAY_WHO = [
  { id: "busy", label: "Polite, busy", prompt: "Be a polite busy owner" },
  { id: "skeptic", label: "Three roofers already", prompt: "Be skeptical. You already had three roofers this week" },
  { id: "spouse", label: "Not the decision maker", prompt: "Be a spouse who is not the decision maker" },
] as const;

export type RoleplayWhoId = (typeof ROLEPLAY_WHO)[number]["id"];

export function roleplayKnockLine(who: RoleplayWhoId, year: string): string {
  const w = ROLEPLAY_WHO.find((x) => x.id === who) ?? ROLEPLAY_WHO[0];
  const y = year.trim();
  return y ? `${w.prompt} with a ${y} roof. I knock.` : `${w.prompt}. I knock.`;
}

/** Old Score hat is Roleplay now. */
export function normalizeHat(id: string | null | undefined): RufusHatId {
  if (id === "score") return "roleplay";
  if (id === "door" || id === "inspect" || id === "pushback" || id === "set" || id === "roleplay" || id === "mindset") {
    return id;
  }
  return "door";
}

export function hatById(id: string | null | undefined): RufusHat {
  const want = normalizeHat(id);
  return RUFUS_HATS.find((h) => h.id === want) ?? RUFUS_HATS[0];
}
