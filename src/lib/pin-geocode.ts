/** Reverse geocode via Google Maps JS. Key stays in VITE_GOOGLE_MAPS_KEY — never committed. */

export type GeoAddress = {
  address: string;
  city: string;
  state: string;
  zip: string;
  houseNumber: string;
};

export function mapsKey(): string {
  try {
    const v = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_GOOGLE_MAPS_KEY;
    return typeof v === "string" ? v.trim() : "";
  } catch {
    return "";
  }
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

export function loadGoogleMaps(key = mapsKey()): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.google?.maps) return Promise.resolve();
  if (!key) return Promise.reject(new Error("Map key missing"));
  if (mapsLoading) return mapsLoading;
  mapsLoading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-roofus-maps]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Map missed.")));
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
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
}

export function reverseGeocode(lat: number, lng: number): Promise<GeoAddress | null> {
  if (!mapsKey()) return Promise.resolve(null);
  return loadGoogleMaps().then(
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
}
