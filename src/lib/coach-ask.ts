import { createServerFn } from "@tanstack/react-start";
import { COACH_SYSTEM } from "@/lib/coach-system";
import { inspectKnowledge } from "@/lib/mri-index";
import { mindsetKnowledge } from "@/lib/mindset";
import { hatById } from "@/lib/rufus-hats";

export type ChatTurn = { role: "user" | "assistant"; content: string };

const KNOWLEDGE = `
# Reference knowledge base
${inspectKnowledge()}

# Mindset knowledge base
${mindsetKnowledge()}
`;

export const askCoach = createServerFn({ method: "POST" })
  .validator((input: { messages: ChatTurn[]; ticketBlurb?: string; hat?: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; text: string } | { ok: false; error: string }> => {
      try {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) return { ok: false, error: "Roofus is asleep. AI is not available here." };
        const hat = hatById(data.hat);
        const extra = [
          `\n\n${hat.brief}`,
          KNOWLEDGE,
          data.ticketBlurb
            ? `Current ticket (use these numbers, do not invent):\n${data.ticketBlurb}`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n");
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            max_tokens: 550,
            messages: [
              { role: "system", content: COACH_SYSTEM + extra },
              ...data.messages.slice(-16),
            ],
          }),
          signal: AbortSignal.timeout(45_000),
        });
        if (!res.ok) return { ok: false, error: `Roofus hit a snag (${res.status}).` };
        const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        return { ok: true, text: body.choices?.[0]?.message?.content ?? "…" };
      } catch {
        return { ok: false, error: "Roofus missed that. Try again." };
      }
    },
  );
