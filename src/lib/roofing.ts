export const PITCH_PRESETS = [
  { id: "3", ratio: "3/12", deg: 14, customer: "low slope" },
  { id: "4", ratio: "4/12", deg: 18, customer: "low slope" },
  { id: "6", ratio: "6/12", deg: 27, customer: "standard slope" },
  { id: "8", ratio: "8/12", deg: 34, customer: "standard slope" },
  { id: "10", ratio: "10/12", deg: 40, customer: "steep slope" },
  { id: "12", ratio: "12/12", deg: 45, customer: "steep slope" },
] as const;

export type PitchId = (typeof PITCH_PRESETS)[number]["id"];

export const PRODUCTS = [
  { id: "duration", name: "Owens Corning Duration", line: "Owens Corning Duration" },
  { id: "metal", name: "Metal", line: "standing-seam metal" },
  { id: "vinyl-slate", name: "Vinyl slate", line: "vinyl slate" },
] as const;

export type ProductId = (typeof PRODUCTS)[number]["id"];

export const MATERIALS = [
  { id: "architectural", label: "Architectural shingle" },
  { id: "3tab", label: "3-tab shingle" },
  { id: "metal", label: "Metal" },
  { id: "tile", label: "Tile" },
  { id: "slate", label: "Slate" },
  { id: "wood", label: "Wood shake" },
] as const;

export type MaterialId = (typeof MATERIALS)[number]["id"];

export const COMPLEXITY_LABEL = ["Simple", "Hip", "Cut-up", "Steep cut-up"] as const;

export type Complexity = 0 | 1 | 2 | 3;

export type RoofAnalysis = {
  pitchPreset: PitchId;
  pitchDeg: number;
  stories: 1 | 2 | 3;
  complexity: Complexity;
  wastePct: number;
  material: MaterialId;
  hasSolar: boolean;
};

export type PriceBook = {
  sellPerSq: Record<ProductId, number>;
  install: Record<ProductId, { low: number; standard: number; steep: number }>;
  plywoodUsd: number;
  permitUsd: number;
  marketMultiplier: number;
};

export const DEFAULT_BOOK: PriceBook = {
  sellPerSq: { duration: 550, metal: 850, "vinyl-slate": 720 },
  install: {
    duration: { low: 550, standard: 550, steep: 550 },
    metal: { low: 850, standard: 850, steep: 850 },
    "vinyl-slate": { low: 720, standard: 720, steep: 720 },
  },
  plywoodUsd: 85,
  permitUsd: 0,
  marketMultiplier: 1.24,
};

export type QuoteResult = {
  roofSquares: number;
  orderSquares: number;
  planSqFt: number;
  wastePct: number;
  installUsd: number;
  rangeLow: number;
  rangeHigh: number;
  marketLow: number;
  marketHigh: number;
};

export function pitchById(id: string) {
  return PITCH_PRESETS.find((p) => p.id === id) ?? PITCH_PRESETS[2];
}

export function productById(id: string) {
  return PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];
}

export function materialLabel(id: string) {
  return MATERIALS.find((m) => m.id === id)?.label ?? "Architectural shingle";
}

export function nearestPitchFromDegrees(deg: number): PitchId {
  let best: PitchId = "6";
  let dist = Infinity;
  for (const p of PITCH_PRESETS) {
    const d = Math.abs(p.deg - deg);
    if (d < dist) {
      dist = d;
      best = p.id;
    }
  }
  return best;
}

export function snapPitch(raw: string): PitchId {
  const n = Number(String(raw).split("/")[0]);
  if (!Number.isFinite(n)) return "6";
  const deg = (Math.atan(n / 12) * 180) / Math.PI;
  return nearestPitchFromDegrees(deg);
}

export function complexityFromInstant(cls: number): Complexity {
  if (cls >= 3) return 3;
  if (cls >= 2) return 2;
  if (cls >= 1) return 1;
  return 0;
}

function roundMoney(n: number) {
  return Math.round(n / 100) * 100;
}

export function confidencePad(label: string) {
  const t = label.toLowerCase();
  if (t.includes("high")) return 0.14;
  if (t.includes("low")) return 0.28;
  return 0.2;
}

export type QuoteInput = {
  product: ProductId;
  roofSquares: number;
  orderSquares: number;
  planSqFt: number;
  wastePct: number;
  confidenceLabel: string;
};

export function computeQuote(input: QuoteInput, book: PriceBook): QuoteResult {
  const rate = book.sellPerSq[input.product] ?? 550;
  const installUsd = input.orderSquares * rate;
  const pad = confidencePad(input.confidenceLabel);
  const rangeLow = roundMoney(installUsd);
  const rangeHigh = roundMoney(installUsd * (1 + pad));
  return {
    roofSquares: input.roofSquares,
    orderSquares: input.orderSquares,
    planSqFt: input.planSqFt,
    wastePct: input.wastePct,
    installUsd,
    rangeLow,
    rangeHigh,
    marketLow: roundMoney(installUsd * book.marketMultiplier),
    marketHigh: roundMoney(installUsd * (153 / 100)),
  };
}