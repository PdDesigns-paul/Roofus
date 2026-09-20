/** Pack `pest` inspect walk. Kernel Place stays Inspect; these rows are data. */
import type { InspectPack } from "../pack.ts";

export const PEST_INSPECT: InspectPack = {
  reportName: "Site folder",
  cameraTip: "One frame. Prove this house.",
  practiceTip: "Sample only — not this house.",
  askStarters: ["What am I looking at?", "Is this a harborage or just mulch?", "What do I say about this?"],
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
      id: "foundation",
      title: "Foundation",
      hint: "Grade, cracks, wood-to-soil.",
      askPrompt: "What am I looking at?",
      blurb: "Conducive conditions, not a diagnosis. Do not invent termites.",
      checks: ["Grade vs siding", "Visible crack or gap", "Wood touching soil"],
    },
    {
      id: "eaves",
      title: "Eaves",
      hint: "Soffit, fascia, entry at the roofline.",
      askPrompt: "What am I looking at?",
      blurb: "Entry and harbor, not a storm file.",
      checks: ["Soffit gap", "Fascia", "One corner close"],
    },
    {
      id: "harbor",
      title: "Harborages",
      hint: "Mulch, garage gap, pet bowls.",
      askPrompt: "Is this a harborage or just mulch?",
      blurb: "Where pests live when they are not in the kitchen.",
      checks: ["Mulch against siding", "Garage door gap", "Pet bowls / standing water"],
    },
    {
      id: "access",
      title: "Access",
      hint: "How you walked it. Gate, side yard, crawl.",
      askPrompt: "How do I talk about access?",
      blurb: "Safe path, not a stunt.",
      checks: ["Gate or side", "Landing", "Path you used"],
    },
  ],
};
