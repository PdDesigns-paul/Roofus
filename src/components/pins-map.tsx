import { useEffect, useRef, useState } from "react";
import { PinCard } from "@/components/pin-board";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { loadGoogleMaps, mapsKey, reverseGeocode } from "@/lib/pin-geocode";
import { findOpenLabor, localDateKey, useDayBook } from "@/lib/day-book";
import { pinHasPoint, pinMatchesYearFilter, type YearFilter } from "@/lib/pins";
import { usePins } from "@/lib/pins-store";
import { useStreets } from "@/lib/streets-store";

type GMap = {
  setCenter: (c: { lat: number; lng: number }) => void;
  setZoom: (n: number) => void;
  panTo: (c: { lat: number; lng: number }) => void;
  setMapTypeId: (id: string) => void;
  addListener: (ev: string, fn: (e: { latLng?: { lat: () => number; lng: () => number } }) => void) => unknown;
  getCenter: () => { lat: () => number; lng: () => number } | null;
};

type GMarker = {
  setPosition: (c: { lat: number; lng: number }) => void;
  setMap: (m: GMap | null) => void;
  addListener: (ev: string, fn: () => void) => unknown;
  getPosition: () => { lat: () => number; lng: () => number } | null;
};

type GPoly = {
  setPath: (path: { lat: number; lng: number }[]) => void;
  setMap: (m: GMap | null) => void;
};

type GMapsNs = {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap;
  Marker: new (opts: Record<string, unknown>) => GMarker;
  Polyline: new (opts: Record<string, unknown>) => GPoly;
  places?: {
    Autocomplete: new (el: HTMLInputElement, opts: Record<string, unknown>) => {
      addListener: (ev: string, fn: () => void) => unknown;
      getPlace: () => { geometry?: { location?: { lat: () => number; lng: () => number } } };
    };
  };
};

function gmaps(): GMapsNs | null {
  const g = (window as unknown as { google?: { maps?: GMapsNs } }).google?.maps;
  return g ?? null;
}

/** Hybrid = satellite roofs + street names. Roadmap is the drawing. */
function mapTypeId(satellite: boolean): "hybrid" | "roadmap" {
  return satellite ? "hybrid" : "roadmap";
}

export function PinsMap({
  yearFilter,
}: {
  yearFilter: YearFilter;
}) {
  const [key, setKey] = useState<string | null>(null);
  const pins = usePins((s) => s.pins);
  const add = usePins((s) => s.add);
  const update = usePins((s) => s.update);
  const loops = useStreets((s) => s.loops);
  const ageMin = useStreets((s) => s.ageMin);
  const ageMax = useStreets((s) => s.ageMax);
  const setMapCenter = useStreets((s) => s.setMapCenter);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [satellite, setSatellite] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const mapRef = useRef<GMap | null>(null);
  const marks = useRef<Map<string, GMarker>>(new Map());
  const lines = useRef<Map<string, GPoly>>(new Map());
  const days = useDayBook((s) => s.days);

  const visible = pins.filter((p) => pinMatchesYearFilter(p, yearFilter, ageMin, ageMax) && pinHasPoint(p));
  const workingId = loops.find((l) => l.status === "working")?.id;
  const pickedPin = pins.find((p) => p.id === picked);

  useEffect(() => {
    let live = true;
    void mapsKey().then((k) => {
      if (live) setKey(k);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!key) return;
    let live = true;
    void loadGoogleMaps(key)
      .then(() => {
        if (live) setReady(true);
      })
      .catch(() => {
        if (live) setErr("Map missed. Pins still save.");
      });
    return () => {
      live = false;
    };
  }, [key]);

  useEffect(() => {
    if (!ready || !box.current || mapRef.current) return;
    const maps = gmaps();
    if (!maps) return;
    const here = useStreets.getState().mapCenter;
    const first = visible[0];
    const center = here ?? (first ? { lat: first.lat, lng: first.lng } : { lat: 40.27, lng: -76.88 });
    const map = new maps.Map(box.current, {
      center,
      zoom: here || first ? 16 : 10,
      mapTypeId: mapTypeId(satellite),
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });
    mapRef.current = map;
    map.addListener("idle", () => {
      const c = map.getCenter();
      if (c) setMapCenter({ lat: c.lat(), lng: c.lng() });
    });
    map.addListener("click", (e) => {
      const loc = e.latLng;
      if (!loc) return;
      const pin = add({ lat: loc.lat(), lng: loc.lng(), source: "desk" });
      if (pin) setPicked(pin.id);
    });
    if (search.current && maps.places?.Autocomplete) {
      const auto = new maps.places.Autocomplete(search.current, { fields: ["geometry"] });
      auto.addListener("place_changed", () => {
        const loc = auto.getPlace().geometry?.location;
        if (!loc) return;
        map.panTo({ lat: loc.lat(), lng: loc.lng() });
        map.setZoom(17);
        setMapCenter({ lat: loc.lat(), lng: loc.lng() });
      });
    }
  }, [ready, add, setMapCenter, visible]);

  useEffect(() => {
    mapRef.current?.setMapTypeId(mapTypeId(satellite));
  }, [satellite]);

  useEffect(() => {
    const maps = gmaps();
    const map = mapRef.current;
    if (!ready || !maps || !map) return;
    const keep = new Set(visible.map((p) => p.id));
    for (const [id, mark] of marks.current) {
      if (!keep.has(id)) {
        mark.setMap(null);
        marks.current.delete(id);
      }
    }
    for (const pin of visible) {
      const existing = marks.current.get(pin.id);
      const color = pin.loopId && pin.loopId === workingId ? "#C45C26" : pin.source === "desk" ? "#6B6560" : "#1A1918";
      const label = pin.walkIndex ? String(pin.walkIndex) : "";
      if (existing) {
        existing.setPosition({ lat: pin.lat, lng: pin.lng });
        continue;
      }
      const mark = new maps.Marker({
        map,
        position: { lat: pin.lat, lng: pin.lng },
        draggable: true,
        label: label || undefined,
        icon: {
          path: "M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z",
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#FAF6EF",
          strokeWeight: 1,
          scale: 1.4,
          anchor: { x: 12, y: 22 },
        },
      });
      mark.addListener("click", () => setPicked(pin.id));
      mark.addListener("dragend", () => {
        const pos = mark.getPosition();
        if (!pos) return;
        const lat = pos.lat();
        const lng = pos.lng();
        update(pin.id, { lat, lng });
        setMapCenter({ lat, lng });
        void reverseGeocode(lat, lng).then((geo) => {
          if (geo) update(pin.id, geo);
        });
      });
      marks.current.set(pin.id, mark);
    }
  }, [ready, visible, workingId, update, setMapCenter]);

  useEffect(() => {
    const maps = gmaps();
    const map = mapRef.current;
    if (!ready || !maps || !map) return;
    const keep = new Set<string>();
    const dates = new Set<string>([localDateKey()]);
    const open = findOpenLabor(days);
    if (open) dates.add(open.date);
    for (const date of dates) {
      const path = (days[date]?.trail ?? []).map((p) => ({ lat: p.lat, lng: p.lng }));
      if (path.length < 2) continue;
      keep.add(date);
      const existing = lines.current.get(date);
      if (existing) {
        existing.setPath(path);
        continue;
      }
      const line = new maps.Polyline({
        map,
        path,
        strokeColor: "#6B6560",
        strokeOpacity: 0.5,
        strokeWeight: 3,
        clickable: false,
        zIndex: 0,
      });
      lines.current.set(date, line);
    }
    for (const [date, line] of lines.current) {
      if (!keep.has(date)) {
        line.setMap(null);
        lines.current.delete(date);
      }
    }
  }, [ready, days]);

  function centerMe() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErr("This phone will not share a location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapCenter(center);
        mapRef.current?.panTo(center);
        mapRef.current?.setZoom(16);
      },
      () => setErr("Could not get a location."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 15_000 },
    );
  }

  function searchGo(raw: string) {
    const q = raw.trim();
    if (!q || !mapRef.current) return;
    const zip = /^\d{5}$/.test(q);
    void (async () => {
      try {
        const maps = gmaps();
        if (!maps) return;
        const geo = new (maps as unknown as { Geocoder: new () => { geocode: (r: { address: string }, cb: (res: { geometry?: { location: { lat: () => number; lng: () => number } } }[] | null, st: string) => void) => void } }).Geocoder();
        geo.geocode({ address: q }, (res, st) => {
          const loc = res?.[0]?.geometry?.location;
          if (st !== "OK" || !loc) return;
          const center = { lat: loc.lat(), lng: loc.lng() };
          mapRef.current?.panTo(center);
          mapRef.current?.setZoom(zip ? 14 : 17);
          setMapCenter(center);
        });
      } catch {
        /* search box still works as Places */
      }
    })();
  }

  const keyMissing = key === "";
  const mapBox =
    key && ready ? (
      <div ref={box} data-no-pull className="mt-3 h-56 w-full overflow-hidden rounded-2xl border border-border" />
    ) : (
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {keyMissing
          ? "Map key missing — pins still save. Search a zip, then Pin from Today."
          : err || "Loading map…"}
      </p>
    );

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <Input
          ref={search}
          className="mt-0 min-w-0 flex-1"
          placeholder="Address or zip"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              searchGo(e.currentTarget.value);
            }
          }}
        />
        <button
          type="button"
          className="h-11 shrink-0 rounded-full border border-border px-3 text-sm"
          onClick={centerMe}
        >
          Me
        </button>
        <Chip selected={satellite} onClick={() => setSatellite((on) => !on)}>
          Satellite
        </Chip>
      </div>
      {mapBox}
      {err && key ? <p className="mt-2 text-sm leading-relaxed text-muted">{err}</p> : null}
      <p className="mt-2 text-xs text-faint">Tap the map to drop. Drag a pin onto the house.</p>
      {pickedPin ? (
        <div className="mt-3 rounded-2xl border border-border px-4 py-3">
          <PinCard pin={pickedPin} />
        </div>
      ) : null}
    </div>
  );
}
