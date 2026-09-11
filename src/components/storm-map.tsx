import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const SAT =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ATTR = "Tiles © Esri";
const MAX_ZOOM = 13;
const ACCENT = "#c45c26";

export type StormMapPin = { key: string; lat: number; lon: number };

function leaflet(mod: unknown): typeof import("leaflet") {
  const m = mod as { default?: typeof import("leaflet"); map?: unknown };
  if (m.default && typeof m.default.map === "function") return m.default;
  return m as typeof import("leaflet");
}

export function StormMap({
  pins,
  selectedKey,
  onSelect,
  fallback,
}: {
  pins: StormMapPin[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  fallback: { lat: number; lon: number } | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const marks = useRef<Map<string, import("leaflet").CircleMarker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const pinSig = pins.map((p) => `${p.key}:${p.lat}:${p.lon}`).join("|");
  const fbSig = fallback ? `${fallback.lat},${fallback.lon}` : "";

  useEffect(() => {
    if (!el.current) return;
    const center = pins[0] ?? fallback;
    if (!center) return;
    let cancelled = false;
    void import("leaflet").then((mod) => {
      if (cancelled || !el.current) return;
      const L = leaflet(mod);
      mapRef.current?.remove();
      const map = L.map(el.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        maxZoom: MAX_ZOOM,
        minZoom: 7,
      });
      L.tileLayer(SAT, { attribution: ATTR, maxZoom: 19 }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      mapRef.current = map;
      const next = new Map<string, import("leaflet").CircleMarker>();
      for (const p of pins) {
        const m = L.circleMarker([p.lat, p.lon], {
          radius: 10,
          color: "#f2f1ee",
          weight: 2,
          fillColor: ACCENT,
          fillOpacity: 0.9,
        }).addTo(map);
        m.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectRef.current(p.key);
        });
        next.set(p.key, m);
      }
      marks.current = next;
      map.on("click", () => onSelectRef.current(null));
      if (pins.length > 1) {
        map.fitBounds(
          L.latLngBounds(pins.map((p) => [p.lat, p.lon] as [number, number])),
          { padding: [28, 28], maxZoom: 12 },
        );
      } else {
        map.setView([center.lat, center.lon], pins.length ? 11 : 10);
      }
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      marks.current = new Map();
    };
    // pins/fallback are read via sigs so the map does not rebuild on a tap
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinSig, fbSig]);

  useEffect(() => {
    marks.current.forEach((m, key) => {
      m.setRadius(key === selectedKey ? 14 : 10);
      m.setStyle({ weight: key === selectedKey ? 3 : 2 });
    });
  }, [selectedKey, pinSig]);

  if (!pins.length && !fallback) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border">
      <div ref={el} className="h-72 w-full" />
    </div>
  );
}
