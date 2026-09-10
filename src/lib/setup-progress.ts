/** Home checklist. Forms and the Setup chat write the same fields. */
import { applyWalkAnswer, type WalkPatch } from "./survive.ts";
import type { SurviveState } from "./survive-store.ts";
import { demonFilled, paceFilled, stackFilled, whyFilled } from "./survive-store.ts";

export const SETUP_ROWS = [
  {
    id: "you",
    label: "You",
    hint: "First name and company",
    hash: "you",
    ask: "Ask me my first name, then the company on the truck. One at a time. Explain that you use those on the porch, not a fake name.",
  },
  {
    id: "territory",
    label: "Territory",
    hint: "Counties and state",
    hash: "territory",
    ask: "Ask which counties I knock and which state. One at a time. Explain Streets builds zips from that — you do not invent a town.",
  },
  {
    id: "zips",
    label: "Zips",
    hint: "Age-band list from those counties",
    hash: "zips",
    ask: "Tell me to open Streets from Presets and build zips. You cannot invent zips in chat. Then wait.",
  },
  {
    id: "hours",
    label: "Hours",
    hint: "When you knock",
    hash: "hours",
    ask: "Ask when I knock. Then morning work and when I stop, if blank. One at a time.",
  },
  {
    id: "warranty",
    label: "Warranty",
    hint: "The line you may say",
    hash: "you",
    ask: "Ask for the warranty line I may say on a porch. One sentence. Do not invent a manufacturer promise.",
  },
  {
    id: "why",
    label: "Why",
    hint: "The ladder. Private.",
    hash: "mindset",
    ask: "Walk me through Why. One question. First blank. Private. Not a door.",
  },
  {
    id: "demon",
    label: "Demon",
    hint: "Name it. Private.",
    hash: "mindset",
    ask: "Walk me through naming the demon. One question. Private. Not a door.",
  },
  {
    id: "pace",
    label: "Pace + stack",
    hint: "This week, this month",
    hash: "mindset",
    ask: "Walk Pace first if it is blank, else talent stack. One question. First blank. Not a door.",
  },
] as const;

export type SetupRowId = (typeof SETUP_ROWS)[number]["id"];

export type SetupSnap = {
  goBy: string;
  company: string;
  counties: string;
  states: string;
  knockWindow: string;
  paperWindow: string;
  hardStop: string;
  warranty: string;
  zipCount: number;
  why: boolean;
  demon: boolean;
  pace: boolean;
  stack: boolean;
};

/** Presets company wins. Today-setup leftovers still count. */
export function companyOf(profileCompany: string, settingsCompany: string): string {
  const s = settingsCompany.trim();
  if (s && s !== "Roofus") return s;
  return profileCompany.trim();
}

function isStockWarranty(v: string): boolean {
  const t = v.trim();
  return !t || t === "See the actual Owens Corning warranty.";
}

export function setupSnap(input: {
  goBy: string;
  profileCompany: string;
  settingsCompany: string;
  counties: string;
  states: string;
  knockWindow: string;
  paperWindow: string;
  hardStop: string;
  warranty: string;
  zipCount: number;
  survive: SurviveState;
}): SetupSnap {
  return {
    goBy: input.goBy.trim(),
    company: companyOf(input.profileCompany, input.settingsCompany),
    counties: input.counties.trim(),
    states: input.states.trim(),
    knockWindow: input.knockWindow.trim(),
    paperWindow: input.paperWindow.trim(),
    hardStop: input.hardStop.trim(),
    warranty: isStockWarranty(input.warranty) ? "" : input.warranty.trim(),
    zipCount: input.zipCount,
    why: whyFilled(input.survive),
    demon: demonFilled(input.survive),
    pace: paceFilled(input.survive, input.knockWindow),
    stack: stackFilled(input.survive),
  };
}

export function rowDone(id: SetupRowId, snap: SetupSnap): boolean {
  if (id === "you") return Boolean(snap.goBy && snap.company);
  if (id === "territory") return Boolean(snap.counties && snap.states);
  if (id === "zips") return snap.zipCount > 0;
  if (id === "hours") return Boolean(snap.knockWindow);
  if (id === "warranty") return Boolean(snap.warranty);
  if (id === "why") return snap.why;
  if (id === "demon") return snap.demon;
  return snap.pace && snap.stack;
}

export function setupScore(snap: SetupSnap): { done: number; total: number; ready: boolean } {
  const done = SETUP_ROWS.filter((r) => rowDone(r.id, snap)).length;
  return { done, total: SETUP_ROWS.length, ready: rowDone("territory", snap) };
}

export function nextIncomplete(snap: SetupSnap, prefer?: SetupRowId | null): SetupRowId | null {
  if (prefer && !rowDone(prefer, snap)) return prefer;
  return SETUP_ROWS.find((r) => !rowDone(r.id, snap))?.id ?? null;
}

export function setupKickoff(id: SetupRowId): string {
  return SETUP_ROWS.find((r) => r.id === id)?.ask ?? SETUP_ROWS[0].ask;
}

export type SetupPatch = {
  survive?: WalkPatch["survive"];
  profile?: Partial<{
    goBy: string;
    company: string;
    counties: string;
    states: string;
    knockWindow: string;
    paperWindow: string;
    hardStop: string;
  }>;
  companyName?: string;
  warrantyLine?: string;
};

export function applySetupAnswer(
  id: SetupRowId,
  text: string,
  snap: SetupSnap,
  survive: SurviveState,
): SetupPatch | null {
  const value = text.trim();
  if (!value) return null;
  if (id === "zips") return null;
  if (id === "you") {
    if (!snap.goBy) return { profile: { goBy: value } };
    if (!snap.company) return { companyName: value, profile: { company: value } };
    return null;
  }
  if (id === "territory") {
    if (!snap.counties) return { profile: { counties: value } };
    if (!snap.states) return { profile: { states: value } };
    return null;
  }
  if (id === "hours") {
    if (!snap.knockWindow) return { profile: { knockWindow: value } };
    if (!snap.paperWindow) return { profile: { paperWindow: value } };
    if (!snap.hardStop) return { profile: { hardStop: value } };
    return null;
  }
  if (id === "warranty") {
    if (!snap.warranty) return { warrantyLine: value };
    return null;
  }
  const hours = { knock: snap.knockWindow, paper: snap.paperWindow, stop: snap.hardStop };
  if (id === "pace" && snap.pace && !snap.stack) {
    return applyWalkAnswer("stack", value, survive, hours);
  }
  const walk = id === "pace" ? "pace" : id;
  return applyWalkAnswer(walk, value, survive, hours);
}
