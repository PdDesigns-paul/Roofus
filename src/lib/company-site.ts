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
