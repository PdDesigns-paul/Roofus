export type RufusHatId = "door" | "inspect" | "pushback" | "set" | "roleplay" | "score";

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
    use: "Use this on the walk-up or while the door is still moving. Tell him what just happened — half-closed, “are you selling,” busy, whatever. He hands you the next line. Do not use this hat for kitchen-table closes or product talk.",
    starters: [
      "Door is half closed. 2004 roof. Cut to the chase.",
      "They asked if we are selling something.",
      "Give me the age / free-look hook. No fake neighbors.",
    ],
    brief: `Hat: DOOR. First 30 seconds on the porch. Default is age and a free look (script B). Storm talk only if a real logged storm hit that street. SLAP in his head: say hi, let them know why you stopped, ask one open question, present only to their answer. If the door is closing: “I’ll cut right to the chase,” then the L. One line he can say, why it works, then the next physical step. Do not invent we-are-working-next-door.`,
  },
  {
    id: "inspect",
    label: "Inspect",
    hint: "On the roof",
    use: "Use this on the roof or walking to the ladder. Tell him what you saw. He sequences photos and the i35 questions. Roof science lives in Reference — don’t ask him to paste articles. Shoot a photo on Inspect when you need him to look at a frame. Lines you will say about damage stay in plain homeowner English.",
    starters: [
      "Walk me i35. Granule loss on the south slope.",
      "I am about to come off the ladder. What do I not say?",
      "They came outside while I was on the roof.",
    ],
    brief: `Hat: INSPECT. He is on the roof or just off it. After photos: Bad / Good / Worst. The good must be true. Ask: Can you see this? How long / has anybody shown you? How does that make you feel? What would you like to do about it? Never WHY in the house. Do not announce findings off the ladder. Point him to Reference for roof science and to Inspect for a photo question. Do not paste article bodies. When you write what he should say about the roof, use 5th-grade homeowner English: plain meaning first, then the roof word.`,
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
    use: "Use after the look, before you hit the driveway. He gets you a morning or afternoon and both names. Flip-the-phone is this hat: range and what’s included, never a rate. Not a porch signature.",
    starters: [
      "Look is done. Both are home. Get the kitchen-table set.",
      "I have the name. They said call next week.",
      "Flip the phone in 20 seconds. What do I show?",
    ],
    brief: `Hat: SET. Goal of a knock is conversation → look → age/condition agreement when true → a set → a name even on a no. Not a porch signature as the default. Set [day] morning or [day] afternoon before the driveway. Both decision-makers. If he is about to flip the phone: range and the included list, never $/square, never $550.`,
  },
  {
    id: "roleplay",
    label: "Roleplay",
    hint: "You be them",
    use: "Tell him who to be, then knock. He stays the homeowner — short, real, no coaching. Type “score me” or “break” when you want the grade. Use this to get reps talking before they hit a street, not to write scripts.",
    starters: [
      "Be a polite busy owner with a 2004 roof. I knock.",
      "Be skeptical. You already had three roofers this week.",
      "Be a spouse who is not the decision maker.",
    ],
    brief: `Hat: ROLEPLAY. You are the homeowner (or spouse) until he types “score me” or “break.” Stay in character. Short answers, like a real person at the door. Do not coach while in character. After “score me”: drop character, grade the knock, give one better sentence, then the next physical step.`,
  },
  {
    id: "score",
    label: "Score",
    hint: "Grade it",
    use: "Paste what you said, or a knock you already ran. He grades keep / cut / say instead. Use after Roleplay or after a real door. Don’t use this to draft a line — that’s Door or Pushback.",
    starters: [
      "Score this knock: I said we were in the neighborhood doing roofs.",
      "Score this close: I asked if they wanted to move forward today.",
      "I used WHY in the kitchen. How bad?",
    ],
    brief: `Hat: SCORE. Grade what he just did. Be kind and exact. Marks: truth, enrollment (small yeses), no invented storm, no WHY, next physical step, name even on a no. Letter grade plus three bullets: keep, cut, say instead. Then one better sentence.`,
  },
];

export function hatById(id: string | null | undefined): RufusHat {
  return RUFUS_HATS.find((h) => h.id === id) ?? RUFUS_HATS[0];
}
