/**
 * Roofus writes the book from what they said.
 * Setup already fills the open row. This catches explicit sets
 * (website, name, company, counties, hours, warranty) in Live too.
 * Do not invent a zip here — Streets still builds those.
 */
import { looksLikeWebsite, normalizeWebsiteUrl } from "./company-site.ts";
import { applySetupAnswer, type SetupPatch, type SetupRowId, type SetupSnap } from "./setup-progress.ts";
import type { SurviveState } from "./survive-store.ts";

export type CoachWrite = SetupPatch & { companyWebsite?: string };

const NAME = /^(?:call me|i go by|my name is)\s+([A-Za-z][A-Za-z' -]{0,32})$/i;
const COMPANY = /^(?:(?:the )?company(?: name)? is|i work for|i'm with)\s+(.+)$/i;
const COUNTIES = /^(?:(?:my )?count(?:y|ies)(?: are| is)?|i knock in)\s+(.+)$/i;
const STATE = /^(?:(?:my )?state is)\s+([A-Za-z][A-Za-z .]{0,24})$/i;
const KNOCK = /^(?:i knock|knock hours?|when i knock(?: is)?)\s*:?\s+(.+)$/i;
const WARRANTY = /^(?:warranty(?: line)? is)\s+(.+)$/i;
const SITE = /^(?:(?:my |the )?(?:website|site|url) is)\s+(\S+)$/i;

export function applyCoachWrite(
  text: string,
  snap: SetupSnap,
  survive: SurviveState,
  setupRow?: SetupRowId | null,
): CoachWrite | null {
  const value = text.trim();
  if (!value) return null;

  if (setupRow) {
    const fromRow = applySetupAnswer(setupRow, value, snap, survive);
    if (fromRow) {
      const site = websiteFrom(value);
      return site ? { ...fromRow, companyWebsite: site } : fromRow;
    }
  }

  const site = websiteFrom(value);
  if (site) return { companyWebsite: site };

  const name = NAME.exec(value);
  if (name?.[1]) return { profile: { goBy: name[1].trim() } };

  const company = COMPANY.exec(value);
  if (company?.[1]) {
    const c = company[1].trim();
    return { profile: { company: c } };
  }

  const counties = COUNTIES.exec(value);
  if (counties?.[1]) return { profile: { counties: counties[1].trim() } };

  const state = STATE.exec(value);
  if (state?.[1]) return { profile: { states: state[1].trim() } };

  const knock = KNOCK.exec(value);
  if (knock?.[1]) return { profile: { knockWindow: knock[1].trim() } };

  const warranty = WARRANTY.exec(value);
  if (warranty?.[1]) return { warrantyLine: warranty[1].trim() };

  return null;
}

function websiteFrom(value: string): string | null {
  const labeled = SITE.exec(value);
  const raw = labeled?.[1] ?? (looksLikeWebsite(value) ? value : "");
  return raw ? normalizeWebsiteUrl(raw) : null;
}
