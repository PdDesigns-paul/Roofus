import { useEffect, useLayoutEffect, useState } from "react";
import {
  isOnboardDone,
  markOnboardDone,
  ONBOARD_STEPS,
  subscribeOnboard,
} from "@/lib/onboard";

type Rect = { top: number; left: number; width: number; height: number };

function readRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 8 || r.height < 8) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function OnboardOverlay() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [hole, setHole] = useState<Rect | null>(null);

  useEffect(() => {
    if (!isOnboardDone()) setOpen(true);
    return subscribeOnboard(() => {
      setStep(0);
      setOpen(true);
    });
  }, []);

  const current = ONBOARD_STEPS[step];

  useLayoutEffect(() => {
    if (!open || !current) return;
    function measure() {
      setHole(readRect(current.selector));
    }
    measure();
    const t = window.setInterval(measure, 250);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, current]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function finish() {
    markOnboardDone();
    setOpen(false);
  }

  function next() {
    if (step >= ONBOARD_STEPS.length - 1) finish();
    else setStep((n) => n + 1);
  }

  if (!open || !current) return null;

  const last = step >= ONBOARD_STEPS.length - 1;
  const pad = 6;
  const cut = hole
    ? {
        top: Math.max(0, hole.top - pad),
        left: Math.max(0, hole.left - pad),
        right: hole.left + hole.width + pad,
        bottom: hole.top + hole.height + pad,
        width: hole.width + pad * 2,
        height: hole.height + pad * 2,
      }
    : null;

  const placeCardLow = hole ? hole.top < window.innerHeight * 0.42 : true;
  const cardPos = hole
    ? placeCardLow
      ? { top: Math.min(hole.top + hole.height + 16, window.innerHeight - 210) }
      : { bottom: Math.max(window.innerHeight - hole.top + 16, 88) }
    : { top: 96 };

  return (
    <div className="fixed inset-0" style={{ zIndex: 80 }} role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {cut ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-fg/55" style={{ height: cut.top }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-fg/55" style={{ top: cut.bottom }} />
          <div
            className="pointer-events-none absolute bg-fg/55"
            style={{ top: cut.top, left: 0, width: cut.left, height: cut.height }}
          />
          <div
            className="pointer-events-none absolute bg-fg/55"
            style={{ top: cut.top, left: cut.right, right: 0, height: cut.height }}
          />
          <div
            className="pointer-events-none absolute rounded-xl ring-2 ring-accent"
            style={{ top: cut.top, left: cut.left, width: cut.width, height: cut.height }}
          />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-fg/55" />
      )}

      <button type="button" aria-label="Next tip" className="absolute inset-0 cursor-default" onClick={next} />

      <div
        className="absolute left-1/2 max-w-sm -translate-x-1/2 rounded-2xl border border-border bg-paper p-4"
        style={{ ...cardPos, width: "min(20rem, calc(100% - 2rem))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-faint">
          {step + 1} of {ONBOARD_STEPS.length}
        </p>
        <h2 id="tour-title" className="mt-1 font-display text-xl leading-tight">
          {current.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{current.body}</p>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            className="h-11 flex-1 rounded-full bg-fg text-sm text-paper"
            onClick={next}
          >
            {last ? "Got it" : "Next"}
          </button>
          {last ? null : (
            <button type="button" className="h-11 px-4 text-sm text-muted" onClick={finish}>
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
