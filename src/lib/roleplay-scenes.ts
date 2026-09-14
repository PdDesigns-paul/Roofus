import type { RoleplaySceneId } from "./coach-modes.ts";

export const ROLEPLAY_SCENES: {
  id: RoleplaySceneId;
  label: string;
  hint: string;
  brief: string;
}[] = [
  {
    id: "walkup",
    label: "Walk-up",
    hint: "First 30 seconds",
    brief: `Beat: WALK-UP. First 30 seconds on the porch. Default is the million-dollar script (Script B — age and a free look). Dashaun Bryant’s public opener, told honest:

“Hey — I’m [name] with [company]. I stopped by to see if you heard what’s been going on in the area.”
They: “No — what’s going on?”
“A lot of these houses are on the original roof from around [year]. That’s first-roof age. We’re doing free looks this week. Do you know what year this one went on?”
Before the ladder: “We’d both agree this roof is at the age where it’s time to plan a replacement, right?”

Storm talk (Script A) only if a real logged storm hit that street. Do not invent hail to finish “what’s been going on.” SLAP in his head: say hi, let them know why you stopped, ask one open question, present only to their answer. If the door is closing: “I’ll cut right to the chase,” then the L. Stay the homeowner. Short. Real. End this beat at a ladder yes, or a name on a no.`,
  },
  {
    id: "claim",
    label: "Claim path",
    hint: "After Keep",
    brief: `Beat: CLAIM PATH. After Keep. You are the homeowner until Score me / break.
A kept storm hit this zip. Do not invent a second storm or a size.
They already used an honest intro. This beat is the claim-stage question, not a fake-hail tease on “what’s been going on.”
First question they should ask: “Where are you at with insurance on the house — nothing filed, adjuster’s been out, they paid something, they denied it, or you already have a check?”
You answer as one of those five. They present only to that. If they dump all five stages, that is a cut on Score me.
Document first. No claim speech until something is on camera. There are still no photos in this chat.
Deductible early: average is a few thousand. “Are you comfortable with that before we go further?” If no, clean leave + name.
Do not say every carrier pays. Do not promise a flip on a denial. Do not say “insurance will pay for a brand new roof.”
End the beat at: a look / document path, a phone or in-home set, or a clean no with a name.

Score me extras: truth (no invented storm, no “every carrier pays,” no flip promise); one stage only; deductible asked before they pitch a claim; document first; name even on a no; next physical step.`,
  },
  {
    id: "push",
    label: "They push",
    hint: "Objections",
    brief: `Beat: THEY PUSH. They already objected. Acknowledge first — restate what they said so they hear it back. Do not argue. Do not drop price on the porch. Comfort, then one question that moves the ball (spouse home, timing, what they actually saw). Delayed replacement = stay in the relationship, set a real next look, do not beg for a signature today. Stay the homeowner. End this beat at a next look, or a clean no with a name.`,
  },
  {
    id: "after",
    label: "After photos",
    hint: "i35 talk",
    brief: `Beat: AFTER PHOTOS. Talk only. There is no picture in this chat. They already showed photos off the roof. You did not see a frame. Stay the homeowner. After photos: Bad / Good / Worst. The good must be true. They should ask: Can you see this? How long / has anybody shown you? How does that make you feel? What would you like to do about it? Never WHY in the house. Do not announce findings as if still on the ladder. When they talk damage, they should use 5th-grade homeowner English. End this beat when they pick a path (insurance / repair / replace) or you shut it down.`,
  },
  {
    id: "walk",
    label: "Walk",
    hint: "Buying questions",
    brief: `Beat: WALK. Buying questions. You are the homeowner until Score me / break.
Look is done. i35 already happened. There are no photos in this chat.
They are walking the property with you. Short answers. Real person. Walk the house.
They should ask open buying questions, not dump a pitch. From doctrine, any 3–4 of:
- How long have you been thinking about it?
- Anyone else been out?
- Leak history / attic stains / a claim already filed?
- Cash, finance, or only-if-insurance?
- Who else has to see a number?
- In-person or a phone review after photos?
Do not drop price on the grass. Do not ask WHY (that is Mindset). Do not announce a square count or a bid.
Three options stay in the next beat (Set) unless they ask “so what do we do?” Then one sentence: we can talk insurance / repair / replace from what you already agreed you saw — then back to a buying question or a set.
End this beat when they name a constraint (spouse, money path, timing) or they shut it down. Next physical step is Set, not a porch signature.

Score me extras: cut if they pitch a number, ask WHY, skip to a signature, talk only on the porch, ignore “who else has to see a number.” Keep if they ask one open question at a time, restate a constraint, book Set as the next step.`,
  },
];
