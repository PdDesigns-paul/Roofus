export const MINDSET = [
  {
    id: "door",
    title: "The door",
    body: "Default is age and a free look. Storm talk only if a real logged storm hit that street. Do not invent neighbors. Enroll. Small yeses. Get a name even on a no.",
  },
  {
    id: "photos",
    title: "After photos",
    body: "Bad / Good / Worst. The good must be true. Can you see this? How long? How does that make you feel? What would you like to do about it? Never WHY in the house. Do not announce off the ladder.",
  },
  {
    id: "options",
    title: "Three honest options",
    body: "Insurance only if storm damage is actually on the roof. Repair if it can be saved (in-house under about $1,500). Retail replacement if the system is at end of life. Ask to present before paper. Set a day-part before the driveway.",
  },
  {
    id: "truth",
    title: "Honesty first",
    body: "A claim can be denied. Looking at a roof has risk. Do not sign unread paper. Carrier decides. We document. We do not control approval. Pennsylvania is two-party consent — no recording without a clear yes.",
  },
];

export function mindsetKnowledge(): string {
  return MINDSET.map((m) => `### ${m.title}\n${m.body}`).join("\n\n");
}
