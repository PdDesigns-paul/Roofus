/** Allowlisted page read. InterNACHI is licensed — distill original notes, never return the article. */

import { htmlToText, isPublicHttpUrl, sameSite, siteHost } from "./company-site.ts";
import { llmComplete, llmEndpoint } from "./coach-llm.ts";
import { modelFor } from "./coach-model.ts";
import { COACH_MRI, MRI_CHAPTERS, type MriCard } from "./mri-index.ts";

const FETCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "User-Agent": "Mozilla/5.0 (compatible; RoofusCoach/1.0; +https://roofus.coach)",
};

const NOTE_CAP = 8;
const SOURCE_CAP = 6_000;
const CACHE_MS = 6 * 60 * 60 * 1000;

export const INTERNACHI_LICENSE =
  "InterNACHI article. Coach from these notes in your own words. Do not paste the article. Name the card. Send them to Reference to open it.";

export type CompanyPageSnap = { title: string; look: string; url: string };

export type PageNotes = {
  title: string;
  look?: string;
  notes: string[];
  open: "Reference";
  license?: string;
  quote: false;
  source?: "internachi" | "company";
  error?: string;
};

type CacheRow = { at: number; notes: string[] };

const cache = new Map<string, CacheRow>();

export function isLicensedReferenceHost(host: string): boolean {
  const h = host.replace(/^www\./i, "").toLowerCase();
  return h === "nachi.org";
}

export function namedMriCard(titleOrId: string): (MriCard & { chapter: string }) | null {
  const q = titleOrId.trim().toLowerCase();
  if (!q) return null;
  const allow = COACH_MRI.find(
    (row) => row.id.toLowerCase() === q || row.title.toLowerCase() === q || row.title.toLowerCase().includes(q),
  );
  if (!allow) return null;
  for (const ch of MRI_CHAPTERS) {
    const hit = ch.cards.find((c) => c.id === allow.id || c.title === allow.title);
    if (hit) return { ...hit, chapter: ch.title };
  }
  return null;
}

export function notesWithoutCopy(notes: string[], source: string): string[] {
  const hay = source.toLowerCase().replace(/\s+/g, " ");
  const out: string[] = [];
  for (const raw of notes) {
    const note = raw.replace(/\s+/g, " ").trim();
    if (!note || note.length < 8) continue;
    if (copiedSpan(note, hay)) continue;
    out.push(note.slice(0, 220));
    if (out.length >= NOTE_CAP) break;
  }
  return out;
}

function copiedSpan(note: string, hay: string): boolean {
  const words = note.toLowerCase().split(" ").filter(Boolean);
  if (words.length < 8) return hay.includes(note.toLowerCase()) && note.length > 40;
  for (let i = 0; i <= words.length - 8; i++) {
    if (hay.includes(words.slice(i, i + 8).join(" "))) return true;
  }
  return false;
}

function parseNotes(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as { notes?: unknown };
    if (Array.isArray(parsed.notes)) {
      return parsed.notes.filter((n): n is string => typeof n === "string");
    }
  } catch {
    /* fall through */
  }
  return raw
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

const DISTILL_SYSTEM = `You turn a licensed roof-inspection article into original field notes for a door-to-door canvasser standing on a porch or a roof.

Rules:
- Write 4 to 8 short notes in your own words.
- Each note is one look-for, one distinction, or one next physical step.
- Do not copy sentences. Do not quote more than four consecutive words from the source.
- Do not dump headings. Do not include ads, nav, copyright blocks, or author bios.
- If the page is empty or paywalled, one note saying the page did not load.
- Output JSON only: {"notes":["..."]}`;

async function distillLicensed(title: string, source: string): Promise<string[]> {
  const ep = llmEndpoint();
  const text = await llmComplete({
    model: modelFor("live", null, ep?.provider),
    system: DISTILL_SYSTEM,
    user: `Card: ${title}\n\nPage text (do not copy):\n${source.slice(0, SOURCE_CAP)}`,
    maxTokens: 280,
    timeoutMs: 10_000,
  });
  if (!text) return [];
  return notesWithoutCopy(parseNotes(text), source);
}

const COMPANY_SYSTEM = `Summarize this company web page for a door-to-door canvasser. Facts they advertise only: product, warranty, towns, phone, hours. Do not invent. 4 to 6 short notes. JSON only: {"notes":["..."]}`;

async function distillCompany(title: string, source: string): Promise<string[]> {
  const ep = llmEndpoint();
  const text = await llmComplete({
    model: modelFor("live", null, ep?.provider),
    system: COMPANY_SYSTEM,
    user: `Page: ${title}\n\n${source.slice(0, SOURCE_CAP)}`,
    maxTokens: 220,
    timeoutMs: 8_000,
  });
  if (!text) return [];
  return parseNotes(text)
    .map((n) => n.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, NOTE_CAP);
}

async function fetchPageText(url: string): Promise<string | null> {
  if (!isPublicHttpUrl(url)) return null;
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const finalUrl = res.url || url;
    if (!isPublicHttpUrl(finalUrl) || !sameSite(url, finalUrl)) return null;
    const type = res.headers.get("content-type") ?? "";
    if (/pdf/i.test(type) || /\.pdf(\?|$)/i.test(finalUrl)) return null;
    const html = (await res.text()).slice(0, 400_000);
    const text = htmlToText(html);
    return text.slice(0, SOURCE_CAP) || null;
  } catch {
    return null;
  }
}

async function cachedNotes(url: string, build: () => Promise<string[]>): Promise<string[]> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.notes;
  const notes = await build();
  if (notes.length) cache.set(url, { at: Date.now(), notes });
  return notes;
}

export async function readReferencePage(titleOrId: string): Promise<PageNotes> {
  const card = namedMriCard(titleOrId);
  if (!card) return { title: titleOrId.trim(), notes: [], open: "Reference", quote: false, error: "not-found" };
  if (!isLicensedReferenceHost(siteHost(card.url))) {
    return { title: card.title, look: card.look, notes: [card.look], open: "Reference", quote: false, source: "internachi" };
  }
  const notes = await cachedNotes(card.url, async () => {
    const source = await fetchPageText(card.url);
    if (!source) return [];
    return distillLicensed(card.title, source);
  });
  const field = notes.length ? notes : [card.look];
  return {
    title: card.title,
    look: card.look,
    notes: field,
    open: "Reference",
    license: INTERNACHI_LICENSE,
    quote: false,
    source: "internachi",
    ...(notes.length ? {} : { error: "page-unread" }),
  };
}

export function matchCompanyPage(
  pages: CompanyPageSnap[],
  home: string,
  titleOrUrl: string,
): CompanyPageSnap | null {
  const q = titleOrUrl.trim().toLowerCase();
  if (!q || !pages.length) return null;
  const hit =
    pages.find((p) => p.url.toLowerCase() === q || p.title.toLowerCase() === q) ??
    pages.find((p) => p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q));
  if (!hit) return null;
  if (!isPublicHttpUrl(hit.url)) return null;
  if (home && !sameSite(home, hit.url) && siteHost(hit.url) !== siteHost(home)) return null;
  if (isLicensedReferenceHost(siteHost(hit.url))) return null;
  return hit;
}

export async function readCompanyPage(
  pages: CompanyPageSnap[],
  home: string,
  titleOrUrl: string,
): Promise<PageNotes> {
  const page = matchCompanyPage(pages, home, titleOrUrl);
  if (!page) {
    return { title: titleOrUrl.trim(), notes: [], open: "Reference", quote: false, error: "not on the phone" };
  }
  const notes = await cachedNotes(page.url, async () => {
    const source = await fetchPageText(page.url);
    if (!source) return page.look ? [page.look] : [];
    const distilled = await distillCompany(page.title, source);
    return distilled.length ? distilled : page.look ? [page.look] : [];
  });
  return {
    title: page.title,
    look: page.look,
    notes: notes.length ? notes : page.look ? [page.look] : [],
    open: "Reference",
    quote: false,
    source: "company",
  };
}
