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
  beds: number | null;
  baths: number | null;
  livingSqft: number | null;
  listingUrl: string | null;
  listingSource: string | null;
  zillowUrl: string;
  redfinUrl: string;
  notes: string[];
};

type GeoHit = { lat: number; lng: number; address: string };

const UA = "Roofus/2.0.1 (porch coach; contact: roofus)";

function mapsKey(fromClient?: string) {
  const paul = String(process.env.GOOGLE_MAPS_API_KEY ?? "").trim();
  return fromClient?.trim() || paul;
}

function listingUrls(address: string) {
  const q = address.replace(/,/g, " ").replace(/\s+/g, " ").trim();
  const zillowUrl = `https://www.zillow.com/homes/${encodeURIComponent(q)}_rb/`;
  const redfinUrl = `https://www.redfin.com/v1/search?search_term=${encodeURIComponent(q)}`;
  return { zillowUrl, redfinUrl };
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
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8_000) });
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
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8_000) });
      const json = (await res.json()) as { display_name?: string };
      if (json.display_name) return { ok: true, address: json.display_name };
    } catch {
      /* ignore */
    }
    return { ok: false };
  });

function parseYear(raw: unknown): number | null {
  if (raw == null) return null;
  const m = String(raw).match(/(18|19|20)\d{2}/);
  if (!m) return null;
  const y = Number(m[0]);
  const now = new Date().getFullYear();
  if (y < 1800 || y > now) return null;
  return y;
}

async function censusPlace(lat: number, lng: number) {
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return { county: null, place: null, state: null };
    const json = (await res.json()) as {
      result?: { geographies?: Record<string, { NAME?: string; BASENAME?: string }[]> };
    };
    const g = json.result?.geographies ?? {};
    const county = g["Counties"]?.[0]?.NAME ?? null;
    const place =
      g["Incorporated Places"]?.[0]?.NAME ?? g["Census Designated Places"]?.[0]?.NAME ?? null;
    const state = g["States"]?.[0]?.BASENAME ?? g["States"]?.[0]?.NAME ?? null;
    return { county, place, state };
  } catch {
    return { county: null, place: null, state: null };
  }
}

async function nominatimHouse(lat: number, lng: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&extratags=1&addressdetails=1`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      display_name?: string;
      extratags?: Record<string, string> | null;
      address?: Record<string, string>;
      class?: string;
      type?: string;
    };
    return json;
  } catch {
    return null;
  }
}

/** Best-effort. Grok searches open listing pages. Zillow/Redfin stay tap-to-open. */
async function listingHints(address: string): Promise<{
  yearBuilt: number | null;
  yearSource: string | null;
  beds: number | null;
  baths: number | null;
  livingSqft: number | null;
  stories: number | null;
  listingUrl: string | null;
  listingSource: string | null;
  notes: string[];
}> {
  const empty = {
    yearBuilt: null as number | null,
    yearSource: null as string | null,
    beds: null as number | null,
    baths: null as number | null,
    livingSqft: null as number | null,
    stories: null as number | null,
    listingUrl: null as string | null,
    listingSource: null as string | null,
    notes: [] as string[],
  };
  const grok = await grokOpenListings(address);
  if (!grok) {
    empty.notes.push("No listing found for this address. Try Zillow on this phone.");
    return empty;
  }
  return grok;
}

function houseNumber(address: string): string | null {
  const m = address.trim().match(/^(\d+[A-Za-z]?)\b/);
  return m ? m[1].toLowerCase() : null;
}

function streetToken(address: string): string | null {
  const m = address.trim().match(/^\d+[A-Za-z]?\s+(.+?)(?:,|$)/);
  if (!m) return null;
  const first = m[1].toLowerCase().replace(/\./g, " ").split(/\s+/)[0];
  if (!first || first.length < 4) return null;
  return first;
}

function looksLikeThisHouse(address: string, url: string | null, matched: string | null): boolean {
  const n = houseNumber(address);
  const street = streetToken(address);
  const blob = `${url ?? ""} ${matched ?? ""}`.toLowerCase();
  if (n && !new RegExp(`(?:^|[^0-9])${n}(?:[^0-9]|$)`).test(blob)) return false;
  if (street && url && !url.toLowerCase().includes(street)) return false;
  return true;
}

type GrokListing = {
  yearBuilt: number | null;
  beds: number | null;
  baths: number | null;
  livingSqft: number | null;
  stories: number | null;
  source: string | null;
  url: string | null;
  matchedAddress: string | null;
};

async function grokOpenListings(address: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.x.ai/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.3",
        max_output_tokens: 350,
        instructions:
          "Look up ONE house on the public web. Street number must match exactly. Neighboring numbers on the same street are a miss. Never invent. JSON only.",
        input: [
          {
            role: "user",
            content: `Exact address: ${address}.
Search open listing pages (Realtor.com, Homes.com, Compass, Coldwell Banker, Movoto).
Return JSON only:
{"yearBuilt":number|null,"beds":number|null,"baths":number|null,"livingSqft":number|null,"stories":number|null,"source":string|null,"url":string|null,"matchedAddress":string|null}
If house number does not match, all fields null and source "no exact match".`,
          },
        ],
        tools: [
          {
            type: "web_search",
            filters: {
              allowed_domains: [
                "realtor.com",
                "homes.com",
                "compass.com",
                "coldwellbankerhomes.com",
                "movoto.com",
              ],
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(40_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      output?: { type?: string; content?: { text?: string }[] }[];
    };
    const text = body.output
      ?.filter((x) => x.type === "message")
      .map((x) => x.content?.[0]?.text ?? "")
      .join("\n");
    if (!text) return null;
    const jsonText = text.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonText) return null;
    const parsed = JSON.parse(jsonText) as GrokListing;
    const url = typeof parsed.url === "string" ? parsed.url : null;
    const matched = typeof parsed.matchedAddress === "string" ? parsed.matchedAddress : null;
    if (!looksLikeThisHouse(address, url, matched)) {
      return {
        yearBuilt: null,
        yearSource: null,
        beds: null,
        baths: null,
        livingSqft: null,
        stories: null,
        listingUrl: null,
        listingSource: null,
        notes: ["Search found a different house on the street. Skip that year."],
      };
    }
    const year = parseYear(parsed.yearBuilt);
    const source = parsed.source && parsed.source !== "no exact match" ? parsed.source : null;
    if (!year && !parsed.beds && !parsed.livingSqft) {
      return {
        yearBuilt: null,
        yearSource: null,
        beds: null,
        baths: null,
        livingSqft: null,
        stories: null,
        listingUrl: url,
        listingSource: source,
        notes: ["No listing found for this address. Try Zillow on this phone."],
      };
    }
    return {
      yearBuilt: year,
      yearSource: year ? source ?? "Open listing" : null,
      beds: typeof parsed.beds === "number" ? parsed.beds : null,
      baths: typeof parsed.baths === "number" ? parsed.baths : null,
      livingSqft: typeof parsed.livingSqft === "number" ? parsed.livingSqft : null,
      stories: typeof parsed.stories === "number" ? parsed.stories : null,
      listingUrl: url,
      listingSource: source,
      notes: source ? [`Open page: ${source}.`] : [],
    };
  } catch {
    return null;
  }
}

export function formatHouseBlurb(h: HouseBrief): string {
  const lines = [
    h.address,
    h.yearBuilt ? `Year built: ${h.yearBuilt} (${h.yearSource ?? "listing"})` : "Year built: unknown",
    h.stories ? `Stories: ${h.stories}` : null,
    h.beds || h.baths ? `${h.beds ?? "?"} bed / ${h.baths ?? "?"} bath` : null,
    h.livingSqft ? `Living: ${h.livingSqft.toLocaleString()} sqft` : null,
    h.roofShape || h.roofMaterial
      ? `Roof: ${[h.roofShape, h.roofMaterial].filter(Boolean).join(", ")}`
      : null,
    h.building ? `Building: ${h.building}` : null,
    [h.place, h.county, h.state].filter(Boolean).length
      ? `Place: ${[h.place, h.county, h.state].filter(Boolean).join(", ")}`
      : null,
    h.listingUrl ? `Listing: ${h.listingSource ?? "open page"} · ${h.listingUrl}` : null,
    `Zillow: ${h.zillowUrl}`,
    `Redfin: ${h.redfinUrl}`,
    "Facts for this pin. If a year is missing, say so. Do not invent weather.",
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
      const lat = data.lat;
      const lng = data.lng;
      const notes: string[] = [];
      try {
        const [place, osm, listings] = await Promise.all([
          censusPlace(lat, lng),
          nominatimHouse(lat, lng),
          listingHints(data.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`),
        ]);
        const address = data.address || osm?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        const tags = osm?.extratags ?? {};
        const year =
          listings.yearBuilt ??
          parseYear(tags.start_date) ??
          parseYear(tags["building:year"]) ??
          parseYear(tags.year);
        const yearSource =
          listings.yearBuilt && listings.yearSource
            ? listings.yearSource
            : year
              ? "OpenStreetMap"
              : null;
        const levels = tags["building:levels"] ? Number(tags["building:levels"]) : NaN;
        const { zillowUrl, redfinUrl } = listingUrls(address);
        if (!year) {
          notes.push(
            listings.notes.length
              ? listings.notes.shift() ?? ""
              : "Year unknown. Ask on the porch, or open Zillow.",
          );
        }
        notes.push(...listings.notes.filter(Boolean));
        return {
          ok: true,
          brief: {
            address,
            lat,
            lng,
            county: place.county,
            place: place.place ?? osm?.address?.city ?? osm?.address?.town ?? null,
            state: place.state,
            yearBuilt: year,
            yearSource,
            stories: listings.stories ?? (Number.isFinite(levels) ? levels : null),
            roofShape: tags["roof:shape"] ?? null,
            roofMaterial: tags["roof:material"] ?? tags["building:material"] ?? null,
            building: osm?.type && osm.type !== "yes" ? osm.type : null,
            beds: listings.beds,
            baths: listings.baths,
            livingSqft: listings.livingSqft,
            listingUrl: listings.listingUrl,
            listingSource: listings.listingSource,
            zillowUrl,
            redfinUrl,
            notes,
          },
        };
      } catch {
        const { zillowUrl, redfinUrl } = listingUrls(
          data.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        );
        return {
          ok: true,
          brief: {
            address: data.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat,
            lng,
            county: null,
            place: null,
            state: null,
            yearBuilt: null,
            yearSource: null,
            stories: null,
            roofShape: null,
            roofMaterial: null,
            building: null,
            beds: null,
            baths: null,
            livingSqft: null,
            listingUrl: null,
            listingSource: null,
            zillowUrl,
            redfinUrl,
            notes: ["Could not finish the lookup. Move the pin, or try Zillow."],
          },
        };
      }
    },
  );
