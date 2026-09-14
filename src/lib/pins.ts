/** Sidewalk house log. Hangs on a loop, not on the day. Not a CRM. */

export const PIN_STATUSES = ["no-answer", "talked", "look", "set", "revisit", "skip"] as const;
export type PinStatus = (typeof PIN_STATUSES)[number];

export const CURB_TAGS = ["3-tab", "granules", "tarp", "missing tab", "no-solicit"] as const;
export type CurbTag = (typeof CURB_TAGS)[number];

export const PIN_STATUS_LABEL: Record<PinStatus, string> = {
  "no-answer": "No answer",
  talked: "Talked",
  look: "Look",
  set: "Set",
  revisit: "Revisit",
  skip: "Skip",
};

export type HousePin = {
  id: string;
  loopId: string;
  lat: number;
  lng: number;
  houseNumber: string;
  note: string;
  status: PinStatus;
  curbTags: CurbTag[];
  createdAt: string;
  updatedAt: string;
};

export const MAX_BACKUP_PINS = 200;

const STATUS_SET = new Set<string>(PIN_STATUSES);
const CURB_SET = new Set<string>(CURB_TAGS);

function s(v: unknown) {
  return typeof v === "string" ? v : "";
}

function n(v: unknown) {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function asPinStatus(v: unknown): PinStatus {
  return STATUS_SET.has(String(v)) ? (v as PinStatus) : "no-answer";
}

export function asCurbTags(v: unknown): CurbTag[] {
  const raw = Array.isArray(v)
    ? v
    : typeof v === "string"
      ? v.split(",")
      : [];
  const out: CurbTag[] = [];
  for (const t of raw) {
    const x = String(t).trim();
    if (CURB_SET.has(x) && !out.includes(x as CurbTag)) out.push(x as CurbTag);
  }
  return out;
}

export function newPinId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function makePin(input: {
  loopId: string;
  lat: number;
  lng: number;
  houseNumber?: string;
  note?: string;
  status?: PinStatus;
  curbTags?: CurbTag[];
}): HousePin {
  const now = new Date().toISOString();
  return serializePin({
    id: newPinId(),
    loopId: input.loopId.trim(),
    lat: n(input.lat),
    lng: n(input.lng),
    houseNumber: (input.houseNumber ?? "").trim(),
    note: (input.note ?? "").trim(),
    status: input.status ?? "no-answer",
    curbTags: input.curbTags ?? [],
    createdAt: now,
    updatedAt: now,
  });
}

/** Drop unknown keys (owner, phone, parcel) so a junk blob cannot become PII. */
export function restorePin(raw: unknown): HousePin | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = s(o.id).trim();
  const loopId = s(o.loopId).trim();
  if (!id || !loopId) return null;
  return serializePin({
    id,
    loopId,
    lat: n(o.lat),
    lng: n(o.lng),
    houseNumber: s(o.houseNumber).trim(),
    note: s(o.note).trim(),
    status: asPinStatus(o.status),
    curbTags: asCurbTags(o.curbTags),
    createdAt: s(o.createdAt) || new Date().toISOString(),
    updatedAt: s(o.updatedAt) || s(o.createdAt) || new Date().toISOString(),
  });
}

export function serializePin(p: HousePin): HousePin {
  return {
    id: p.id,
    loopId: p.loopId,
    lat: n(p.lat),
    lng: n(p.lng),
    houseNumber: s(p.houseNumber).trim(),
    note: s(p.note).trim(),
    status: asPinStatus(p.status),
    curbTags: asCurbTags(p.curbTags),
    createdAt: s(p.createdAt),
    updatedAt: s(p.updatedAt),
  };
}

export function restorePins(raw: unknown): HousePin[] {
  if (!Array.isArray(raw)) return [];
  const out: HousePin[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const p = restorePin(row);
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

export function pinsForLoop(pins: HousePin[], loopId: string): HousePin[] {
  const id = loopId.trim();
  if (!id) return [];
  return pins.filter((p) => p.loopId === id);
}

export function morningPins(pins: HousePin[]): HousePin[] {
  return pins.filter((p) => p.status === "set" || p.status === "revisit");
}

export function revisitPins(pins: HousePin[]): HousePin[] {
  return pins.filter((p) => p.status === "revisit");
}

export function lastPinOnLoop(pins: HousePin[], loopId: string): HousePin | undefined {
  const mine = pinsForLoop(pins, loopId);
  if (!mine.length) return undefined;
  return mine.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b));
}

export function pinHasPoint(p: Pick<HousePin, "lat" | "lng">): boolean {
  return Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0);
}

export function pinMapsUrl(p: Pick<HousePin, "lat" | "lng">): string {
  const q = pinHasPoint(p) ? `${p.lat},${p.lng}` : "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Phone wins non-empty fields. Incoming adds pins this phone does not have. */
export function mergePins(current: HousePin[], incoming: HousePin[]): HousePin[] {
  const have = new Map(current.map((p) => [p.id, serializePin(p)]));
  for (const raw of incoming) {
    const next = restorePin(raw);
    if (!next) continue;
    const cur = have.get(next.id);
    if (!cur) {
      have.set(next.id, next);
      continue;
    }
    have.set(next.id, {
      ...next,
      houseNumber: cur.houseNumber.trim() || next.houseNumber,
      note: cur.note.trim() || next.note,
      status: cur.status || next.status,
      curbTags: cur.curbTags.length ? cur.curbTags : next.curbTags,
      lat: pinHasPoint(cur) ? cur.lat : next.lat,
      lng: pinHasPoint(cur) ? cur.lng : next.lng,
      loopId: cur.loopId || next.loopId,
      createdAt: cur.createdAt || next.createdAt,
      updatedAt: cur.updatedAt || next.updatedAt,
    });
  }
  return [...have.values()].slice(0, MAX_BACKUP_PINS);
}

export function pinsLineForCoach(pins: HousePin[]): string {
  if (!pins.length) {
    return "# Pins\nNo house pins yet. They drop from Truck onto the Working loop. Do not invent an address or a name.";
  }
  const revisit = pins.filter((p) => p.status === "revisit").length;
  const byLoop = new Map<string, { n: number; revisit: number }>();
  for (const p of pins) {
    const cur = byLoop.get(p.loopId) ?? { n: 0, revisit: 0 };
    cur.n += 1;
    if (p.status === "revisit") cur.revisit += 1;
    byLoop.set(p.loopId, cur);
  }
  const lines = [
    "# Pins (houses on a loop. Not a CRM. Do not invent an address or a name.)",
    `${pins.length} pin${pins.length === 1 ? "" : "s"}. ${revisit} revisit.`,
  ];
  for (const [loopId, t] of [...byLoop.entries()].slice(0, 24)) {
    lines.push(`- loop ${loopId}: ${t.n} pin${t.n === 1 ? "" : "s"}${t.revisit ? `, ${t.revisit} revisit` : ""}`);
  }
  return lines.join("\n");
}
