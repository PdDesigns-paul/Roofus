import { createFileRoute } from "@tanstack/react-router";
import { buildXaiPayload, type CoachRequest } from "@/lib/coach-prompt";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handlePost({ request }: { request: Request }) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return json({ error: "Roofus is asleep. AI is not available here." }, 503);

  let req: CoachRequest;
  try {
    req = (await request.json()) as CoachRequest;
  } catch {
    return json({ error: "Roofus missed that. Try again." }, 400);
  }
  if (!Array.isArray(req.messages) || req.messages.length === 0) {
    return json({ error: "Ask him something." }, 400);
  }
  if (req.imageDataUrl) {
    if (!req.imageDataUrl.startsWith("data:image/")) {
      return json({ error: "That photo did not load. Try another." }, 400);
    }
    if (req.imageDataUrl.length > 1_200_000) {
      return json({ error: "Photo is too heavy. Back up a step and shoot again." }, 400);
    }
  }

  const payload = buildXaiPayload(req);
  const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal: request.signal,
  });
  if (!upstream.ok || !upstream.body) {
    return json({ error: `Roofus hit a snag (${upstream.status}).` }, 502);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();
  let carry = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          carry += decoder.decode(value, { stream: true });
          const lines = carry.split("\n");
          carry = lines.pop() ?? "";
          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const t = parsed.choices?.[0]?.delta?.content;
              if (t) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t })}\n\n`));
            } catch {
              /* skip keepalives */
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Roofus missed that. Try again." })}\n\n`),
          );
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      void reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export const Route = createFileRoute("/api/coach")({
  server: { handlers: { POST: handlePost } },
});
