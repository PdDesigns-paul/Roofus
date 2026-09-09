import { createServerFn } from "@tanstack/react-start";
import { INSPECT_SYSTEM } from "@/lib/inspect-system";
import { inspectKnowledge } from "@/lib/mri-index";

const KNOWLEDGE = `# Reference knowledge base\n${inspectKnowledge()}`;

export const askInspect = createServerFn({ method: "POST" })
  .validator((input: { question: string; imageDataUrl: string }) => input)
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; text: string } | { ok: false; error: string }> => {
      try {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) return { ok: false, error: "Roofus is asleep. AI is not available here." };
        const question = data.question.trim();
        const image = data.imageDataUrl.trim();
        if (!question) return { ok: false, error: "Ask him something about the shot." };
        if (!image.startsWith("data:image/")) {
          return { ok: false, error: "That photo did not load. Try another." };
        }
        if (image.length > 1_200_000) {
          return { ok: false, error: "Photo is too heavy. Back up a step and shoot again." };
        }
        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            max_tokens: 400,
            messages: [
              { role: "system", content: `${INSPECT_SYSTEM}\n\n${KNOWLEDGE}` },
              {
                role: "user",
                content: [
                  { type: "image_url", image_url: { url: image, detail: "high" } },
                  { type: "text", text: question },
                ],
              },
            ],
          }),
          signal: AbortSignal.timeout(60_000),
        });
        if (!res.ok) return { ok: false, error: `Roofus hit a snag (${res.status}).` };
        const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        return { ok: true, text: body.choices?.[0]?.message?.content ?? "…" };
      } catch {
        return { ok: false, error: "Roofus missed that. Try again." };
      }
    },
  );
