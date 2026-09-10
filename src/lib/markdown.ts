export type MdInline =
  | { t: "text"; v: string }
  | { t: "strong"; v: string }
  | { t: "em"; v: string }
  | { t: "code"; v: string }
  | { t: "link"; v: string; href: string };

export type MdBlock =
  | { t: "p"; text: string }
  | { t: "h"; level: 1 | 2 | 3; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "pre"; text: string };

const LINK = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/;
const BOLD = /^\*\*(.+?)\*\*/;
const CODE = /^`([^`]+)`/;
const EM = /^\*(.+?)\*/;
const BARE = /^(https?:\/\/[^\s<]+)/;

export function parseInline(text: string): MdInline[] {
  const out: MdInline[] = [];
  let rest = text;
  while (rest) {
    const link = rest.match(LINK);
    if (link) {
      out.push({ t: "link", v: link[1] ?? "", href: link[2] ?? "" });
      rest = rest.slice(link[0].length);
      continue;
    }
    const bold = rest.match(BOLD);
    if (bold) {
      out.push({ t: "strong", v: bold[1] ?? "" });
      rest = rest.slice(bold[0].length);
      continue;
    }
    const code = rest.match(CODE);
    if (code) {
      out.push({ t: "code", v: code[1] ?? "" });
      rest = rest.slice(code[0].length);
      continue;
    }
    const em = rest.match(EM);
    if (em && !rest.startsWith("**")) {
      out.push({ t: "em", v: em[1] ?? "" });
      rest = rest.slice(em[0].length);
      continue;
    }
    const bare = rest.match(BARE);
    if (bare) {
      const href = (bare[1] ?? "").replace(/[),.;:!?]+$/, "");
      out.push({ t: "link", v: href, href });
      rest = rest.slice(href.length);
      continue;
    }
    const next = rest.search(/\[|\*\*|`|\*|https?:\/\//);
    if (next === -1) {
      out.push({ t: "text", v: rest });
      break;
    }
    if (next === 0) {
      out.push({ t: "text", v: rest[0] ?? "" });
      rest = rest.slice(1);
      continue;
    }
    out.push({ t: "text", v: rest.slice(0, next) });
    rest = rest.slice(next);
  }
  return out;
}

function isBullet(line: string) {
  return /^\s*[-*•]\s+/.test(line);
}

function isNumbered(line: string) {
  return /^\s*\d+[.)]\s+/.test(line);
}

function stripMark(line: string) {
  return line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "");
}

function heading(line: string): { level: 1 | 2 | 3; text: string } | null {
  const m = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
  if (!m) return null;
  const level = Math.min(m[1]?.length ?? 1, 3) as 1 | 2 | 3;
  return { level, text: m[2] ?? "" };
}

function fence(block: string): string | null {
  if (!block.startsWith("```")) return null;
  return block.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "");
}

/** Coach chat + the company brief. Not a full CommonMark parser. */
export function parseBlocks(text: string): MdBlock[] {
  const chunks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  const out: MdBlock[] = [];
  for (const chunk of chunks) {
    const fenced = fence(chunk);
    if (fenced !== null) {
      out.push({ t: "pre", text: fenced });
      continue;
    }
    const lines = chunk.split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i] ?? "";
      const h = heading(line);
      if (h) {
        out.push({ t: "h", level: h.level, text: h.text });
        i += 1;
        continue;
      }
      if (isBullet(line)) {
        const items: string[] = [];
        while (i < lines.length && isBullet(lines[i] ?? "")) {
          items.push(stripMark(lines[i] ?? ""));
          i += 1;
        }
        out.push({ t: "ul", items });
        continue;
      }
      if (isNumbered(line)) {
        const items: string[] = [];
        while (i < lines.length && isNumbered(lines[i] ?? "")) {
          items.push(stripMark(lines[i] ?? ""));
          i += 1;
        }
        out.push({ t: "ol", items });
        continue;
      }
      const para: string[] = [];
      while (
        i < lines.length &&
        !isBullet(lines[i] ?? "") &&
        !isNumbered(lines[i] ?? "") &&
        !heading(lines[i] ?? "")
      ) {
        para.push(lines[i] ?? "");
        i += 1;
      }
      if (para.some((l) => l.trim())) out.push({ t: "p", text: para.join("\n") });
    }
  }
  return out;
}
