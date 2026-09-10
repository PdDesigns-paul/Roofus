import { useRouterState } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Tip } from "@/components/ui/tooltip";
import { useCoach } from "@/lib/coach-store";
import { openCoachMode } from "@/lib/open-coach";
import { COACH_MODES, threadTag, type CoachMode } from "@/lib/rufus-modes";

export function AskFab() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const sheetOpen = useCoach((s) => s.sheetOpen);
  const [fan, setFan] = useState(false);
  const long = useRef(false);
  const timer = useRef(0);
  const root = useRef<HTMLDivElement>(null);
  const onInspect = path.startsWith("/coach/inspect");

  useEffect(() => {
    if (sheetOpen || onInspect) setFan(false);
  }, [sheetOpen, onInspect]);

  useEffect(() => {
    if (!fan) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setFan(false);
    }
    function onPointer(e: PointerEvent) {
      if (root.current?.contains(e.target as Node)) return;
      setFan(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [fan]);

  function clearTimer() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = 0;
  }

  function openMode(mode: CoachMode) {
    setFan(false);
    openCoachMode(mode);
  }

  function onDown() {
    long.current = false;
    clearTimer();
    timer.current = window.setTimeout(() => {
      long.current = true;
      setFan(false);
      openMode("live");
    }, 450);
  }

  function onUp() {
    clearTimer();
    if (long.current) return;
    setFan((open) => !open);
  }

  if (onInspect || sheetOpen) return null;

  const fabBottom = "calc(8rem + env(safe-area-inset-bottom))";
  const fanBottom = "calc(12rem + env(safe-area-inset-bottom))";

  return (
    <div ref={root}>
      {fan ? <div className="pointer-events-none fixed inset-0 z-30 bg-fg/25" /> : null}
      {fan ? (
        <div
          className="fixed right-4 z-40 flex flex-col items-end gap-2"
          style={{ bottom: fanBottom }}
          role="menu"
        >
          {COACH_MODES.map((m) => {
            const tag = threadTag({ mode: m.id });
            return (
              <button
                key={m.id}
                type="button"
                role="menuitem"
                onClick={() => openMode(m.id)}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium shadow-lg ${tag.className}`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <Tip label="Tap to pick Live, Roleplay, or Mindset. Hold starts Live." side="left">
        <button
          type="button"
          aria-label="Talk to Roofus"
          aria-haspopup="menu"
          aria-expanded={fan}
          data-tour="roofus"
          className="fixed right-4 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-paper shadow-lg ring-2 ring-paper/40"
          style={{ bottom: fabBottom }}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={clearTimer}
          onClick={(e) => {
            if (long.current) e.preventDefault();
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <MessageSquare className="size-6" />
        </button>
      </Tip>
    </div>
  );
}
