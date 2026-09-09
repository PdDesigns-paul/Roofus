import { createServerFn } from "@tanstack/react-start";
import { fetchInstantRoofer, type InstantSlice } from "@/lib/instant-roofer";
import {
  complexityFromInstant,
  type RoofAnalysis,
} from "@/lib/roofing";

export type AerialResult = { url: string; kind: "ir" | "arcgis" };

export type TakeoffOk = {
  address: string;
  lat: number;
  lng: number;
  aerial: AerialResult | null;
  outline: null;
  analysis: RoofAnalysis;
  solar: null;
  instant: InstantSlice | null;
  solarSkip: "no-key" | "key" | "miss" | null;
};

type GeoHit = { lat: number; lng: number; address: string };

function mapsKey(fromClient?: string) {
  // Static names so the deployed server keeps these env vars.
  const paul = String(process.env.GOOGLE_MAPS_API_KEY ?? "").trim();
  return fromClient?.trim() || paul;
}

function instantKey(fromClient?: string) {
  const paul = String(process.env.INSTANT_ROOFER_API_KEY ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  const pasted = fromClient?.replace(/^Bearer\s+/i, "").trim() ?? "";
  return pasted || paul;
}

async function geocodeGoogle(q: string, key: string): Promise<GeoHit | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${encodeURIComponent(key)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    status: string;
    results?: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }[];
  };
  const hit = json.results?.[0];
  if (json.status !== "OK" || !hit) return null;
  return { lat: hit.geometry.location.lat, lng: hit.geometry.location.lng, address: hit.formatted_address };
}

async function geocodeCensus(q: string): Promise<GeoHit | null> {
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(q)}&benchmark=Public_AR_Current&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    result?: {
      addressMatches?: {
        matchedAddress: string;
        coordinates: { x: number; y: number };
      }[];
    };
  };
  const hit = json.result?.addressMatches?.[0];
  if (!hit) return null;
  return { lat: hit.coordinates.y, lng: hit.coordinates.x, address: hit.matchedAddress };
}

async function geocodeNominatim(q: string): Promise<GeoHit | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "RoofUs/1.2" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  const hit = json[0];
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon), address: hit.display_name };
}

export const geocodeAddress = createServerFn({ method: "POST" })
  .validator((input: { query: string; googleKey?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true; hit: GeoHit } | { ok: false; error: string }> => {
    try {
      const q = data.query.trim();
      if (!q) return { ok: false, error: "Type an address" };
      const key = mapsKey(data.googleKey);
      const google = key ? await geocodeGoogle(q, key) : null;
      const hit = google ?? (await geocodeCensus(q)) ?? (await geocodeNominatim(q));
      if (!hit) return { ok: false, error: "No match for that address" };
      return { ok: true, hit };
    } catch {
      return { ok: false, error: "Address lookup failed. Retry." };
    }
  });

export const reverseGeocode = createServerFn({ method: "POST" })
  .validator((input: { lat: number; lng: number; googleKey?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true; address: string } | { ok: false }> => {
    const key = mapsKey(data.googleKey);
    if (key) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${data.lat},${data.lng}&key=${encodeURIComponent(key)}`;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
        const json = (await res.json()) as { results?: { formatted_address: string }[] };
        const addr = json.results?.[0]?.formatted_address;
        if (addr) return { ok: true, address: addr };
      } catch {
        /* fall through */
      }
    }
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${data.lat}&lon=${data.lng}&format=json`;
      const res = await fetch(url, {
        headers: { "User-Agent": "RoofUs/1.2" },
        signal: AbortSignal.timeout(8_000),
      });
      const json = (await res.json()) as { display_name?: string };
      if (json.display_name) return { ok: true, address: json.display_name };
    } catch {
      /* ignore */
    }
    return { ok: false };
  });

async function fetchAerial(lat: number, lng: number): Promise<AerialResult | null> {
  const size = 800;
  const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${lng - 0.0007},${lat - 0.00055},${lng + 0.0007},${lat + 0.00055}&bboxSR=4326&imageSR=4326&size=${size},${size}&format=jpg&f=image`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return { url: `data:image/jpeg;base64,${buf.toString("base64")}`, kind: "arcgis" };
  } catch {
    return null;
  }
}

function fallbackAnalysis(instant: InstantSlice | null): RoofAnalysis {
  if (!instant) {
    return {
      pitchPreset: "6",
      pitchDeg: 27,
      stories: 1,
      complexity: 1,
      wastePct: 10,
      material: "architectural",
      hasSolar: false,
    };
  }
  const p = instant.pitchPreset;
  const deg = p === "3" ? 14 : p === "4" ? 18 : p === "8" ? 34 : p === "10" ? 40 : p === "12" ? 45 : 27;
  return {
    pitchPreset: instant.pitchPreset,
    pitchDeg: deg,
    stories: instant.stories,
    complexity: complexityFromInstant(instant.complexityClass),
    wastePct: instant.wastePct,
    material: "architectural",
    hasSolar: false,
  };
}

export const runTakeoff = createServerFn({ method: "POST" })
  .validator(
    (input: {
      lat: number;
      lng: number;
      address?: string;
      googleKey?: string;
      instantRooferKey?: string;
      cachedInstant?: InstantSlice | null;
    }) => input,
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; result: TakeoffOk } | { ok: false; error: string }> => {
      try {
        const irKey = data.cachedInstant ? "" : instantKey(data.instantRooferKey);
        const irHit = data.cachedInstant
          ? { slice: data.cachedInstant, skip: null, detail: undefined }
          : await fetchInstantRoofer(data.lat, data.lng, irKey, data.address);
        const instant = irHit.slice;
        const lat = instant?.centerLat || data.lat;
        const lng = instant?.centerLng || data.lng;
        const aerial: AerialResult | null = instant?.imageDataUrl
          ? { url: instant.imageDataUrl, kind: "ir" }
          : await fetchAerial(lat, lng);
        return {
          ok: true,
          result: {
            address: data.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat,
            lng,
            aerial,
            outline: null,
            analysis: fallbackAnalysis(instant),
            solar: null,
            instant,
            solarSkip: irHit.skip,
          },
        };
      } catch (e) {
        return {
          ok: false,
          error: e instanceof Error ? e.message : "Takeoff failed",
        };
      }
    },
  );