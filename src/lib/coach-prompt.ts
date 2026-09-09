import { COACH_SYSTEM } from "@/lib/coach-system";
import { INSPECT_SYSTEM } from "@/lib/inspect-system";
import { inspectKnowledge } from "@/lib/mri-index";
import { mindsetKnowledge } from "@/lib/mindset";
import { hatById } from "@/lib/rufus-hats";
import type { ChatTurn } from "@/lib/stream-coach";

const KNOWLEDGE = `
# Reference knowledge base
${inspectKnowledge()}

# Mindset knowledge base
${mindsetKnowledge()}
`;

const INSPECT_KNOWLEDGE = `# Reference knowledge base\n${inspectKnowledge()}`;

export type CoachRequest = {
  messages: ChatTurn[];
  hat?: string;
  ticketBlurb?: string;
  houseBlurb?: string;
  companyName?: string;
  warrantyLine?: string;
  imageDataUrl?: string;
};

type XaiMessage =
  | { role: "system" | "assistant"; content: string }
  | {
      role: "user";
      content:
        | string
        | { type: "text"; text: string }[]
        | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "high" } })[];
    };

export function buildXaiPayload(req: CoachRequest): {
  model: string;
  max_tokens: number;
  stream: true;
  messages: XaiMessage[];
} {
  const history = req.messages.slice(-16);
  if (req.imageDataUrl) {
    const last = [...history].reverse().find((m) => m.role === "user");
    const question = last?.content?.trim() || "What am I looking at?";
    return {
      model: "grok-4.5",
      max_tokens: 400,
      stream: true,
      messages: [
        { role: "system", content: `${INSPECT_SYSTEM}\n\n${INSPECT_KNOWLEDGE}` },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: req.imageDataUrl, detail: "high" } },
            { type: "text", text: question },
          ],
        },
      ],
    };
  }

  const hat = hatById(req.hat);
  const blurb = req.houseBlurb || req.ticketBlurb;
  const extra = [
    `\n\n${hat.brief}`,
    KNOWLEDGE,
    blurb ? `This House (facts for this pin — if a year is missing, say so):\n${blurb}` : "",
    req.companyName?.trim() ? `Company name from Presets: ${req.companyName.trim()}` : "",
    req.warrantyLine?.trim()
      ? `Warranty line from Presets (this wins over the default): ${req.warrantyLine.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    model: "grok-4.5",
    max_tokens: 550,
    stream: true,
    messages: [
      { role: "system", content: COACH_SYSTEM + extra },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ],
  };
}
