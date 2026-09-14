/** Notion page IDs, integration secrets, and the backup tables. Token is never stored on our server. */
export type NotionFaq = { id: string; q: string; a: string };

export type NotionIds = {
  parentPageId: string;
  daysDb: string;
  streetsDb: string;
  stormsDb: string;
  mindsetDb: string;
  memoryDb: string;
  pinsDb: string;
};

export type NotionTable = "days" | "streets" | "storms" | "mindset" | "memory" | "pins";

export const NOTION_TABLES: NotionTable[] = ["days", "streets", "storms", "mindset", "memory", "pins"];

const ID_KEYS: (keyof NotionIds)[] = [
  "parentPageId",
  "daysDb",
  "streetsDb",
  "stormsDb",
  "mindsetDb",
  "memoryDb",
  "pinsDb",
];

function hyphenate(h: string) {
  const s = h.toLowerCase();
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

export function parseNotionId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const dashed = raw.match(
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/,
  );
  if (dashed) return dashed[0].toLowerCase();
  const path = raw.split("?")[0]?.split("#")[0] ?? raw;
  const tail = path.match(/([0-9a-fA-F]{32})\/?$/);
  if (tail?.[1]) return hyphenate(tail[1]);
  const stripped = path.replace(/-/g, "");
  const any = stripped.match(/[0-9a-fA-F]{32}/);
  return any?.[0] ? hyphenate(any[0]) : null;
}

export function looksLikeNotionToken(token: string) {
  const t = token.trim();
  return t.startsWith("ntn_") || t.startsWith("secret_");
}

export function validNotionIds(ids: unknown): ids is NotionIds {
  if (!ids || typeof ids !== "object") return false;
  const o = ids as Record<string, unknown>;
  return ID_KEYS.every((k) => typeof o[k] === "string" && Boolean(parseNotionId(o[k])));
}

export function isNotionTable(v: unknown): v is NotionTable {
  return typeof v === "string" && (NOTION_TABLES as string[]).includes(v);
}
