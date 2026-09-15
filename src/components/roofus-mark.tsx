/** Coach face. Inline SVG so the gold FAB stays sharp at 40px. Mood follows Live / Roleplay / Mindset. */

import type { CoachMode } from "@/lib/coach-modes";

export function RoofusFace({
  className = "size-10",
  alt = "Roofus",
  mood = "live",
  badge = false,
}: {
  className?: string;
  alt?: string;
  mood?: CoachMode;
  badge?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role={alt ? "img" : "presentation"}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      {badge ? <circle fill="#F5A623" cx="100" cy="102" r="86" /> : null}
      <path fill="#161616" d="M58 78 L48 18 Q50 8 62 14 L86 78 Z" />
      <path fill="#C9924A" d="M58 76 L54 28 Q56 22 64 26 L78 76 Z" />
      <path fill="#161616" d="M128 86 Q148 70 168 86 Q172 96 158 104 Q140 110 128 98 Z" />
      <path fill="#C9924A" d="M134 90 Q148 80 160 90 Q162 96 152 100 Q140 102 134 94 Z" />
      <path fill="#161616" d="M48 86 Q48 168 100 176 Q152 168 152 86 Q152 70 100 68 Q48 70 48 86 Z" />
      <path fill="#C4A05A" d="M56 86 Q58 46 100 42 Q142 46 144 86 Q120 78 100 78 Q80 78 56 86 Z" />
      <path d="M100 44 L100 80" fill="none" stroke="#A88440" strokeWidth="1.4" />
      <path fill="#6B4A2A" d="M54 84 Q100 76 146 84 Q146 92 100 90 Q54 92 54 84 Z" />
      <circle fill="#E6B422" cx="100" cy="46" r="4.2" />
      <path fill="#C9924A" d="M58 108 Q62 148 88 156 L84 112 Q72 100 58 108 Z" />
      <path fill="#C9924A" d="M142 108 Q138 148 112 156 L116 112 Q128 100 142 108 Z" />
      <path fill="#161616" d="M78 118 Q100 112 122 118 Q126 138 100 150 Q74 138 78 118 Z" />
      <path fill="#0E0E0E" d="M88 128 Q100 122 112 128 Q112 140 100 144 Q88 140 88 128 Z" />
      <ellipse cx="96" cy="130" rx="2.2" ry="1.4" fill="#3A3A3A" />
      <Eyes mood={mood} />
      {mood === "roleplay" ? (
        <path
          d="M86 146 Q100 156 114 146"
          fill="none"
          stroke="#C9924A"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      ) : null}
      <path fill="#C9924A" d="M78 162 Q100 172 122 162 Q118 178 100 180 Q82 178 78 162 Z" />
    </svg>
  );
}

function Eyes({ mood }: { mood: CoachMode }) {
  if (mood === "roleplay") {
    return (
      <>
        <ellipse fill="#E8A317" cx="78" cy="109" rx="8.2" ry="6.2" />
        <ellipse fill="#E8A317" cx="122" cy="109" rx="8.2" ry="6.2" />
        <circle cx="79.5" cy="109" r="2.3" fill="#1A1208" />
        <circle cx="123.5" cy="109" r="2.3" fill="#1A1208" />
      </>
    );
  }
  if (mood === "mindset") {
    return (
      <>
        <ellipse fill="#E8A317" cx="78" cy="110" rx="8" ry="5" />
        <ellipse fill="#E8A317" cx="122" cy="110" rx="8" ry="5" />
        <circle cx="79" cy="111" r="2.1" fill="#1A1208" />
        <circle cx="123" cy="111" r="2.1" fill="#1A1208" />
        <path d="M70 106 Q78 104 86 106" fill="none" stroke="#161616" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M114 106 Q122 104 130 106" fill="none" stroke="#161616" strokeWidth="2.4" strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <circle fill="#E8A317" cx="78" cy="108" r="8.4" />
      <circle fill="#E8A317" cx="122" cy="108" r="8.4" />
      <circle cx="80" cy="106" r="2.5" fill="#1A1208" />
      <circle cx="124" cy="106" r="2.5" fill="#1A1208" />
    </>
  );
}

export function RoofusMark({ className = "" }: { className?: string }) {
  return (
    <RoofusFace
      alt=""
      mood="live"
      className={
        className ||
        "pointer-events-none absolute bottom-0 left-[-8%] z-0 w-[58%] max-w-[260px] select-none opacity-25 dark:opacity-30"
      }
    />
  );
}
