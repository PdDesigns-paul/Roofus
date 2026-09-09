import { useNavigate, useRouterState } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { useRef } from "react";
import { ChatHistory } from "@/components/chat-history";
import { Tip } from "@/components/ui/tooltip";
import { useCoach, whenCoachReady } from "@/lib/coach-store";

export function AskFab() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const resume = useCoach((s) => s.resume);
  const setHistoryOpen = useCoach((s) => s.setHistoryOpen);
  const long = useRef(false);
  const timer = useRef<number>(0);
  const onCoach = path === "/coach" || path === "/coach/";

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

  function onUp() {
    clearTimer();
    if (long.current) return;
    whenCoachReady(() => {
      resume();
      void navigate({ to: "/coach" });
    });
  }

  return (
    <>
      <ChatHistory />
      {onCoach ? null : (
        <Tip label="Tap to resume. Hold for history." side="left">
          <button
            type="button"
            aria-label="Roofus chats"
            className="fixed right-4 z-30 flex size-14 items-center justify-center rounded-full bg-fg text-paper shadow-lg hover:bg-fg/90"
            style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
            onPointerDown={onDown}
            onPointerUp={onUp}
            onPointerCancel={clearTimer}
            onContextMenu={(e) => e.preventDefault()}
          >
            <MessageSquare className="size-6" />
          </button>
        </Tip>
      )}
    </>
  );
}
