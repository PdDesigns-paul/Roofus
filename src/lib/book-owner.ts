/** Whose book. Signed-out = this phone. Not a /login Place. */

export const OWNER_STORE = "roofus-owner-v1";

export const BOOK_BASES = [
  "roofus-day-v1",
  "roofus-pins-v1",
  "roofus-streets-v1",
  "roofus-weather-v1",
  "roofus-survive-v1",
  "roofus-threads-v1",
] as const;

export type BookOwner = {
  ownerId: string | null;
  ownerLabel: string;
};

export const ANON_OWNER: BookOwner = { ownerId: null, ownerLabel: "This phone" };

export const RESTORE_WHOSE_BOOK =
  "Do not Restore onto a full phone. Confirm this is your book first.";

function sanitizeOwnerId(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 64);
}

/** Persist name. Empty owner keeps the current keys so existing phones do not vanish. */
export function bookKey(base: string, ownerId: string | null = readOwner().ownerId): string {
  const id = (ownerId ?? "").trim();
  if (!id) return base;
  return `${base}:${sanitizeOwnerId(id)}`;
}

export function readOwner(): BookOwner {
  if (typeof localStorage === "undefined") return { ...ANON_OWNER };
  try {
    const raw = localStorage.getItem(OWNER_STORE);
    if (!raw) return { ...ANON_OWNER };
    const parsed = JSON.parse(raw) as Partial<BookOwner>;
    const ownerId = typeof parsed.ownerId === "string" && parsed.ownerId.trim() ? parsed.ownerId.trim() : null;
    const label = typeof parsed.ownerLabel === "string" ? parsed.ownerLabel.trim() : "";
    return {
      ownerId,
      ownerLabel: label || (ownerId ? "Signed in" : ANON_OWNER.ownerLabel),
    };
  } catch {
    return { ...ANON_OWNER };
  }
}

export function writeOwner(next: BookOwner): void {
  if (typeof localStorage === "undefined") return;
  const ownerId = typeof next.ownerId === "string" && next.ownerId.trim() ? next.ownerId.trim() : null;
  const ownerLabel = (next.ownerLabel.trim() || (ownerId ? "Signed in" : ANON_OWNER.ownerLabel)).trim();
  localStorage.setItem(OWNER_STORE, JSON.stringify({ ownerId, ownerLabel }));
}

export function ownerChipLabel(owner: BookOwner = readOwner()): string {
  return owner.ownerLabel.trim() || ANON_OWNER.ownerLabel;
}

/** Real host session only. Never the disabled-auth DEV_USER. */
export function ownerFromSession(user: {
  id?: string | null;
  displayName?: string | null;
  primaryEmail?: string | null;
  isDevFallback?: boolean;
} | null): BookOwner {
  if (!user || user.isDevFallback) return { ...ANON_OWNER };
  const ownerId = typeof user.id === "string" && user.id.trim() ? user.id.trim() : null;
  if (!ownerId) return { ...ANON_OWNER };
  const ownerLabel = (user.displayName || user.primaryEmail || "Signed in").trim();
  return { ownerId, ownerLabel };
}

export function bindSessionOwner(user: Parameters<typeof ownerFromSession>[0]): BookOwner {
  const next = ownerFromSession(user);
  if (next.ownerId) writeOwner(next);
  return next;
}

export function todayHasCounts(
  days: Record<string, { knocks?: number; talks?: number; looks?: number; sets?: number }>,
  today: string,
): boolean {
  const d = days[today];
  if (!d) return false;
  return (d.knocks ?? 0) + (d.talks ?? 0) + (d.looks ?? 0) + (d.sets ?? 0) > 0;
}

export function restoreNeedsConfirm(
  days: Record<string, { knocks?: number; talks?: number; looks?: number; sets?: number }>,
  today: string,
  pinCount = 0,
): boolean {
  return todayHasCounts(days, today) || pinCount > 0;
}

export function assertRestoreAllowed(
  days: Record<string, { knocks?: number; talks?: number; looks?: number; sets?: number }>,
  confirmed: boolean,
  today: string,
  pinCount = 0,
): void {
  if (restoreNeedsConfirm(days, today, pinCount) && !confirmed) {
    throw new Error(RESTORE_WHOSE_BOOK);
  }
}
