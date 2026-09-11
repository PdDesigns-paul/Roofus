import type { HelpPageId } from "./page-help.ts";

/** Back only on nested pages. Home is a tab. Streets lives in Presets. */
export function showBack(path: string): boolean {
  if (path === "/" || path === "/today") return false;
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
