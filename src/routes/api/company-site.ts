import { createFileRoute } from "@tanstack/react-router";
import { htmlToText, normalizeWebsiteUrl } from "@/lib/company-site";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "RoofusCoach/1.0 (https://roofus.coach; company site read)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`Site returned ${res.status}.`);
  const html = await res.text();
  return htmlToText(html).slice(0, 8000);
}

async function summarize(url: string, text: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return text.slice(0, 900);
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 280,
      messages: [
        {
          role: "system",
          content:
            "Summarize this company website for a door-to-door roofing canvasser. Facts only: name, towns, product, warranty they advertise, phone, hours. Do not invent. Under 120 words.",
        },
        { role: "user", content: `URL: ${url}\n\n${text.slice(0, 6000)}` },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return text.slice(0, 900);
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return (body.choices?.[0]?.message?.content ?? "").trim() || text.slice(0, 900);
}

async function handlePost({ request }: { request: Request }) {
  let url = "";
  try {
    const body = (await request.json()) as { url?: string };
    url = normalizeWebsiteUrl(body.url ?? "") ?? "";
  } catch {
    return json({ error: "Need a website." }, 400);
  }
  if (!url) return json({ error: "That does not look like a website." }, 400);
  try {
    const text = await fetchPage(url);
    if (!text) return json({ error: "That page had no text I could read." }, 422);
    const brief = await summarize(url, text);
    return json({ url, brief });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not read that site.";
    return json({ error: message }, 422);
  }
}

export const Route = createFileRoute("/api/company-site")({
  server: { handlers: { POST: handlePost } },
});
