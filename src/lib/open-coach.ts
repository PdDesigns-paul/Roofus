import { whenCoachReady, useCoach } from "@/lib/coach-store";

export function openCoach(mode: "resume" | "new" = "resume") {
  whenCoachReady(() => {
    if (mode === "new") useCoach.getState().startNew({ mode: "live" });
    else useCoach.getState().resume();
    useCoach.getState().openSheet();
  });
}

export function openCoachThread(id: string) {
  whenCoachReady(() => {
    useCoach.getState().openThread(id);
    useCoach.getState().openSheet();
  });
}
