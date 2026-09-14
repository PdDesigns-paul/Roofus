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
];
