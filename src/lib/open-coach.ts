import { whenCoachReady, useCoach } from "@/lib/coach-store";
import type { CoachMode } from "@/lib/coach-modes";
import type { SetupRowId } from "@/lib/setup-progress";
import { setupKickoff } from "@/lib/setup-progress";
import { abortTalk, sendRoofus } from "@/lib/roofus-talk";

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

export function openSetup(row?: SetupRowId) {
  whenCoachReady(() => {
    abortTalk();
    useCoach.getState().ensureSetup(row);
    useCoach.getState().openSheet();
    const line = row
      ? setupKickoff(row)
      : "Ask the next blank field on the Home setup card. One question. Wait. Do not invent a zip.";
    void sendRoofus(line, { kickoff: true }).catch(() => undefined);
  });
}
