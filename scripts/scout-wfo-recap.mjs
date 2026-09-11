/**
 * Slice 4: one WFO recap adapter. Open data first (api.weather.gov PNS).
 * Playwright only when the feed is mute. Captcha / login → unknown.
 * One county they knock — McKean is not Cumberland.
 */
const UA = "RoofusCoach/1.0 (https://roofus.coach; sidecar WFO recap)";

function wfoSite(wfo) {
  return String(wfo || "")
    .trim()
    .toLowerCase();
}

export function wfoForCounty(county, state) {
  const st = String(state || "")
    .trim()
    .toUpperCase();
  const c = String(county || "")
    .trim()
    .toLowerCase()
    .replace(/\s+county$/, "");
  if (st === "PA" || st === "42") {
    if (["cumberland", "dauphin", "perry", "york", "adams", "franklin", "lebanon"].includes(c)) {
      return "ctp";
    }
  }
  return "";
}

export function pnsUrl(wfo) {
  const id = wfoSite(wfo).toUpperCase();
  if (!id) return "";
  return `https://forecast.weather.gov/product.php?site=${id}&issuedby=${id}&product=PNS&format=txt&version=1&glossary=0`;
}

function pnsApiList(wfo) {
  const id = wfoSite(wfo).toUpperCase();
  if (!id) return "";
  return `https://api.weather.gov/products/types/PNS/locations/${id}`;
}

/** Product body only. NWS HTML chrome has `window[...]` and is not a recap. */
export function productBody(raw) {
  const text = String(raw || "");
  const pre = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (pre) {
    return pre[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&/gi, "&")
      .replace(/</gi, "<")
      .replace(/>/gi, ">")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (/<html[\s>]|GoogleAnalyticsObject/i.test(text)) return "";
  return text.trim();
}

function namesCounty(text, county) {
  const name = String(county || "")
    .replace(/\s+county$/i, "")
    .trim();
  if (!name) return true;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/ld+json, application/json, text/plain", "User-Agent": UA },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return null;
  const ctype = res.headers.get("content-type") ?? "";
  if (ctype.includes("json")) return res.json();
  return res.text();
}

export async function fetchWfoPns(wfo, factsFromText, county = "") {
  const listUrl = pnsApiList(wfo);
  const cutoff = Date.now() - 2 * 24 * 3600 * 1000;
  if (listUrl) {
    try {
      const list = await fetchJson(listUrl);
      const graph = Array.isArray(list?.["@graph"]) ? list["@graph"] : [];
      for (const item of graph.slice(0, 8)) {
        const issued = Date.parse(String(item.issuanceTime ?? ""));
        if (Number.isFinite(issued) && issued < cutoff) continue;
        const id = String(item.id ?? item["@id"] ?? "");
        const url = id.startsWith("http") ? id : id ? `https://api.weather.gov/products/${id}` : "";
        if (!url) continue;
        const prod = await fetchJson(url);
        const body = productBody(String(prod?.productText ?? ""));
        if (!body || !namesCounty(body, county)) continue;
        const facts = factsFromText(body, url);
        if (!facts.miss) return facts;
      }
    } catch {
      /* fall through to the product.php page */
    }
  }

  const page = pnsUrl(wfo);
  if (!page) return { miss: true };
  const res = await fetch(page, {
    headers: { Accept: "text/plain, text/html", "User-Agent": UA },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return { miss: true };
  const raw = await res.text();
  if (/recaptcha|captcha|sign in|log in/i.test(raw) && raw.length < 2000) return { miss: true };
  const body = productBody(raw);
  if (!body || !namesCounty(body, county)) return { miss: true };
  return factsFromText(body, page);
}

function looksLikeGate(html) {
  return (
    /recaptcha|g-recaptcha|cf-challenge|just a moment/i.test(html) &&
    /login|sign in|captcha/i.test(html)
  );
}

export async function scrapeWfoRecap(opts) {
  const wfo = wfoSite(opts.wfo);
  const url = pnsUrl(wfo);
  if (!url) return { miss: true };
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: opts.headed ? false : true });
  const page = await browser.newPage({ userAgent: UA });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
    if (opts.pause) {
      process.stderr.write("Sidecar paused on the WFO page. Press Enter to read it.\n");
      await new Promise((resolve) => {
        process.stdin.resume();
        process.stdin.once("data", () => resolve());
      });
    }
    const html = await page.content();
    if (looksLikeGate(html)) return { miss: true };
    const pre =
      (await page
        .locator("pre")
        .first()
        .innerText()
        .catch(() => "")) || "";
    const body = productBody(pre || html);
    if (!body || !namesCounty(body, opts.county ?? "")) return { miss: true };
    if (opts.screenshot) {
      await page.screenshot({ path: opts.screenshot, fullPage: true }).catch(() => {});
    }
    return opts.factsFromText(body, url);
  } catch {
    return { miss: true };
  } finally {
    await browser.close().catch(() => {});
  }
}
