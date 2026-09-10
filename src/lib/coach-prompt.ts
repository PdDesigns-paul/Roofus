import { COACH_SYSTEM } from "@/lib/coach-system";
import { INSPECT_SYSTEM } from "@/lib/inspect-system";
import { inspectKnowledge, inspectKnowledgeForShot } from "@/lib/mri-index";
import { mindsetKnowledge } from "@/lib/mindset";
import { modeBrief } from "@/lib/rufus-modes";
import { companyPagesKnowledge, type CompanyPage } from "@/lib/company-site";
import type { ChatTurn } from "@/lib/stream-coach";

const KNOWLEDGE = `
# Reference knowledge base
${inspectKnowledge()}

# Mindset knowledge base
${mindsetKnowledge()}
`;

export type CoachRequest = {
  messages: ChatTurn[];
  mode?: string;
  scene?: string;
  who?: string;
  year?: string;
  origin?: string;
  hat?: string;
  companyName?: string;
  warrantyLine?: string;
  companyWebsite?: string;
  companySiteBrief?: string;
  companySitePages?: Pick<CompanyPage, "title" | "look" | "url">[];
  imageDataUrl?: string;
  dayBook?: string;
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
    const extraShot = inspectKnowledgeForShot();
    const stormNote = req.dayBook?.trim()
      ? `\n\nIf they logged a storm, still do not invent hail. Pattern from the photo, not the log.`
      : "";
    return {
      model: "grok-4.5",
      max_tokens: 400,
      stream: true,
      messages: [
        { role: "system", content: `${INSPECT_SYSTEM}\n\n${extraShot}` },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: req.imageDataUrl, detail: "high" } },
            { type: "text", text: question + stormNote },
          ],
        },
      ],
    };
  }

  const brief = modeBrief(req.mode ?? req.hat, req.scene, req.who, req.year, req.origin);
  const extra = [
    `\n\n${brief}`,
    KNOWLEDGE,
    req.companyName?.trim() ? `Company name from Presets: ${req.companyName.trim()}` : "",
    req.warrantyLine?.trim()
      ? `Warranty line from Presets (this wins over the default): ${req.warrantyLine.trim()}`
      : "",
    req.companyWebsite?.trim() ? `Company website they gave you: ${req.companyWebsite.trim()}` : "",
    req.companySiteBrief?.trim()
      ? `What you already read on that site (do not invent past this):\n${req.companySiteBrief.trim()}`
      : req.companyWebsite?.trim()
        ? "They gave a website but you have not read it yet. Do not invent product claims from the URL."
        : "",
    companyPagesKnowledge(req.companySitePages ?? []),
    req.dayBook?.trim() ? req.dayBook.trim() : "",
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
