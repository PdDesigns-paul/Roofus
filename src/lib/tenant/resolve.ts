/** Pack id only. Keep pack objects out so inspect-walk cannot cycle through day-book. */

export const DEFAULT_PACK_ID = "roofus";
export const PACK_IDS = ["roofus", "pest", "solar"] as const;
export type PackId = (typeof PACK_IDS)[number];

/**
 * Host allowlist. One Vercel project. grok.me / *.grok.me / *.vercel.app stay unmapped.
 * Real shop hosts land when a tenant exists. Map stays code, not a Settings row.
 */
export const HOST_PACK: Record<string, PackId> = {
  "roofus.coach": "roofus",
  "www.roofus.coach": "roofus",
  // Documented proof host — not a second Vercel site.
  "stride.example": "solar",
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
 * Proof env (`pest` / `solar` / `demo`). Default `roofus` is not explicit —
 * a custom-domain alias on the shared project must still hit HOST_PACK.
 */
export function explicitEnvId(envId?: string | null): PackId | "" {
  const id = canonicalPackId(envId ?? "");
  if (!id || id === DEFAULT_PACK_ID) return "";
  return id;
}

/**
 * Proof env wins. Shared prod (empty or default `roofus`): host allowlist, then roofus.
 * grok.me is not a pack host.
 */
export function resolvePackId(envId?: string | null, host?: string | null): PackId {
  const explicit = explicitEnvId(envId);
  if (explicit) return explicit;
  const fromHost = HOST_PACK[normalizeHost(host)];
  if (fromHost) return fromHost;
  return canonicalPackId(envId ?? "") || DEFAULT_PACK_ID;
}

export function hostFromHeaders(headers?: Headers | null): string | null {
  if (!headers) return null;
  const h = normalizeHost(headers.get("x-forwarded-host") ?? headers.get("host"));
  return h || null;
}

export function runtimeHost(): string | null {
  if (typeof window !== "undefined") return normalizeHost(window.location.hostname);
  return null;
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
