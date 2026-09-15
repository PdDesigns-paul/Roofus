/** Reverse geocode via Google Maps JS. Key is GOOGLE_MAPS_API_KEY on the server — never VITE_, never committed. */

export type GeoAddress = {
  address: string;
  city: string;
  state: string;
  zip: string;
  houseNumber: string;
};

let cachedKey: string | null = null;
let keyWait: Promise<string> | null = null;

/** Fetch once. Empty string means the host has no key — pins still save. */
export function mapsKey(): Promise<string> {
  if (cachedKey != null) return Promise.resolve(cachedKey);
  if (keyWait) return keyWait;
  if (typeof fetch === "undefined") return Promise.resolve("");
  keyWait = fetch("/api/maps-key")
    .then((r) => (r.ok ? r.json() : { key: "" }))
    .then((j: { key?: unknown }) => {
      cachedKey = typeof j.key === "string" ? j.key.trim() : "";
      return cachedKey;
    })
    .catch(() => {
      cachedKey = "";
      return "";
    })
    .finally(() => {
      keyWait = null;
    });
  return keyWait;
}

type GeoComponent = { long_name?: string; short_name?: string; types?: string[] };

export function parseGeocodeComponents(
  components: GeoComponent[],
  formatted = "",
): GeoAddress {
  const get = (type: string, short = false) => {
    const hit = components.find((c) => (c.types ?? []).includes(type));
    if (!hit) return "";
    return (short ? hit.short_name : hit.long_name) ?? "";
  };
  const houseNumber = get("street_number");
  const route = get("route");
  const city =
    get("locality") || get("sublocality") || get("neighborhood") || get("administrative_area_level_3");
  const state = get("administrative_area_level_1", true);
  const zip = get("postal_code");
  const street = [houseNumber, route].filter(Boolean).join(" ").trim();
  const address = street || (formatted.split(",")[0] ?? "").trim();
  return { address, city, state, zip, houseNumber };
}

type GoogleMaps = {
  maps: {
    Geocoder: new () => {
      geocode: (
        req: { location: { lat: number; lng: number } },
        cb: (results: { address_components?: GeoComponent[]; formatted_address?: string }[] | null, status: string) => void,
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMaps;
  }
}

let mapsLoading: Promise<void> | null = null;

export function loadGoogleMaps(key?: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.google?.maps) return Promise.resolve();
  const ready = key != null ? Promise.resolve(key) : mapsKey();
  return ready.then((k) => {
    if (!k) return Promise.reject(new Error("Map key missing"));
    if (mapsLoading) return mapsLoading;
    mapsLoading = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("script[data-roofus-maps]");
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Map missed.")));
        return;
      }
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(k)}&libraries=places`;
      s.async = true;
      s.dataset.roofusMaps = "1";
      s.onload = () => resolve();
      s.onerror = () => {
        mapsLoading = null;
        reject(new Error("Map missed."));
      };
      document.head.appendChild(s);
    });
    return mapsLoading;
  });
}

export function reverseGeocode(lat: number, lng: number): Promise<GeoAddress | null> {
  return mapsKey().then((k) => {
    if (!k) return null;
    return loadGoogleMaps(k).then(
      () =>
        new Promise((resolve) => {
          const g = window.google;
          if (!g?.maps?.Geocoder) {
            resolve(null);
            return;
          }
          const geo = new g.maps.Geocoder();
          geo.geocode({ location: { lat, lng } }, (results, status) => {
            if (status !== "OK" || !results?.[0]) {
              resolve(null);
              return;
            }
            resolve(parseGeocodeComponents(results[0].address_components ?? [], results[0].formatted_address ?? ""));
          });
        }),
    );
  });
}
