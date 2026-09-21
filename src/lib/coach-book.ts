import type { CoachBook } from "./coach-tools.ts";

export function bookFromRequest(req: CoachBook & { hat?: string | null }): CoachBook {
  return {
    workingLoop: req.workingLoop,
    keptStorms: req.keptStorms,
    faqs: req.faqs,
    surviveSnap: req.surviveSnap,
    pinCounts: req.pinCounts,
    scene: req.scene,
    mode: req.mode ?? req.hat,
    companyWebsite: req.companyWebsite,
    companySitePages: req.companySitePages,
  };
}
