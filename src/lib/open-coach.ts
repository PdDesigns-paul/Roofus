import { whenCoachReady, useCoach } from "@/lib/coach-store";
import type { CoachMode } from "@/lib/rufus-modes";

export function openCoach(mode: "resume" | "new" = "resume") {
  whenCoachReady(() => {
    if (mode === "new") useCoach.getState().startNew({ mode: "live" });
    else useCoach.getState().resume();
    useCoach.getState().openSheet();
  });
}

export function openCoachMode(mode: CoachMode) {
  whenCoachReady(() => {
    useCoach.getState().startNew({ mode });
    useCoach.getState().openSheet();
  });
}

export function openCoachThread(id: string) {
  whenCoachReady(() => {
    useCoach.getState().openThread(id);
    useCoach.getState().openSheet();
  });
}
