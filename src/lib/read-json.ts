/**
 * Upstream feeds (IEM, Census, Vercel 504s) sometimes return text, not JSON.
 * Never let JSON.parse dump that onto the phone.
 */

export function parseJson(text: string): unknown {
  const raw = (text ?? "").trim();
  if (!raw) return null;
  const start = raw[0];
  if (start !== "{" && start !== "[") return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function isParseDump(msg: string): boolean {
  return /unexpected token|is not valid json|unexpected end of json|json\.parse|syntaxerror/i.test(msg);
}

export function phoneError(raw: unknown, fallback: string): string {
  const msg =
    typeof raw === "string" ? raw : raw instanceof Error ? raw.message : "";
  if (!msg) return fallback;
  if (isParseDump(msg)) return fallback;
  if (/aborted due to timeout|timeouterror|failed to fetch|networkerror|econn|enotfound/i.test(msg)) {
    return fallback;
  }
  if (msg.length > 140) return fallback;
  return msg;
}

export async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  return parseJson(text);
}
