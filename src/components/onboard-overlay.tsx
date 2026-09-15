import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDayBook } from "@/lib/day-book";
import { loadDemo } from "@/lib/demo-data";
import { isOnboardDone, markOnboardDone, ONBOARD_STEPS, subscribeOnboard } from "@/lib/onboard";

export function OnboardOverlay() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const emptyBook = !useDayBook((s) => s.profile.counties).trim();

  useEffect(() => {
    if (!isOnboardDone()) {
      setStep(0);
      setOpen(true);
    }
    return subscribeOnboard(() => {
      setStep(0);
      setOpen(true);
    });
  }, []);

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

  const current = ONBOARD_STEPS[step];
  if (!open || !current) return null;

  const last = step >= ONBOARD_STEPS.length - 1;
  const offerSample = last && emptyBook && "sample" in current && current.sample;

  const node = (
    <div
      className="fixed inset-0 flex items-end justify-center bg-fg/40"
      style={{ zIndex: 80 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="flex h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl border border-border bg-paper px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_40px_rgba(0,0,0,0.18)]">
        <div className="flex shrink-0 justify-center pt-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-faint">
          {step + 1} of {ONBOARD_STEPS.length}
        </p>
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <h2 id="tour-title" className="font-display text-3xl leading-tight">
            {current.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">{current.body}</p>
        </div>
        <div className="flex justify-center gap-1.5 py-5" aria-hidden>
          {ONBOARD_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={i === step ? "h-1.5 w-4 rounded-full bg-accent" : "size-1.5 rounded-full bg-border"}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button className="min-h-12 flex-1" onClick={next}>
            {last ? "Got it" : "Next"}
          </Button>
          <Button variant="outline" className="min-h-12" onClick={finish}>
            Skip
          </Button>
        </div>
        {offerSample ? (
          <Button
            variant="outline"
            className="mt-2 min-h-12 w-full"
            onClick={() => {
              loadDemo();
              finish();
              void navigate({ to: "/after" });
            }}
          >
            Load a sample day
          </Button>
        ) : null}
      </div>
    </div>
  );

  return typeof document === "undefined" ? node : createPortal(node, document.body);
}
