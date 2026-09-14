/** Read-only tools against the book the phone posted. No web. No SMS. No RAG. */

import { COACH_MRI, MRI_CHAPTERS } from "./mri-index.ts";

export function lookupCoachMri(titleOrId: string): { id: string; title: string; look: string } | null {
  const q = titleOrId.trim().toLowerCase();
  if (!q) return null;
  const allow = COACH_MRI.find(
    (row) => row.id.toLowerCase() === q || row.title.toLowerCase() === q || row.title.toLowerCase().includes(q),
  );
  if (!allow) return null;
  for (const ch of MRI_CHAPTERS) {
    const hit = ch.cards.find((c) => c.id === allow.id || c.title === allow.title);
    if (hit) return { id: hit.id, title: hit.title, look: hit.look };
  }
  return null;
}

export const NOT_ON_PHONE = "not on the phone";
export const TOOL_ROUND_CAP = 2;
export const TOOLS_FALLBACK = "I have the book I was sent. Here is the next line.";

export type WorkingLoopSnap = {
  name?: string;
  zip?: string;
  ageBand?: string;
  status?: string;
};

export type KeptStormSnap = {
  zip?: string;
  say?: string;
  street?: string;
  loopLabel?: string;
  kind?: string;
  status?: string;
};

export type FaqSnap = { q: string; a: string };

export type SurviveSnap = {
  whyRecap?: string;
  earned?: string;
  demon?: string;
  gear?: string;
  attack?: string;
};

export type CoachBook = {
  workingLoop?: WorkingLoopSnap | null;
  keptStorms?: KeptStormSnap[] | null;
  faqs?: FaqSnap[] | null;
  surviveSnap?: SurviveSnap | null;
  pinCounts?: Record<string, number> | null;
  scene?: string | null;
  mode?: string | null;
};

export type ToolCall = { id?: string; name: string; arguments?: unknown };

const MISS = { error: NOT_ON_PHONE };

function asRecord(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function zipOf(row: KeptStormSnap): string {
  const direct = str(row.zip);
  if (/^\d{5}$/.test(direct)) return direct;
  const blob = `${row.loopLabel ?? ""} ${row.street ?? ""} ${row.say ?? ""}`;
  return blob.match(/\b(\d{5})\b/)?.[1] ?? "";
}

function isKept(row: KeptStormSnap): boolean {
  const status = str(row.status).toLowerCase();
  if (!status) return Boolean(str(row.say) || str(row.street) || str(row.loopLabel));
  return status === "keep" || status === "kept";
}

export function getWorkingLoop(book: CoachBook) {
  const loop = book.workingLoop;
  if (!loop || (!str(loop.name) && !str(loop.zip))) {
    return { name: "", zip: "", ageBand: "", pinCounts: book.pinCounts ?? {} };
  }
  return {
    name: str(loop.name),
    zip: str(loop.zip),
    ageBand: str(loop.ageBand),
    status: str(loop.status),
    pinCounts: book.pinCounts ?? {},
  };
}

export function getKeptStorm(book: CoachBook, zip?: string) {
  const rows = (book.keptStorms ?? []).filter(isKept);
  const want = str(zip) || str(book.workingLoop?.zip);
  const hits = want ? rows.filter((row) => zipOf(row) === want) : rows;
  if (!hits.length) return { storms: "none" as const };
  return {
    storms: hits.slice(0, 5).map((row) => ({
      zip: zipOf(row),
      say: str(row.say),
      street: str(row.street),
      loopLabel: str(row.loopLabel),
      kind: str(row.kind),
    })),
  };
}

function faqScore(q: string, faq: FaqSnap): number {
  const needle = q.toLowerCase();
  const hay = `${faq.q} ${faq.a}`.toLowerCase();
  if (!needle) return 0;
  if (hay.includes(needle)) return 100 + needle.length;
  const words = needle.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  return words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
}

export function getFaq(book: CoachBook, q?: string) {
  const query = str(q);
  if (!query) return MISS;
  const faqs = book.faqs ?? [];
  if (!faqs.length) return MISS;
  const ranked = faqs
    .map((faq) => ({ faq, score: faqScore(query, faq) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((row) => ({ q: row.faq.q, a: row.faq.a }));
  if (!ranked.length) return { faqs: [] as FaqSnap[], note: NOT_ON_PHONE };
  return { faqs: ranked };
}

export function getMriCard(title?: string, id?: string) {
  const want = str(title) || str(id);
  if (!want) return MISS;
  const card = lookupCoachMri(want);
  if (!card) return { error: "not-found", title: want };
  return { title: card.title, look: card.look, open: "Reference" as const };
}

export function getSurvive(book: CoachBook) {
  const snap = book.surviveSnap ?? {};
  return {
    whyRecap: str(snap.whyRecap),
    earned: str(snap.earned),
    demon: str(snap.demon),
    gear: str(snap.gear),
    attack: str(snap.attack),
  };
}

export function scoreKnock(book: CoachBook) {
  const scene = str(book.scene);
  const extras: string[] = [];
  if (scene === "claim") {
    extras.push("one claim stage only", "deductible before a claim pitch", "no flip promise");
  }
  if (scene === "walk") {
    extras.push("open buying questions", "no price on the grass", "set is the next step");
  }
  if (scene === "phone") {
    extras.push("both names on the line", "no SMS from this chat", "three options from agreed photos");
  }
  return {
    rubric: {
      truth: "no invented storm, no fake neighbor, no fake next-door",
      enrollment: "small yes / open question before a pitch",
      noFakeStorm: "Script A only after a Keep that matches the zip",
      noWhy: "never WHY in the house",
      nextPhysicalStep: "look, set, or a name on a no",
      nameOnANo: "leave a name even when they shut it down",
    },
    extras,
    note: "Grade the canvasser. Do not grade a customer recording.",
  };
}

export function runCoachTool(name: string, rawArgs: unknown, book: CoachBook): unknown {
  const args = asRecord(rawArgs);
  switch (name) {
    case "get_working_loop":
      return getWorkingLoop(book);
    case "get_kept_storm":
      return getKeptStorm(book, str(args.zip));
    case "get_faq":
      return getFaq(book, str(args.q));
    case "get_mri_card":
      return getMriCard(str(args.title), str(args.id));
    case "get_survive":
      return getSurvive(book);
    case "score_knock":
      return scoreKnock(book);
    default:
      return MISS;
  }
}

export function runToolRound(
  calls: ToolCall[],
  book: CoachBook,
  roundsAlreadyRun: number,
): { executed: unknown[]; skipped: boolean } {
  if (roundsAlreadyRun >= TOOL_ROUND_CAP) {
    return { executed: [], skipped: true };
  }
  return {
    executed: calls.map((call) => ({
      id: call.id ?? "",
      name: call.name,
      result: runCoachTool(call.name, call.arguments, book),
    })),
    skipped: false,
  };
}

export function toolsOnFor(input: {
  imageDataUrl?: string;
  mode?: string | null;
  hat?: string | null;
  origin?: string | null;
  messages?: { role: string; content: string }[];
}): boolean {
  if (input.imageDataUrl) return false;
  const mode = input.mode ?? input.hat ?? "";
  if (mode === "roleplay") {
    const last = [...(input.messages ?? [])].reverse().find((m) => m.role === "user")?.content ?? "";
    return /\bscore me\b|\bbreak\b/i.test(last);
  }
  return true;
}

export const COACH_TOOL_DEFS = [
  {
    type: "function" as const,
    function: {
      name: "get_working_loop",
      description: "Read the Working loop they posted: name, zip, age band, pin counts. Do not invent a street or a homeowner.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_kept_storm",
      description: "Kept storms only from the posted book. Optional zip. Empty book returns none. Never name a Tossed storm.",
      parameters: {
        type: "object",
        properties: { zip: { type: "string", description: "Zip to match. Defaults to the Working zip." } },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_faq",
      description: "Look up 1–3 Memory FAQs from the posted book. Do not invent office policy.",
      parameters: {
        type: "object",
        properties: { q: { type: "string", description: "Question or phrase to match." } },
        required: ["q"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_mri_card",
      description: "One named Reference card: title, look, open Reference. Allowlist only. Do not paste InterNACHI HTML.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          id: { type: "string" },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_survive",
      description: "Private Why / demon / gear / attack from the posted sheet. Never put the demon on a porch line.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "score_knock",
      description: "Rubric checklist for Score me. Grade the canvasser, not a customer recording.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

export const TOOLS_BRIEF = `You have tools that read the book they posted. Use a tool instead of guessing a kept storm, a Memory FAQ, a Working-loop zip, or an MRI title. After a tool miss say “Not on the phone.” Then coach. In-character Roleplay: do not call tools. Score me / Live / Mindset / Setup may. Tools do not replace Script B. You cannot browse the web or send SMS.`;
