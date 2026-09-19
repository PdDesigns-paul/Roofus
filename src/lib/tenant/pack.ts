/** Tenant pack the shell and coach read. Roofus is pack zero. Types stay five. */

export type TourStep = {
  id: string;
  title: string;
  body: string;
  sample?: boolean;
};

export type PocketLine = { say?: string; note?: string };

export type PocketCard = {
  id: string;
  mode: "live" | "roleplay" | "mindset";
  scene?: string;
  title: string;
  when: string;
  formula: string;
  lines: PocketLine[];
};

export type RoleplayScene = {
  id: string;
  label: string;
  hint: string;
  brief: string;
  /** Roleplay kickoff. `[who]` is the person prompt, plus year when they set one. */
  knockLine: string;
  claim?: boolean;
};

export type RoleplayWho = {
  id: string;
  label: string;
  prompt: string;
};

export type PackBriefs = {
  live: string;
  roleplay: string;
  mindset: string;
  setup: string;
  claimCold: string;
};

export type PackHelp = {
  door: readonly string[];
  inspect: readonly string[];
  coach: readonly string[];
};

export type PackStarters = {
  live: readonly string[];
  roleplay: readonly string[];
  mindset: readonly string[];
};

export type BrandPack = {
  id: string;
  productName: string;
  talkName: string;
  places: { today: string; door: string; inspect: string; plan: string };
  markSrc: string;
  pwa: { name: string; themeColor: string };
  tokens: {
    accent: string;
    paper: string;
    displayFont: string;
    goldHi: string;
    goldCoin: string;
    goldMid: string;
    goldLo: string;
  };
  copy: {
    askHowTodayWent: string;
    askTalk: string;
    talkAria: string;
    tour: readonly TourStep[];
  };
  /** Claim path / Keep-gating. Off for a tenant that does not sell insurance. */
  modules: { claim: boolean };
  cards: readonly PocketCard[];
  claimCard?: PocketCard;
  scenes: readonly RoleplayScene[];
  who: readonly RoleplayWho[];
  claimStages: readonly RoleplayWho[];
  briefs: PackBriefs;
  starters: PackStarters;
  /** Script B, age-first, i35, claim, warranty — not kernel honesty. */
  promptModules: string;
  help: PackHelp;
};

/** CSS variables set on <html>. Fallbacks in styles.css must match pack `roofus`. */
export function packStyle(pack: BrandPack): Record<string, string> {
  return {
    "--pack-accent": pack.tokens.accent,
    "--pack-paper": pack.tokens.paper,
    "--pack-display-font": pack.tokens.displayFont,
    "--pack-gold-hi": pack.tokens.goldHi,
    "--pack-gold-coin": pack.tokens.goldCoin,
    "--pack-gold-mid": pack.tokens.goldMid,
    "--pack-gold-lo": pack.tokens.goldLo,
  };
}
