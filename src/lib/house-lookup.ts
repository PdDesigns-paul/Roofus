import { createServerFn } from "@tanstack/react-start";

export type HouseBrief = {
  id: string;
  address: string;
  lat: number;
  lng: number;
  county: string | null;
  place: string | null;
  state: string | null;
  yearBuilt: number | null;
  yearSource: string | null;
  stories: number | null;
  roofShape: string | null;
  roofMaterial: string | null;
  building: string | null;
  notes: string[];
};

type GeoHit = { lat: number; lng: number; address: string };

function mapsKey(fromClient?: string) {
  const paul = String(process.env.GOOGLE_MAPS_API_KEY ?? "").trim();
  return fromClient?.trim() || paul;
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
      addressMatches?: { matchedAddress: string; coordinates: { x: number; y: number } }[];
    };
  };
  const hit = json.result?.addressMatches?.[0];
  if (!hit) return null;
  return { lat: hit.coordinates.y, lng: hit.coordinates.x, address: hit.matchedAddress };
}

async function geocodeNominatim(q: string): Promise<GeoHit | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Roofus/2.0" },
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
        headers: { "User-Agent": "Roofus/2.0" },
        signal: AbortSignal.timeout(8_000),
      });
      const json = (await res.json()) as { display_name?: string };
      if (json.display_name) return { ok: true, address: json.display_name };
    } catch {
      /* ignore */
    }
    return { ok: false };
  });

function parseYear(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const m = String(raw).match(/(18|19|20)\d{2}/);
  if (!m) return null;
  const y = Number(m[0]);
  if (y < 1800 || y > new Date().getFullYear()) return null;
  return y;
}

async function censusPlace(lat: number, lng: number) {
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return { county: null, place: null, state: null };
    const json = (await res.json()) as {
      result?: {
        geographies?: Record<string, { NAME?: string; BASENAME?: string }[]>;
      };
    };
    const g = json.result?.geographies ?? {};
    const county = g["Counties"]?.[0]?.NAME ?? null;
    const place = g["Incorporated Places"]?.[0]?.NAME ?? g["Census Designated Places"]?.[0]?.NAME ?? null;
    const state = g["States"]?.[0]?.BASENAME ?? g["States"]?.[0]?.NAME ?? null;
    return { county, place, state };
  } catch {
    return { county: null, place: null, state: null };
  }
}

async function osmBuilding(lat: number, lng: number) {
  const body = `[out:json][timeout:12];way(around:45,${lat},${lng})["building"];out tags center 8;`;
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "text/plain", "User-Agent": "Roofus/2.0" },
      body,
      signal: AbortSignal.timeout(14_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      elements?: {
        tags?: Record<string, string>;
        center?: { lat: number; lon: number };
      }[];
    };
    const els = json.elements ?? [];
    if (els.length === 0) return null;
    const nearest = els.reduce((best, el) => {
      const c = el.center;
      if (!c) return best;
      const d = (c.lat - lat) ** 2 + (c.lon - lng) ** 2;
      if (!best || d < best.d) return { el, d };
      return best;
    }, null as { el: (typeof els)[0]; d: number } | null);
    return (nearest?.el.tags ?? els[0]?.tags) || null;
  } catch {
    return null;
  }
}

export function formatHouseBlurb(h: HouseBrief): string {
  const lines = [
    h.address,
    h.yearBuilt ? `Year built: ${h.yearBuilt} (${h.yearSource ?? "public"})` : "Year built: not in this public set",
    h.stories ? `Stories: ${h.stories}` : null,
    h.roofShape || h.roofMaterial
      ? `Roof: ${[h.roofShape, h.roofMaterial].filter(Boolean).join(", ")}`
      : null,
    h.building ? `Building: ${h.building}` : null,
    [h.place, h.county, h.state].filter(Boolean).length
      ? `Place: ${[h.place, h.county, h.state].filter(Boolean).join(", ")}`
      : null,
    "Public-domain context only. Do not invent squares, a range, or a storm.",
  ].filter(Boolean);
  return lines.join("\n");
}

export const lookupHouse = createServerFn({ method: "POST" })
  .validator(
    (input: { lat: number; lng: number; address?: string; googleKey?: string }) => input,
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; brief: Omit<HouseBrief, "id"> } | { ok: false; error: string }> => {
      try {
        const [place, tags] = await Promise.all([
          censusPlace(data.lat, data.lng),
          osmBuilding(data.lat, data.lng),
        ]);
        const year =
          parseYear(tags?.start_date) ??
          parseYear(tags?.["building:year"]) ??
          parseYear(tags?.year);
        const levels = tags?.["building:levels"] ? Number(tags["building:levels"]) : NaN;
        const notes: string[] = [];
        if (!year) notes.push("Year not in OSM or Census for this pin. Ask on the porch.");
        return {
          ok: true,
          brief: {
            address: data.address || `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`,
            lat: data.lat,
            lng: data.lng,
            county: place.county,
            place: place.place,
            state: place.state,
            yearBuilt: year,
            yearSource: year ? "OpenStreetMap" : null,
            stories: Number.isFinite(levels) ? levels : null,
            roofShape: tags?.["roof:shape"] ?? null,
            roofMaterial: tags?.["roof:material"] ?? tags?.["building:material"] ?? null,
            building: tags?.building && tags.building !== "yes" ? tags.building : null,
            notes,
          },
        };
      } catch {
        return { ok: false, error: "Could not read public records for this pin." };
      }
    },
  );
