/** House log. Pins are the hunt. Distance makes the loop. Not a CRM. */

export const PIN_STATUSES = ["no-answer", "talked", "look", "set", "revisit", "skip"] as const;
export type PinStatus = (typeof PIN_STATUSES)[number];
export type PinStatusOrBlank = PinStatus | "";

export const CURB_TAGS = ["3-tab", "granules", "tarp", "missing tab", "no-solicit"] as const;
export type CurbTag = (typeof CURB_TAGS)[number];

export const ROOF_LOOKS = ["original-3tab", "mixed", "replaced", "unknown"] as const;
export type RoofLook = (typeof ROOF_LOOKS)[number];
export type RoofLookOrBlank = RoofLook | "";

export const PIN_SOURCES = ["truck", "desk"] as const;
export type PinSource = (typeof PIN_SOURCES)[number];

export const PIN_STATUS_LABEL: Record<PinStatus, string> = {
  "no-answer": "No answer",
  talked: "Talked",
  look: "Look",
  set: "Set",
  revisit: "Revisit",
  skip: "Skip",
};

export const ROOF_LOOK_LABEL: Record<RoofLook, string> = {
  "original-3tab": "Original 3-tab",
  mixed: "Mixed",
  replaced: "Replaced",
  unknown: "Unknown",
};

export type HousePin = {
  id: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  houseNumber: string;
  year: string;
  roofLook: RoofLookOrBlank;
  damage: string;
  nextStep: string;
  note: string;
  status: PinStatusOrBlank;
  curbTags: CurbTag[];
  source: PinSource;
  loopId: string;
  walkIndex: number;
  createdAt: string;
  updatedAt: string;
};

export const MAX_BACKUP_PINS = 500;

const STATUS_SET = new Set<string>(PIN_STATUSES);
const CURB_SET = new Set<string>(CURB_TAGS);
const ROOF_SET = new Set<string>(ROOF_LOOKS);
const SOURCE_SET = new Set<string>(PIN_SOURCES);

function s(v: unknown) {
  return typeof v === "string" ? v : "";
}

function n(v: unknown) {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function asPinStatus(v: unknown): PinStatusOrBlank {
  const t = s(v).trim();
  if (!t) return "";
  return STATUS_SET.has(t) ? (t as PinStatus) : "";
}

export function asRoofLook(v: unknown): RoofLookOrBlank {
  const t = s(v).trim();
  if (!t) return "";
  return ROOF_SET.has(t) ? (t as RoofLook) : "";
}

export function asPinSource(v: unknown): PinSource {
  const t = s(v).trim();
  return SOURCE_SET.has(t) ? (t as PinSource) : "truck";
}

export function asCurbTags(v: unknown): CurbTag[] {
  const raw = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
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
  lat: number;
  lng: number;
  source?: PinSource;
  loopId?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  houseNumber?: string;
  year?: string;
  roofLook?: RoofLookOrBlank;
  damage?: string;
  nextStep?: string;
  note?: string;
  status?: PinStatusOrBlank;
  curbTags?: CurbTag[];
}): HousePin {
  const now = new Date().toISOString();
  return serializePin({
    id: newPinId(),
    lat: n(input.lat),
    lng: n(input.lng),
    address: (input.address ?? "").trim(),
    city: (input.city ?? "").trim(),
    state: (input.state ?? "").trim(),
    zip: (input.zip ?? "").trim(),
    houseNumber: (input.houseNumber ?? "").trim(),
    year: (input.year ?? "").trim(),
    roofLook: input.roofLook ?? "",
    damage: (input.damage ?? "").trim(),
    nextStep: (input.nextStep ?? "").trim(),
    note: (input.note ?? "").trim(),
    status: input.status ?? "",
    curbTags: input.curbTags ?? [],
    source: input.source ?? "truck",
    loopId: (input.loopId ?? "").trim(),
    walkIndex: 0,
    createdAt: now,
    updatedAt: now,
  });
}

/** Drop unknown keys (owner, phone, parcel) so a junk blob cannot become PII. */
export function restorePin(raw: unknown): HousePin | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = s(o.id).trim();
  if (!id) return null;
  return serializePin({
    id,
    lat: n(o.lat),
    lng: n(o.lng),
    address: s(o.address ?? o.Address).trim(),
    city: s(o.city ?? o.City).trim(),
    state: s(o.state ?? o.State).trim(),
    zip: s(o.zip ?? o.Zip).trim(),
    houseNumber: s(o.houseNumber).trim(),
    year: s(o.year ?? o.Year).trim(),
    roofLook: asRoofLook(o.roofLook ?? o.Roof),
    damage: s(o.damage ?? o.Damage).trim(),
    nextStep: s(o.nextStep ?? o.Next).trim(),
    note: s(o.note).trim(),
    status: asPinStatus(o.status),
    curbTags: asCurbTags(o.curbTags),
    source: asPinSource(o.source),
    loopId: s(o.loopId).trim(),
    walkIndex: Math.max(0, Math.round(n(o.walkIndex))),
    createdAt: s(o.createdAt) || new Date().toISOString(),
    updatedAt: s(o.updatedAt) || s(o.createdAt) || new Date().toISOString(),
  });
}

export function serializePin(p: HousePin): HousePin {
  return {
    id: p.id,
    lat: n(p.lat),
    lng: n(p.lng),
    address: s(p.address).trim(),
    city: s(p.city).trim(),
    state: s(p.state).trim(),
    zip: s(p.zip).trim(),
    houseNumber: s(p.houseNumber).trim(),
    year: s(p.year).trim(),
    roofLook: asRoofLook(p.roofLook),
    damage: s(p.damage).trim(),
    nextStep: s(p.nextStep).trim(),
    note: s(p.note).trim(),
    status: asPinStatus(p.status),
    curbTags: asCurbTags(p.curbTags),
    source: asPinSource(p.source),
    loopId: s(p.loopId).trim(),
    walkIndex: Math.max(0, Math.round(n(p.walkIndex))),
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
  return pins.filter((p) => p.loopId === id).sort((a, b) => a.walkIndex - b.walkIndex || a.createdAt.localeCompare(b.createdAt));
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

/** Next door on the walking line: first blank status. */
export function nextBlankOnLoop(pins: HousePin[], loopId: string): HousePin | undefined {
  return pinsForLoop(pins, loopId).find((p) => !p.status);
}

export function pinHasPoint(p: Pick<HousePin, "lat" | "lng">): boolean {
  return Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0);
}

export function pinLabel(p: Pick<HousePin, "address" | "houseNumber" | "zip">): string {
  if (p.address.trim()) return p.address.trim();
  if (p.houseNumber.trim() && p.zip.trim()) return `${p.houseNumber.trim()} · ${p.zip.trim()}`;
  if (p.houseNumber.trim()) return p.houseNumber.trim();
  return "Pin";
}

/** Spoken color is the street, not the house number. */
export function streetNameOf(p: Pick<HousePin, "address" | "houseNumber">): string {
  const addr = p.address.trim();
  if (!addr) return "";
  const num = p.houseNumber.trim();
  if (num) {
    const escaped = num.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const stripped = addr.replace(new RegExp(`^${escaped}(?:\\s+|,\\s*)`), "").trim();
    if (stripped && stripped !== addr) return stripped;
  }
  const m = addr.match(/^\d+[A-Za-z]?\s+(.+)$/);
  return (m?.[1] ?? addr).trim();
}

export function pinQueryAddress(p: Pick<HousePin, "address" | "city" | "state" | "zip" | "houseNumber">): string {
  if (p.address.trim()) {
    return [p.address.trim(), p.city.trim(), p.state.trim(), p.zip.trim()].filter(Boolean).join(", ");
  }
  return [p.houseNumber.trim(), p.city.trim(), p.state.trim(), p.zip.trim()].filter(Boolean).join(", ");
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
      address: cur.address.trim() || next.address,
      city: cur.city.trim() || next.city,
      state: cur.state.trim() || next.state,
      zip: cur.zip.trim() || next.zip,
      houseNumber: cur.houseNumber.trim() || next.houseNumber,
      year: cur.year.trim() || next.year,
      roofLook: cur.roofLook || next.roofLook,
      damage: cur.damage.trim() || next.damage,
      nextStep: cur.nextStep.trim() || next.nextStep,
      note: cur.note.trim() || next.note,
      status: cur.status || next.status,
      curbTags: cur.curbTags.length ? cur.curbTags : next.curbTags,
      source: cur.source || next.source,
      lat: pinHasPoint(cur) ? cur.lat : next.lat,
      lng: pinHasPoint(cur) ? cur.lng : next.lng,
      loopId: cur.loopId || next.loopId,
      walkIndex: cur.walkIndex || next.walkIndex,
      createdAt: cur.createdAt || next.createdAt,
      updatedAt: cur.updatedAt || next.updatedAt,
    });
  }
  return [...have.values()].slice(0, MAX_BACKUP_PINS);
}

export type YearFilter = "all" | "band" | "blank";

export function pinYearAge(year: string, now = new Date().getFullYear()): number | null {
  const y = Number(year.trim());
  if (!Number.isFinite(y) || y < 1800 || y > now + 2) return null;
  return now - Math.round(y);
}

export function pinMatchesYearFilter(
  pin: Pick<HousePin, "year">,
  filter: YearFilter,
  ageMin: number,
  ageMax: number,
  now = new Date().getFullYear(),
): boolean {
  if (filter === "all") return true;
  const age = pinYearAge(pin.year, now);
  if (filter === "blank") return age == null;
  if (age == null) return false;
  return age >= ageMin && age <= ageMax;
}

export function pinsLineForCoach(pins: HousePin[]): string {
  if (!pins.length) {
    return "# Pins\nNo house pins yet. They drop from Today (GPS) or the Plan map. Do not invent an address or a name.";
  }
  const revisit = pins.filter((p) => p.status === "revisit").length;
  const desk = pins.filter((p) => p.source === "desk").length;
  const blank = pins.filter((p) => !p.status).length;
  const byLoop = new Map<string, { n: number; revisit: number }>();
  for (const p of pins) {
    const id = p.loopId || "(unclustered)";
    const cur = byLoop.get(id) ?? { n: 0, revisit: 0 };
    cur.n += 1;
    if (p.status === "revisit") cur.revisit += 1;
    byLoop.set(id, cur);
  }
  const lines = [
    "# Pins (houses they marked. Not a CRM. Do not invent an address, a year, or a name.)",
    `${pins.length} pin${pins.length === 1 ? "" : "s"}. ${revisit} revisit. ${blank} still blank. ${desk} desk.`,
  ];
  for (const [loopId, t] of [...byLoop.entries()].slice(0, 24)) {
    lines.push(`- loop ${loopId}: ${t.n} pin${t.n === 1 ? "" : "s"}${t.revisit ? `, ${t.revisit} revisit` : ""}`);
  }
  return lines.join("\n");
}
