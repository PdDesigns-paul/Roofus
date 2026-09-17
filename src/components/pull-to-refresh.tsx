import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { PULL_THRESHOLD, pullArmed, pullBlocked, pullOffset, scrollerAtTop } from "@/lib/pull-refresh";

export function PullToRefresh({ children }: { children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const startY = useRef(0);
  const tracking = useRef(false);
  const pullRef = useRef(0);

  useEffect(() => {
    function onStart(e: TouchEvent) {
      if (busy || e.touches.length !== 1) return;
      const t = e.touches[0];
      if (pullBlocked(e.target)) return;
      if (!scrollerAtTop(e.target, window.scrollY)) return;
      startY.current = t.clientY;
      tracking.current = true;
    }

    function onMove(e: TouchEvent) {
      if (!tracking.current || busy) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 8 && pullRef.current === 0) return;
      if (dy > 0 && window.scrollY <= 0) {
        if (e.cancelable) e.preventDefault();
        const next = pullOffset(dy);
        pullRef.current = next;
        setPull(next);
      } else {
        tracking.current = false;
        pullRef.current = 0;
        setPull(0);
      }
    }

    function onEnd() {
      if (!tracking.current) return;
      tracking.current = false;
      if (pullArmed(pullRef.current)) {
        setBusy(true);
        setPull(PULL_THRESHOLD);
        window.location.reload();
        return;
      }
      pullRef.current = 0;
      setPull(0);
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [busy]);

  const show = busy || pull > 4;
  const spinning = busy || pullArmed(pull);

  return (
    <div>
      <div
        className="pointer-events-none fixed inset-x-0 z-30 flex justify-center"
        style={{
          top: "calc(env(safe-area-inset-top) + 0.4rem)",
          opacity: show ? 1 : 0,
        }}
        aria-hidden
      >
        <Loader2 className={spinning ? "size-6 animate-spin text-fg" : "size-6 text-faint"} />
      </div>
      <div
        style={{
          transform: `translateY(${busy ? 48 : pull}px)`,
          transition: tracking.current ? "none" : "transform 160ms ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
