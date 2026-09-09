import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  lat: number;
  lng: number;
  onCommit: (lat: number, lng: number) => void;
  busy?: boolean;
};

const SPAN_LAT = 0.0011;
const SPAN_LNG = 0.0016;

function satUrl(lat: number, lng: number) {
  const west = lng - SPAN_LNG / 2;
  const east = lng + SPAN_LNG / 2;
  const south = lat - SPAN_LAT / 2;
  const north = lat + SPAN_LAT / 2;
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${west},${south},${east},${north}&bboxSR=4326&imageSR=4326&size=640,400&format=jpg&f=image`;
}

export function PinMap({ lat, lng, onCommit, busy }: Props) {
  const [pin, setPin] = useState({ lat, lng });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPin({ lat, lng });
    setPan({ x: 0, y: 0 });
  }, [lat, lng]);

  const dirty = Math.abs(pin.lat - lat) > 1e-6 || Math.abs(pin.lng - lng) > 1e-6;
  const src = useMemo(() => satUrl(pin.lat, pin.lng), [pin.lat, pin.lng]);

  const onDown = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return;
    setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y });
  }, []);

  const onUp = useCallback(() => {
    if (!drag.current || !box.current) {
      drag.current = null;
      return;
    }
    const w = box.current.clientWidth || 1;
    const h = box.current.clientHeight || 1;
    setPin((p) => ({
      lat: p.lat + (pan.y / h) * SPAN_LAT,
      lng: p.lng - (pan.x / w) * SPAN_LNG,
    }));
    setPan({ x: 0, y: 0 });
    drag.current = null;
  }, [pan.x, pan.y]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div
        ref={box}
        className="relative aspect-[8/5] cursor-grab touch-none overflow-hidden active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, willChange: "transform" }}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="size-4 -translate-y-2 rounded-full border-2 border-paper bg-accent shadow" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-xs leading-relaxed text-muted">Drag if the pin missed the house.</p>
        <button
          type="button"
          disabled={!dirty || busy}
          onClick={() => onCommit(pin.lat, pin.lng)}
          className="shrink-0 rounded-full bg-fg px-3 py-2 text-xs text-paper disabled:opacity-40"
        >
          {busy ? "Looking…" : "Use this pin"}
        </button>
      </div>
    </div>
  );
}
