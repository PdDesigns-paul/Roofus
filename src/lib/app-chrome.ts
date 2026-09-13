import type { HelpPageId } from "./page-help.ts";

/** Back only on nested pages. The four Places have no Back. */
export function showBack(path: string): boolean {
  if (path === "/" || path === "/truck" || path === "/today") return false;
  if (path === "/door" || path.startsWith("/coach/cards")) return false;
  if (path === "/roof" || path.startsWith("/coach/inspect")) return false;
  if (path === "/after" || path === "/streets") return false;
  return true;
}

export function helpPageFor(path: string): HelpPageId {
  if (path.startsWith("/truck") || path.startsWith("/today")) return "today";
  if (path.startsWith("/after") || path.startsWith("/streets")) return "streets";
  if (path.startsWith("/roof") || path.startsWith("/coach/inspect")) return "inspect";
  if (path.startsWith("/door") || path.startsWith("/coach/cards")) return "cards";
  if (path.startsWith("/coach/mindset")) return "mindset";
  if (path.startsWith("/coach/reference")) return "reference";
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/coach")) return "coach";
  return "today";
}
