import { createFileRoute } from "@tanstack/react-router";
import { buildXaiPayload, type CoachRequest } from "@/lib/coach-prompt";
import { bookFromRequest } from "@/lib/coach-book";
import { modelFor } from "@/lib/coach-model";
import {
  runToolRound,
  toolsOnFor,
  TOOLS_FALLBACK,
  coachToolDefs,
  TOOLS_BRIEF,
  type ToolCall,
} from "@/lib/coach-tools";
import { hostFromHeaders, resolvePack, tenantEnvId } from "@/lib/tenant";


function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function sseChunk(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function sseStream(write: (send: (payload: unknown) => void) => Promise<void>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(sseChunk(payload)));
      };
      try {
        await write(send);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        try {
          send({ error: "Roofus missed that. Try again." });
          controller.close();
        } catch {
          /* already closed */
        }
      }
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

type XaiToolCall = {
  id?: string;
  type?: string;
  function?: { name?: string; arguments?: string };
};

type XaiMessage = {
  role?: string;
  content?: string | null;
  tool_calls?: XaiToolCall[];
  tool_call_id?: string;
};

async function xaiPost(apiKey: string, body: unknown, signal: AbortSignal) {
  const stream = Boolean(body && typeof body === "object" && (body as { stream?: boolean }).stream);
  return fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Accept: stream ? "text/event-stream" : "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
}

function toolCallsFrom(message: XaiMessage | undefined): ToolCall[] {
  return (message?.tool_calls ?? [])
    .map((call) => ({
      id: call.id,
      name: call.function?.name ?? "",
      arguments: call.function?.arguments ?? "{}",
    }))
    .filter((call) => call.name);
}

function pipeXaiSse(upstream: Response) {
  const decoder = new TextDecoder();
  const reader = upstream.body!.getReader();
  let carry = "";
  return sseStream(async (send) => {
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
          const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
          const t = parsed.choices?.[0]?.delta?.content;
          if (t) send({ t });
        } catch {
          /* keepalives */
        }
      }
    }
  });
}

async function handlePost({ request }: { request: Request }) {
  const pack = resolvePack(tenantEnvId(), hostFromHeaders(request.headers));
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

  const useTools = toolsOnFor(req);
  const built = buildXaiPayload(req);
  const book = bookFromRequest(req);
  const system = built.messages[0];
  const payload = {
    ...built,
    model: modelFor(req.mode ?? req.hat, req.origin),
    stream: !useTools,
    messages:
      useTools && system && "content" in system && typeof system.content === "string"
        ? [{ ...system, content: `${system.content}\n\n${TOOLS_BRIEF}` }, ...built.messages.slice(1)]
        : built.messages,
    ...(useTools ? { tools: coachToolDefs(pack), tool_choice: "auto" as const } : {}),

  };

  if (!useTools) {
    const upstream = await xaiPost(apiKey, payload, request.signal);
    if (!upstream.ok || !upstream.body) {
      return json({ error: `Roofus hit a snag (${upstream.status}).` }, 502);
    }
    return pipeXaiSse(upstream);
  }

  const messages: XaiMessage[] = payload.messages as XaiMessage[];
  let rounds = 0;

  while (rounds < 2) {
    const upstream = await xaiPost(apiKey, { ...payload, messages, stream: false }, request.signal);
    if (!upstream.ok) {
      return json({ error: `Roofus hit a snag (${upstream.status}).` }, 502);
    }
    const body = (await upstream.json()) as { choices?: { message?: XaiMessage }[] };
    const message = body.choices?.[0]?.message;
    const calls = toolCallsFrom(message);
    if (!calls.length) {
      const text = (message?.content ?? "").trim() || TOOLS_FALLBACK;
      return sseStream(async (send) => {
        send({ t: text });
      });
    }
    const ran = runToolRound(calls, book, rounds);
    if (ran.skipped) break;
    rounds += 1;
    messages.push({
      role: "assistant",
      content: message?.content ?? null,
      tool_calls: message?.tool_calls,
    });
    for (const item of ran.executed as { id: string; name: string; result: unknown }[]) {
      messages.push({
        role: "tool",
        tool_call_id: item.id,
        content: JSON.stringify(item.result),
      });
    }
  }

  const answer = await xaiPost(
    apiKey,
    { ...payload, messages, stream: true, tools: undefined, tool_choice: undefined },
    request.signal,
  );
  if (!answer.ok || !answer.body) {
    return sseStream(async (send) => {
      send({ t: TOOLS_FALLBACK });
    });
  }
  return pipeXaiSse(answer);
}

export const Route = createFileRoute("/api/coach")({
  server: { handlers: { POST: handlePost } },
});
