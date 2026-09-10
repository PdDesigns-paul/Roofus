import { createFileRoute } from "@tanstack/react-router";
import {
  extractPageCard,
  extractPageLinks,
  extractSitemapLocs,
  extractSiteBrief,
  isPdfUrl,
  isPublicHttpUrl,
  MAX_COMPANY_PAGES,
  normalizeWebsiteUrl,
  pdfCard,
  rankCompanyLinks,
  sameSite,
  siteReadError,
  uniqueCompanyPages,
  type CompanyPage,
} from "@/lib/company-site";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

const FETCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "User-Agent": "Mozilla/5.0 (compatible; RoofusCoach/1.0; +https://roofus.coach)",
};

async function fetchPage(url: string, timeoutMs: number): Promise<{ url: string; html: string; pdf: boolean }> {
  if (!isPublicHttpUrl(url)) throw new Error("That does not look like a website.");
  const res = await fetch(url, {
    headers: FETCH_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Site returned ${res.status}.`);
  const finalUrl = res.url || url;
  if (!isPublicHttpUrl(finalUrl) || !sameSite(url, finalUrl)) {
    throw new Error("That page sent us off their site.");
  }
  const type = res.headers.get("content-type") ?? "";
  if (isPdfUrl(finalUrl) || /pdf/i.test(type)) {
    return { url: finalUrl, html: "", pdf: true };
  }
  const html = await res.text();
  return { url: finalUrl, html: html.slice(0, 400_000), pdf: false };
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

function cardFromFetched(got: { url: string; html: string; pdf: boolean }): CompanyPage {
  if (got.pdf) return pdfCard(got.url);
  return extractPageCard(got.html, got.url);
}

async function crawl(homeUrl: string): Promise<{ url: string; brief: string; pages: CompanyPage[] }> {
  const home = await fetchPage(homeUrl, 12_000);
  if (home.pdf) {
    const page = pdfCard(home.url);
    return { url: home.url, brief: page.look, pages: [page] };
  }
  const text = extractSiteBrief(home.html);
  if (!text) throw new Error("That page had no text I could read.");
  const homeCard = extractPageCard(home.html, home.url);
  let pool = extractPageLinks(home.html, home.url);
  if (rankCompanyLinks(pool, home.url).length < 4) {
    try {
      const smUrl = new URL("/sitemap.xml", home.url).toString();
      const sm = await fetchPage(smUrl, 6_000);
      if (!sm.pdf) pool = [...pool, ...extractSitemapLocs(sm.html, home.url)];
    } catch {
      /* sitemap is optional */
    }
  }
  const extraUrls = rankCompanyLinks(pool, home.url).slice(0, MAX_COMPANY_PAGES - 1);
  const extras = await Promise.all(
    extraUrls.map(async (u) => {
      try {
        return cardFromFetched(await fetchPage(u, 8_000));
      } catch {
        return null;
      }
    }),
  );
  const pages = uniqueCompanyPages([homeCard, ...extras.filter((p): p is CompanyPage => Boolean(p))]);
  const notes = pages.map((p) => `${p.title}: ${p.look}`).join("\n");
  const brief = (await summarize(home.url, `${text}\n\n${notes}`)) || text.slice(0, 900);
  return { url: home.url, brief, pages };
}

async function handlePost({ request }: { request: Request }) {
  let url = "";
  try {
    const body = (await request.json()) as { url?: string };
    url = normalizeWebsiteUrl(body.url ?? "") ?? "";
  } catch {
    return json({ error: "Need a website." }, 400);
  }
  if (!url || !isPublicHttpUrl(url)) return json({ error: "That does not look like a website." }, 400);
  try {
    const out = await crawl(url);
    return json(out);
  } catch (e) {
    return json({ error: siteReadError(e) }, 422);
  }
}

export const Route = createFileRoute("/api/company-site")({
  server: { handlers: { POST: handlePost } },
});
