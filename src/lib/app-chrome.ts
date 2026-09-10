import type { HelpPageId } from "./page-help.ts";

/** Back and Home hide here — the tabs (or the porch) already are home. */
export function showBackHome(path: string): boolean {
  if (path === "/" || path === "/today") return false;
  if (path.startsWith("/streets")) return false;
  if (path.startsWith("/coach/inspect")) return false;
  return true;
}

export function helpPageFor(path: string): HelpPageId {
  if (path.startsWith("/today")) return "today";
  if (path.startsWith("/streets")) return "streets";
  if (path.startsWith("/coach/inspect")) return "inspect";
  if (path.startsWith("/coach/cards")) return "cards";
  if (path.startsWith("/coach/mindset")) return "mindset";
  if (path.startsWith("/coach/reference")) return "reference";
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/coach")) return "coach";
  return "home";
}
