import { snapPitch, type PitchId } from "@/lib/roofing";

export type InstantSlice = {
  aerialSqFt: number;
  measuredSqFt: number;
  suggestedSqFt: number;
  squares: number;
  pitchRaw: string;
  pitchPreset: PitchId;
  complexityClass: number;
  wastePct: number;
  perimeterFt: number;
  facets: number;
  stories: 1 | 2 | 3;
  confidenceLabel: string;
  confidenceScore: number;
  imageDataUrl: string | null;
  centerLat: number;
  centerLng: number;
  /** Bird's-eye × one pitch. Steep lower mansard faces often missing. */
  planOnlyRisk: boolean;
};

export type InstantHit = {
  slice: InstantSlice | null;
  skip: "no-key" | "key" | "miss" | null;
  detail?: string;
};

type IrJson = {
  measurements?: {
    sqft?: { aerial?: number; measured?: number; suggested?: number };
    squares?: number;
    pitch?: string;
    complexity?: number;
    perimeter?: number;
    facets?: number;
    stories?: number;
    confidence?: { score?: number; display?: { value?: string } };
  };
  buildingPredictions?: { complexityClass?: number; complexityWaste?: number };
  imagery?: { mapWithOutline?: string; mapWithoutLine?: string };
  coordinates?: { latitude?: number; longitude?: number };
};

function toDataUrl(raw?: string | null): string | null {
  if (!raw || raw.length < 80) return null;
  if (raw.startsWith("data:")) {
    return raw.length > 700_000 ? null : raw;
  }
  if (raw.length > 500_000) return null;
  const mime = raw.startsWith("/9j/") ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${raw}`;
}

function planOnlyRisk(aerial: number, measured: number, stories: 1 | 2 | 3, pitchPreset: PitchId) {
  if (aerial < 400) return false;
  const factor = measured / aerial;
  const shallow = pitchPreset === "3" || pitchPreset === "4" || pitchPreset === "6";
  return stories >= 2 && shallow && factor < 1.22;
}

export async function fetchInstantRoofer(
  lat: number,
  lng: number,
  key: string,
  address?: string,
): Promise<InstantHit> {
  const trimmed = key.trim();
  if (!trimmed) return { slice: null, skip: "no-key" };
  try {
    const body: Record<string, unknown> = { latitude: lat, longitude: lng };
    if (address?.trim()) body.originalAddress = address.trim();
    const res = await fetch("https://v5.instantroofer.com/v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${trimmed}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(35_000),
    });
    if (res.status === 401 || res.status === 403) {
      return { slice: null, skip: "key", detail: "Instant Roofer rejected the key." };
    }
    if (res.status === 422) {
      return { slice: null, skip: "miss", detail: "Instant Roofer called this roof too irregular." };
    }
    if (res.status === 504) {
      return { slice: null, skip: "miss", detail: "Instant Roofer timed out. Retry." };
    }
    if (!res.ok) return { slice: null, skip: "miss", detail: `Instant Roofer ${res.status}.` };
    const json = (await res.json()) as IrJson;
    const m = json.measurements;
    const measured = Number(m?.sqft?.measured) || 0;
    const suggested = Number(m?.sqft?.suggested) || 0;
    const aerial = Number(m?.sqft?.aerial) || 0;
    const squares = Number(m?.squares) || (suggested ? suggested / 100 : 0);
    if (squares < 4 && measured < 400) {
      return { slice: null, skip: "miss", detail: "Instant Roofer sent no usable squares." };
    }
    const pitchRaw = String(m?.pitch ?? "6/12");
    const pitchPreset = snapPitch(pitchRaw);
    const wasteFromSq =
      measured > 50 && squares > 0 ? Math.max(0, (squares * 100) / measured - 1) * 100 : 0;
    const wasteFromPred = Number(json.buildingPredictions?.complexityWaste);
    const wastePct =
      wasteFromSq > 0
        ? wasteFromSq
        : Number.isFinite(wasteFromPred) && wasteFromPred > 0
          ? wasteFromPred
          : 8;
    const storiesRaw = Number(m?.stories) || 1;
    const stories = storiesRaw >= 3 ? 3 : storiesRaw >= 2 ? 2 : 1;
    const img =
      toDataUrl(json.imagery?.mapWithOutline) ?? toDataUrl(json.imagery?.mapWithoutLine);
    return {
      slice: {
        aerialSqFt: aerial,
        measuredSqFt: measured || squares * 100,
        suggestedSqFt: suggested || squares * 100,
        squares,
        pitchRaw,
        pitchPreset,
        complexityClass: Number(m?.complexity ?? json.buildingPredictions?.complexityClass) || 0,
        wastePct: Math.round(Math.min(25, Math.max(0, wastePct))),
        perimeterFt: Number(m?.perimeter) || 0,
        facets: Number(m?.facets) || 0,
        stories,
        confidenceLabel: String(m?.confidence?.display?.value ?? "Medium"),
        confidenceScore: Number(m?.confidence?.score) || 0,
        imageDataUrl: img,
        centerLat: Number(json.coordinates?.latitude) || lat,
        centerLng: Number(json.coordinates?.longitude) || lng,
        planOnlyRisk: planOnlyRisk(aerial, measured || squares * 100, stories, pitchPreset),
      },
      skip: null,
    };
  } catch (e) {
    const timedOut = e instanceof Error && /timeout|aborted/i.test(e.message);
    return {
      slice: null,
      skip: "miss",
      detail: timedOut ? "Instant Roofer timed out. Retry." : "Instant Roofer did not answer.",
    };
  }
}
