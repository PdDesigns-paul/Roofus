/** Settings checklist. Forms and the Setup chat write the same fields. */
import { applyWalkAnswer, type WalkPatch } from "./survive.ts";
import { looksLikeWebsite, normalizeWebsiteUrl } from "./company-site.ts";
import type { SurviveState } from "./survive-store.ts";
import { demonFilled, paceFilled, stackFilled, whyFilled } from "./survive-store.ts";

export const SETUP_ROWS = [
  {
    id: "you",
    label: "You",
    hint: "First name, company, website",
    path: "/settings/you",
    ask: "Ask me my first name, then the company on the truck, then the company website if we have one. One at a time. Website is optional. You use name and company on the porch. You may read the website for product talk — you do not invent a URL.",
  },
  {
    id: "territory",
    label: "Territory",
    hint: "Counties and state",
    path: "/settings/territory",
    ask: "Ask which counties I knock and which state. One at a time. Explain Streets builds park-once loops from that — you do not invent a town.",
  },
  {
    id: "zips",
    label: "Zips",
    hint: "Age-band loops from those counties",
    path: "/after",
    ask: "Tell me to open Prep and build loops. You cannot invent zips or subdivision names in chat. Then wait.",
  },
  {
    id: "hours",
    label: "Hours",
    hint: "When you knock",
    path: "/settings/hours",
    ask: "Ask when I knock. Then morning work and when I stop, if blank. One at a time.",
  },
  {
    id: "warranty",
    label: "Warranty",
    hint: "The line you may say",
    path: "/settings/you",
    ask: "Ask for the warranty line I may say on a porch. One sentence. Do not invent a manufacturer promise.",
  },
  {
    id: "why",
    label: "Why",
    hint: "The ladder. Private.",
    path: "/settings/mindset",
    ask: "Walk me through Why. One question. First blank. Private. Not a door.",
  },
  {
    id: "demon",
    label: "Demon",
    hint: "Name it. Private.",
    path: "/settings/mindset",
    ask: "Walk me through naming the demon. One question. Private. Not a door.",
  },
  {
    id: "pace",
    label: "Pace + stack",
    hint: "This week, this month",
    path: "/settings/mindset",
    ask: "Walk Pace first if it is blank, else talent stack. One question. First blank. Not a door.",
  },
] as const;

export type SetupRowId = (typeof SETUP_ROWS)[number]["id"];
export type SetupRowPath = (typeof SETUP_ROWS)[number]["path"];

export type SettingsHashTarget =
  | "/settings/you"
  | "/settings/territory"
  | "/settings/hours"
  | "/after"
  | "/settings/mindset"
  | "/settings/reminders"
  | "/settings/backup";

const HASH_PATH: Record<string, SettingsHashTarget> = {
  you: "/settings/you",
  warranty: "/settings/you",
  territory: "/settings/territory",
  hours: "/settings/hours",
  zips: "/after",
  mindset: "/settings/mindset",
  why: "/settings/mindset",
  demon: "/settings/mindset",
  pace: "/settings/mindset",
  stack: "/settings/mindset",
  reminders: "/settings/reminders",
  backup: "/settings/backup",
};

/** Old `#you` bookmarks land on the sub page. Unknown hashes stay put. */
export function settingsHashPath(hash: string): SettingsHashTarget | undefined {
  const id = hash.replace(/^#/, "").trim().toLowerCase();
  if (!id) return undefined;
  return HASH_PATH[id];
}

export function setupRowPath(id: SetupRowId): SetupRowPath {
  return SETUP_ROWS.find((r) => r.id === id)?.path ?? "/settings/you";
}

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

/** The book is profile.company. Leftover Settings company still counts until adopt runs. */
export function companyOf(profileCompany: string, settingsCompany = ""): string {
  const p = profileCompany.trim();
  if (p) return p;
  const s = settingsCompany.trim();
  if (s && s !== "Roofus") return s;
  return "";
}

function isStockWarranty(v: string): boolean {
  const t = v.trim();
  return !t || t === "See the actual Owens Corning warranty.";
}

export function setupSnap(input: {
  goBy: string;
  profileCompany: string;
  settingsCompany?: string;
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
    company: companyOf(input.profileCompany, input.settingsCompany ?? ""),
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

/** Truck Setup leaves once name, company, and one county exist. */
export function truckSetupOpen(snap: SetupSnap): boolean {
  return !snap.goBy || !snap.company || !snap.counties;
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
  warrantyLine?: string;
  companyWebsite?: string;
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
    if (looksLikeWebsite(value)) {
      const url = normalizeWebsiteUrl(value);
      return url ? { companyWebsite: url } : null;
    }
    if (!snap.goBy) return { profile: { goBy: value } };
    if (!snap.company) return { profile: { company: value } };
    const url = normalizeWebsiteUrl(value);
    if (url) return { companyWebsite: url };
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
