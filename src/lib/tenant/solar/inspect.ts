/** Pack `solar` inspect walk. Kernel Place stays Inspect; these rows are data. */
import type { InspectPack } from "../pack.ts";

export const SOLAR_INSPECT: InspectPack = {
  reportName: "Site folder",
  cameraTip: "One frame. Prove this house.",
  practiceTip: "Sample only — not this house.",
  askStarters: ["What am I looking at?", "Is this shade or just a tree at noon?", "What do I say about this roof year?"],
  steps: [
    {
      id: "curb",
      title: "Curb",
      hint: "Mailbox and the house. Prove which one.",
      askPrompt: "What am I looking at?",
      blurb: "One frame that proves this house.",
      checks: ["House number", "Full front", "Driveway side"],
    },
    {
      id: "roof",
      title: "Roof / array",
      hint: "Covering first, then any existing rows.",
      askPrompt: "What do I say about this roof year?",
      blurb: "Year and condition are questions. Do not invent remaining life.",
      checks: ["Field of shingles", "Existing array or none", "Penetrations you can see"],
    },
    {
      id: "shade",
      title: "Shade",
      hint: "Trees, dormers, neighbor massing.",
      askPrompt: "Is this shade or just a tree at noon?",
      blurb: "Shade is observed, not modeled. No CAD.",
      checks: ["South face", "A tree or dormer", "One obstruction close"],
    },
    {
      id: "meter",
      title: "Meter / inverter",
      hint: "Meter can, inverter, labels if readable.",
      askPrompt: "What does this label say?",
      blurb: "Equipment in the frame. Do not invent a serial you cannot read.",
      checks: ["Meter", "Inverter or none", "A readable label"],
    },
    {
      id: "access",
      title: "Access",
      hint: "Hatch, ladder, ground.",
      askPrompt: "How do I talk about access?",
      blurb: "Safe path, not a stunt.",
      checks: ["Hatch or ladder", "Landing", "Ground shot of the path"],
    },
  ],
};
