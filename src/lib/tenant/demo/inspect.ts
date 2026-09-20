/** Pack `demo` inspect walk. Kernel Place stays Inspect; these rows are data. */
import type { InspectPack } from "../pack.ts";

export const DEMO_INSPECT: InspectPack = {
  reportName: "Site folder",
  cameraTip: "One frame. Prove this house.",
  practiceTip: "Sample only — not this house.",
  askStarters: ["What am I looking at?", "Is this the worn row?", "What do I say about this?"],
  steps: [
    {
      id: "curb",
      title: "Curb",
      hint: "Mailbox and the house. Prove which one.",
      askPrompt: "What am I looking at?",
      blurb: "One frame that proves this house, not the neighbor.",
      checks: ["House number", "Full front", "Driveway side"],
    },
    {
      id: "array",
      title: "Array",
      hint: "The rows. Same height if you can.",
      askPrompt: "Did I get the rows?",
      blurb: "Walk the box. Do not invent a count.",
      checks: ["South row", "East row", "West row"],
    },
    {
      id: "inverter",
      title: "Inverter",
      hint: "The box. Labels if they are readable.",
      askPrompt: "What does this label say?",
      blurb: "The equipment, filling the frame.",
      checks: ["The inverter", "A label or serial", "Conduit into it"],
    },
    {
      id: "access",
      title: "Access",
      hint: "How you got up. Hatch, ladder, ground.",
      askPrompt: "How do I talk about access?",
      blurb: "Safe path, not a stunt.",
      checks: ["The hatch or ladder", "A landing", "A ground shot of the path"],
    },
  ],
};
