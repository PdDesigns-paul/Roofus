/** Chat completions: OpenRouter first, xAI if that key is missing. Speech/transcribe stay on xAI. */

export type LlmProvider = "openrouter" | "xai";

export type LlmEndpoint = {
  provider: LlmProvider;
  url: string;
  key: string;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const XAI_URL = "https://api.x.ai/v1/chat/completions";

export function llmEndpoint(): LlmEndpoint | null {
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouter) {
    return { provider: "openrouter", url: OPENROUTER_URL, key: openrouter };
  }
  const xai = process.env.XAI_API_KEY?.trim();
  if (xai) {
    return { provider: "xai", url: XAI_URL, key: xai };
  }
  return null;
}

export function llmHeaders(ep: LlmEndpoint, stream: boolean): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ep.key}`,
    Accept: stream ? "text/event-stream" : "application/json",
  };
  if (ep.provider === "openrouter") {
    headers["HTTP-Referer"] = "https://roofus.coach";
    headers["X-Title"] = "Roofus";
  }
  return headers;
}

export function llmPost(ep: LlmEndpoint, body: unknown, signal: AbortSignal) {
  const stream = Boolean(body && typeof body === "object" && (body as { stream?: boolean }).stream);
  return fetch(ep.url, {
    method: "POST",
    headers: llmHeaders(ep, stream),
    body: JSON.stringify(body),
    signal,
  });
}

function stripFence(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/u, "").trim();
}

export async function llmComplete(opts: {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  timeoutMs?: number;
}): Promise<string | null> {
  const ep = llmEndpoint();
  if (!ep) return null;
  try {
    const res = await llmPost(
      ep,
      {
        model: opts.model,
        max_tokens: opts.maxTokens,
        stream: false,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
      },
      AbortSignal.timeout(opts.timeoutMs ?? 10_000),
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = stripFence(body.choices?.[0]?.message?.content ?? "");
    return text || null;
  } catch {
    return null;
  }
}
