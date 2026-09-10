import { createFileRoute } from "@tanstack/react-router";
import { extractSiteBrief, normalizeWebsiteUrl, siteReadError } from "@/lib/company-site";

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
      "User-Agent": "Mozilla/5.0 (compatible; RoofusCoach/1.0; +https://roofus.coach)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`Site returned ${res.status}.`);
  const html = await res.text();
  return html.slice(0, 400_000);
}

/** Grok is a polish. The page text already saved is the brief if he is slow. */
async function summarize(url: string, text: string): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content:
              "Summarize this company website for a door-to-door roofing canvasser. Facts only: name, towns, product, warranty they advertise, phone, hours. Do not invent. Under 120 words.",
          },
          { role: "user", content: `URL: ${url}\n\n${text.slice(0, 3500)}` },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return (body.choices?.[0]?.message?.content ?? "").trim() || null;
  } catch {
    return null;
  }
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
    const html = await fetchPage(url);
    const text = extractSiteBrief(html);
    if (!text) return json({ error: "That page had no text I could read." }, 422);
    const brief = (await summarize(url, text)) || text.slice(0, 900);
    return json({ url, brief });
  } catch (e) {
    return json({ error: siteReadError(e) }, 422);
  }
}

export const Route = createFileRoute("/api/company-site")({
  server: { handlers: { POST: handlePost } },
});
