import { useRouterState } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useRef } from "react";
import { Tip } from "@/components/ui/tooltip";
import { useCoach, whenCoachReady } from "@/lib/coach-store";

export function AskFab() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const resume = useCoach((s) => s.resume);
  const openSheet = useCoach((s) => s.openSheet);
  const sheetOpen = useCoach((s) => s.sheetOpen);
  const setHistoryOpen = useCoach((s) => s.setHistoryOpen);
  const long = useRef(false);
  const timer = useRef(0);
  const onInspect = path.startsWith("/coach/inspect");

  function clearTimer() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = 0;
  }

  function onDown() {
    long.current = false;
    clearTimer();
    timer.current = window.setTimeout(() => {
      long.current = true;
      setHistoryOpen(true);
    }, 450);
  }

  function tap() {
    clearTimer();
    if (long.current) return;
    whenCoachReady(() => {
      resume();
      openSheet();
    });
  }

  if (onInspect || sheetOpen) return null;

  return (
    <Tip label="Tap Roofus. Hold for past chats." side="left">
      <button
        type="button"
        aria-label="Talk to Roofus"
        className="fixed right-4 z-30 flex size-14 items-center justify-center rounded-full bg-accent text-paper shadow-lg ring-2 ring-paper/40"
        style={{ bottom: "calc(4.25rem + env(safe-area-inset-bottom))" }}
        onPointerDown={onDown}
        onPointerUp={tap}
        onClick={tap}
        onPointerCancel={clearTimer}
        onContextMenu={(e) => e.preventDefault()}
      >
        <MessageSquare className="size-6" />
      </button>
    </Tip>
  );
}
