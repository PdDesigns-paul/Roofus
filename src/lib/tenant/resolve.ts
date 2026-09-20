/** Pack id only. Keep pack objects out so inspect-walk cannot cycle through day-book. */

export const DEFAULT_PACK_ID = "roofus";
export const PACK_IDS = ["roofus", "pest", "solar"] as const;
export type PackId = (typeof PACK_IDS)[number];

/** Build env wins. Host map is for a later edge lookup — not a second Vercel site. */
export const HOST_PACK: Record<string, PackId> = {
  "roofus.coach": "roofus",
  "www.roofus.coach": "roofus",
};

export function normalizeHost(host?: string | null): string {
  return (host ?? "").split(":")[0]!.trim().toLowerCase();
}

export function isPackId(id: string): id is PackId {
  return (PACK_IDS as readonly string[]).includes(id);
}

/** `demo` is an alias — Stride lives in pack `solar`. */
function canonicalPackId(id: string): PackId | "" {
  const k = id.trim().toLowerCase();
  if (k === "demo") return "solar";
  if (isPackId(k)) return k;
  return "";
}

/**
 * VITE_TENANT_ID → host allowlist → roofus.
 * `demo` is an alias for `solar` (Stride graduated). Unknown ids fall through. grok.me is not a pack host.
 */
export function resolvePackId(envId?: string | null, host?: string | null): PackId {
  const fromEnv = canonicalPackId(envId ?? "");
  if (fromEnv) return fromEnv;
  const fromHost = HOST_PACK[normalizeHost(host)];
  if (fromHost) return fromHost;
  return DEFAULT_PACK_ID;
}

export function tenantEnvId(): string {
  try {
    const vite = (import.meta as { env?: { VITE_TENANT_ID?: string } }).env?.VITE_TENANT_ID;
    if (typeof vite === "string" && vite.trim()) return vite.trim();
  } catch {
    /* node tests */
  }
  if (typeof process !== "undefined" && typeof process.env?.VITE_TENANT_ID === "string") {
    return process.env.VITE_TENANT_ID;
  }
  return "";
}
