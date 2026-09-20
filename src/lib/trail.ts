/** Foreground walk line. Not a pin. Not a live avatar. */

export type TrailPoint = { lat: number; lng: number; at: string };

export const TRAIL_MIN_METERS = 25;
export const MAX_TRAIL_POINTS = 400;

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function restoreTrailPoint(raw: unknown): TrailPoint | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { lat?: unknown; lng?: unknown; at?: unknown };
  const lat = typeof r.lat === "number" ? r.lat : Number(r.lat);
  const lng = typeof r.lng === "number" ? r.lng : Number(r.lng);
  const at = typeof r.at === "string" ? r.at : "";
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return null;
  if (!at || !Number.isFinite(Date.parse(at))) return null;
  return { lat, lng, at };
}

export function restoreTrail(raw: unknown): TrailPoint[] {
  if (!Array.isArray(raw)) return [];
  const out: TrailPoint[] = [];
  for (const item of raw) {
    const p = restoreTrailPoint(item);
    if (p) out.push(p);
  }
  return out.length > MAX_TRAIL_POINTS ? out.slice(out.length - MAX_TRAIL_POINTS) : out;
}

/** Drop points closer than ~25 m. Oldest drop first at the cap. */
export function appendTrailPoint(
  points: TrailPoint[],
  next: TrailPoint,
  minMeters = TRAIL_MIN_METERS,
  cap = MAX_TRAIL_POINTS,
): TrailPoint[] {
  const last = points[points.length - 1];
  if (last && haversineMeters(last, next) < minMeters) return points;
  const out = [...points, next];
  return out.length > cap ? out.slice(out.length - cap) : out;
}
