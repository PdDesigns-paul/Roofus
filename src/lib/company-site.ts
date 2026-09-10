/** Company website they typed. Coach may read it. Never invent a URL. */

const LOOKS = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}([/?#].*)?$/i;

export function looksLikeWebsite(raw: string): boolean {
  const t = raw.trim();
  if (!t || /\s/.test(t)) return false;
  if (t.includes("@")) return false;
  return LOOKS.test(t);
}

export function normalizeWebsiteUrl(raw: string): string | null {
  const t = raw.trim();
  if (!looksLikeWebsite(t)) return null;
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function htmlToText(html: string): string {
  const amp = `&${"amp"};`;
  const quot = `&${"quot"};`;
  const nbsp = `&${"nbsp"};`;
  const apos = `&${"#39"};`;
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replaceAll(nbsp, " ")
    .replaceAll(amp, "&")
    .replaceAll(quot, '"')
    .replaceAll(apos, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tagText(html: string, tag: string): string {
  const m = html.match(new RegExp(`<${tag}[^>]*>([^<]{1,200})</${tag}>`, "i"));
  return m?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

function metaContent(html: string, key: string): string {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const named = new RegExp(
    `<meta[^>]+(?:name|property)=["']${esc}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const contentFirst = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*(?:name|property)=["']${esc}["']`,
    "i",
  );
  return (html.match(named)?.[1] ?? html.match(contentFirst)?.[1] ?? "").replace(/\s+/g, " ").trim();
}

type LdFacts = { name: string; phone: string; place: string; towns: string[]; desc: string };

function pushTown(towns: string[], raw: string) {
  const t = raw
    .replace(/, United States$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t && !towns.includes(t)) towns.push(t);
}

function walkLd(node: unknown, acc: LdFacts, depth = 0) {
  if (depth > 8 || !node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walkLd(item, acc, depth + 1);
    return;
  }
  const o = node as Record<string, unknown>;
  if (typeof o.name === "string" && !acc.name) acc.name = o.name.trim();
  if (typeof o.telephone === "string" && !acc.phone) acc.phone = o.telephone.trim();
  if (typeof o.description === "string" && !acc.desc) acc.desc = o.description.replace(/\s+/g, " ").trim();
  if (typeof o.addressLocality === "string") {
    const st = typeof o.addressRegion === "string" ? o.addressRegion.trim() : "";
    pushTown(acc.towns, st ? `${o.addressLocality.trim()}, ${st}` : o.addressLocality);
  }
  for (const key of ["@graph", "address", "areaServed", "location", "itemListElement"]) {
    if (key in o) walkLd(o[key], acc, depth + 1);
  }
}

function jsonLdFacts(html: string): LdFacts {
  const acc: LdFacts = { name: "", phone: "", place: "", towns: [], desc: "" };
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      walkLd(JSON.parse(m[1] ?? ""), acc);
    } catch {
      /* builder JSON-LD is often messy */
    }
  }
  if (acc.towns[0]) acc.place = acc.towns[0];
  acc.towns = acc.towns.slice(0, 12);
  return acc;
}

/** Title, meta, JSON-LD, then visible text. Facts they advertised — not a Grok guess. */
export function extractSiteBrief(html: string): string {
  const title = tagText(html, "title");
  const desc = metaContent(html, "description") || metaContent(html, "og:description");
  const ld = jsonLdFacts(html);
  const body = htmlToText(html);
  const lines: string[] = [];
  if (title) lines.push(title);
  if (desc && desc !== title) lines.push(desc);
  const who = [ld.name, ld.phone, ld.place].filter(Boolean).join(" · ");
  if (who) lines.push(who);
  if (ld.towns.length) lines.push(`Towns they list: ${ld.towns.join(", ")}`);
  if (ld.desc && ld.desc !== desc) lines.push(ld.desc);
  if (body) lines.push(body.slice(0, 2500));
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function siteReadError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (e instanceof Error && (e.name === "TimeoutError" || /aborted due to timeout/i.test(msg))) {
    return "That site took too long to answer.";
  }
  if (/^Site returned \d/.test(msg)) return msg;
  if (/failed to fetch|networkerror|ECONN|ENOTFOUND|EAI_AGAIN/i.test(msg)) {
    return "Could not reach that site.";
  }
  if (msg && msg.length < 120) return msg;
  return "Could not read that site.";
}

export const MAX_COMPANY_PAGES = 12;

export type CompanyPage = {
  id: string;
  title: string;
  look: string;
  url: string;
};

const SKIP_EXT = /\.(jpe?g|png|gif|webp|svg|avif|css|js|mjs|woff2?|ttf|eot|zip|mp4|webm|ico|map)(\?|$)/i;
const SKIP_PATH =
  /\/(wp-admin|wp-login|cart|checkout|account|login|signin|signup|cdn-cgi|xmlrpc|feed|tag\/|category\/|author\/)/i;
const BOOST =
  /about|our-story|who-we-are|warranty|warranties|product|products|service|services|roof|roofs|shingle|duration|financing|finance|contact|areas?-served|locations?|reviews?|gallery|before-and-after|insurance|claim|storm|residential|commercial/i;

function isPrivateIPv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/** Fetch only public http(s). Do not crawl the phone. */
export function isPublicHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (!host) return false;
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;
    if (host === "::1" || host === "0.0.0.0") return false;
    if (isPrivateIPv4(host)) return false;
    return host.includes(".");
  } catch {
    return false;
  }
}

export function siteHost(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

export function sameSite(a: string, b: string): boolean {
  const ha = siteHost(a);
  const hb = siteHost(b);
  return Boolean(ha && ha === hb);
}

export function canonicalPageUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = "";
    u.search = "";
    u.hostname = u.hostname.replace(/^www\./i, "").toLowerCase();
    if (u.pathname !== "/") u.pathname = u.pathname.replace(/\/+$/, "");
    return u.toString();
  } catch {
    return raw;
  }
}

export function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

export function pageId(url: string): string {
  try {
    const path = (new URL(url).pathname.replace(/\/+$/, "") || "home")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    return `site-${path || "home"}`.slice(0, 48);
  } catch {
    return "site-page";
  }
}

export function extractPageLinks(html: string, base: string): string[] {
  const out: string[] = [];
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = (m[1] ?? "").trim();
    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }
    try {
      out.push(new URL(href, base).toString());
    } catch {
      /* skip junk href */
    }
  }
  return out;
}

export function extractSitemapLocs(xml: string, base: string): string[] {
  const out: string[] = [];
  const re = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const loc = (m[1] ?? "").replace(/&/g, "&").trim();
    if (!loc) continue;
    try {
      out.push(new URL(loc, base).toString());
    } catch {
      /* skip */
    }
  }
  return out;
}

export function shouldKeepPageUrl(url: string, home: string): boolean {
  if (!isPublicHttpUrl(url) || !sameSite(url, home)) return false;
  try {
    const path = new URL(url).pathname;
    if (SKIP_EXT.test(path) && !isPdfUrl(url)) return false;
    if (SKIP_PATH.test(path)) return false;
    return true;
  } catch {
    return false;
  }
}

export function rankCompanyLinks(urls: string[], home: string): string[] {
  const seen = new Set<string>();
  const scored: { url: string; score: number }[] = [];
  const homeKey = canonicalPageUrl(home);
  for (const raw of urls) {
    if (!shouldKeepPageUrl(raw, home)) continue;
    const key = canonicalPageUrl(raw);
    if (seen.has(key) || key === homeKey) continue;
    seen.add(key);
    let score = 0;
    try {
      const path = new URL(raw).pathname;
      if (BOOST.test(path)) score += 10;
      if (isPdfUrl(raw)) score += 6;
      score -= Math.max(0, path.split("/").filter(Boolean).length - 1);
    } catch {
      continue;
    }
    scored.push({ url: raw, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.url);
}

function stripBrandSuffix(title: string): string {
  const cut = title.replace(/\s+[|\-–—]\s+.{1,48}$/, "").trim();
  return cut.length >= 3 ? cut : title;
}

function titleFromPath(url: string): string {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() ?? "");
    const name = last.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ").trim();
    if (!name) return "Home";
    return name.replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Page";
  }
}

export function pdfCard(url: string): CompanyPage {
  return {
    id: pageId(url),
    title: titleFromPath(url),
    look: "PDF they posted.",
    url,
  };
}

export function extractPageCard(html: string, url: string): CompanyPage {
  const raw = htmlToText(metaContent(html, "og:title") || tagText(html, "title") || "");
  const title = stripBrandSuffix(raw) || titleFromPath(url);
  const desc = htmlToText(metaContent(html, "description") || metaContent(html, "og:description") || "");
  const body = htmlToText(html);
  const look = (desc || body).slice(0, 180).trim() || "Page on their site.";
  return { id: pageId(url), title, look, url };
}

export function uniqueCompanyPages(pages: CompanyPage[]): CompanyPage[] {
  const seen = new Set<string>();
  const out: CompanyPage[] = [];
  for (const p of pages) {
    const key = canonicalPageUrl(p.url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= MAX_COMPANY_PAGES) break;
  }
  return out;
}

/** MRI-shaped chapter so Reference can prepend it. */
export function companyChapter(name: string, pages: CompanyPage[]) {
  const title = name.trim() && name.trim() !== "Roofus" ? name.trim() : "Company site";
  return {
    id: "company" as const,
    title,
    when: "What they advertise. Tap a card to open the page.",
    cards: pages.map((p) => ({
      id: p.id,
      title: p.title,
      look: p.look,
      url: p.url,
      tags: "company site warranty product",
    })),
  };
}

export function companyPagesKnowledge(pages: Pick<CompanyPage, "title" | "look">[]): string {
  if (!pages.length) return "";
  const lines = pages.map((p) => `- ${p.title}: ${p.look}`);
  return `Company pages in Reference. Name the title. Send them to Reference to open the page. Do not invent a page.\n${lines.join("\n")}`;
}
