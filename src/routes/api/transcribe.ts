import { createFileRoute } from "@tanstack/react-router";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handlePost({ request }: { request: Request }) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return json({ error: "Mic is asleep. AI is not available here." }, 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "No audio on that tap." }, 400);
  }
  const file = form.get("audio");
  if (!(file instanceof File) || file.size < 400) {
    return json({ error: "Hold a little longer, then let go." }, 400);
  }
  if (file.size > 8_000_000) return json({ error: "That clip is too long. Try a shorter knock." }, 400);

  const up = new FormData();
  up.append("file", file, file.name || "knock.webm");
  up.append("model", "grok-stt");

  const upstream = await fetch("https://api.x.ai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: up,
  });
  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    return json({ error: errText.slice(0, 180) || `Could not hear that (${upstream.status}).` }, 502);
  }
  const data = (await upstream.json()) as { text?: string };
  const text = (data.text ?? "").trim();
  if (!text) return json({ error: "Didn’t catch a word. Hold and knock again." }, 422);
  return json({ text });
}

export const Route = createFileRoute("/api/transcribe")({
  server: { handlers: { POST: handlePost } },
});
