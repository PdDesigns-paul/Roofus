/** Brand pack the shell reads. Roofus is pack zero. Types stay five. */

export type TourStep = {
  id: string;
  title: string;
  body: string;
  sample?: boolean;
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
