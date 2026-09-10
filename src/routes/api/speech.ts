import { createFileRoute } from "@tanstack/react-router";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function speakable(raw: string) {
  return raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_>`]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);
}

async function handlePost({ request }: { request: Request }) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return json({ error: "Voice is asleep. AI is not available here." }, 503);

  let body: { text?: string };
  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return json({ error: "Nothing to read." }, 400);
  }
  const input = speakable(body.text ?? "");
  if (!input) return json({ error: "Nothing to read." }, 400);

  const upstream = await fetch("https://api.x.ai/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-tts",
      voice: "eve",
      input,
    }),
  });
  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    return json({ error: errText.slice(0, 180) || `Could not read that (${upstream.status}).` }, 502);
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") || "audio/mpeg",
      "cache-control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/speech")({
  server: { handlers: { POST: handlePost } },
});
